import os
import tempfile
import subprocess
import shutil
import requests
import numpy as np
from pathlib import Path
import sys
from flask import Flask, request, jsonify

app = Flask(__name__)
# Allow large file uploads (up to 100MB)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024 

# Configurable paths for cloud environments
# Default to local public/uploads if env var not set
UPLOADS_BASE = Path(os.environ.get("UPLOADS_BASE", Path(__file__).parent / "public" / "uploads"))
STEMS_OUT = UPLOADS_BASE / "stems"
STEMS_OUT.mkdir(parents=True, exist_ok=True)

@app.route("/")
def health_check():
    return {"status": "success", "message": "WAVR Stems Worker is Running on Hugging Face"}, 200

# Krumhansl-Schmuckler key profiles
_MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
_MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
_NOTE_NAMES    = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

def detect_key(y, sr):
    try:
        import librosa
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_mean = chroma.mean(axis=1)
        best_score, best_key = -np.inf, "C Major"
        for i in range(12):
            rotated = np.roll(chroma_mean, -i)
            maj = np.corrcoef(rotated, _MAJOR_PROFILE)[0, 1]
            mn  = np.corrcoef(rotated, _MINOR_PROFILE)[0, 1]
            if maj > best_score:
                best_score, best_key = maj, f"{_NOTE_NAMES[i]} Major"
            if mn > best_score:
                best_score, best_key = mn, f"{_NOTE_NAMES[i]} Minor"
        return best_key
    except Exception:
        return "Unknown"

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        import librosa
    except ImportError:
        return jsonify({"error": "librosa not installed"}), 500

    audio_url = request.form.get("audioUrl")
    if not audio_url and "audio" not in request.files:
        return jsonify({"error": "No audio provided"}), 400

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        if audio_url:
            r = requests.get(audio_url, stream=True)
            for chunk in r.iter_content(chunk_size=8192):
                tmp.write(chunk)
        else:
            request.files["audio"].save(tmp.name)
        tmp_path = tmp.name

    try:
        y, sr = librosa.load(tmp_path, sr=None, mono=True, duration=120)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = int(round(float(np.atleast_1d(tempo)[0])))
        key = detect_key(y, sr)
        return jsonify({"bpm": bpm, "key": key})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.unlink(tmp_path)

@app.route("/process", methods=["POST"])
def process():
    data = request.json or {}
    beat_id = data.get("beatId")
    audio_path = data.get("audioPath") # Local path
    audio_url = data.get("audioUrl")   # Remote URL
    callback_url = data.get("callbackUrl")

    if not beat_id or (not audio_path and not audio_url):
        return jsonify({"error": "beatId and (audioPath or audioUrl) required"}), 400

    # Determine audio source
    temp_audio = None
    if audio_url:
        print(f"[Worker] Downloading audio from {audio_url}")
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            r = requests.get(audio_url, stream=True)
            for chunk in r.iter_content(chunk_size=8192):
                tmp.write(chunk)
            abs_audio = Path(tmp.name)
            temp_audio = abs_audio
    else:
        abs_audio = Path(__file__).parent / "public" / audio_path.lstrip("/")

    if not abs_audio.exists():
        return jsonify({"error": f"Audio file not found"}), 400

    out_dir = STEMS_OUT / beat_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        cmd = [sys.executable, "-m", "demucs", "-n", "htdemucs", "-o", str(out_dir), str(abs_audio)]
        print(f"[Demucs] Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
        
        if result.returncode != 0:
            return jsonify({"error": "Demucs separation failed", "detail": result.stderr}), 500

        stem_folder = out_dir / "htdemucs" / abs_audio.stem
        if not stem_folder.exists():
            # Fallback for special characters
            subdirs = [d for d in (out_dir / "htdemucs").iterdir() if d.is_dir()]
            if subdirs: stem_folder = subdirs[0]
            else: return jsonify({"error": "Output folder not found"}), 500

        name_map = {"drums": "drums", "bass": "bass", "vocals": "melody", "other": "other"}
        stems = []
        for demucs_name, platform_name in name_map.items():
            src = stem_folder / f"{demucs_name}.wav"
            if not src.exists(): src = stem_folder / f"{demucs_name}.mp3"
            
            if src.exists():
                dest = out_dir / f"{beat_id}_{platform_name}.wav"
                shutil.copy(src, dest)
                stems.append({
                    "type": platform_name, 
                    "filePath": f"/uploads/stems/{beat_id}/{beat_id}_{platform_name}.wav"
                })

        # If callbackUrl is provided, upload stems back to main server
        if callback_url and stems:
            print(f"[Worker] Sending stems to callback: {callback_url}")
            files = {}
            for s in stems:
                local_path = out_dir / f"{beat_id}_{s['type']}.wav"
                files[s['type']] = open(local_path, "rb")
            
            requests.post(callback_url, data={"beatId": beat_id}, files=files)
            for f in files.values(): f.close()

        return jsonify({"ok": True, "stems": stems})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if temp_audio and temp_audio.exists():
            os.unlink(temp_audio)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    app.run(host="0.0.0.0", port=port, debug=False)
