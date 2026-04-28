"""
WAVR Stem Separation Server
Uses Demucs to split beats into stems (drums, bass, melody, other)
Uses librosa to detect BPM and musical key.

Setup:
  pip install flask demucs librosa

Run:
  python stems_server.py

Set in .env.local:
  STEMS_WORKER_URL=http://localhost:5050
"""

import os
import tempfile
import subprocess
import shutil
import numpy as np
from pathlib import Path
import sys
from flask import Flask, request, jsonify

app = Flask(__name__)

UPLOADS_BASE = Path(__file__).parent / "public" / "uploads"
STEMS_OUT = UPLOADS_BASE / "stems"
STEMS_OUT.mkdir(parents=True, exist_ok=True)

@app.route("/")
def health_check():
    return {"status": "success", "message": "WAVR Stems Server is Running"}, 200

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


@app.route("/health")
def health():
    return jsonify({"ok": True})


import random

# Curated vocabulary for "AI" naming
_NAME_PARTS = {
    "energetic": ["Nova", "Apex", "Volt", "Pulse", "Reactor", "Zenith", "Turbo", "Ignite", "Velocity", "Strike"],
    "dark": ["Ghost", "Shadow", "Void", "Abyss", "Phantom", "Onyx", "Eclipse", "Grim", "Viper", "Wraith"],
    "melodic": ["Ethereal", "Velvet", "Lush", "Silk", "Dream", "Bloom", "Aura", "Harmonix", "Flow", "Serene"],
    "trap": ["Mula", "Glacier", "Ice", "Vault", "Empire", "Crown", "Hustle", "Legacy", "Code", "Risk"],
    "chill": ["Drift", "Haze", "Luna", "Mist", "Solace", "Quartz", "Pacific", "Echo", "Static", "Bloom"],
}

def generate_title(bpm, key, genre, mood):
    # Determine vibe
    vibe = "chill"
    if bpm > 130: vibe = "energetic"
    if "Minor" in key: vibe = "dark"
    if genre.lower() in ["trap", "drill"]: vibe = "trap"
    if mood.lower() in ["chill", "happy"]: vibe = "chill"
    if mood.lower() in ["melancholic", "dark"]: vibe = "dark"
    
    prefixes = _NAME_PARTS.get(vibe, ["Vibe"])
    suffixes = ["Wave", "Type Beat", "Mode", "Soul", "Logic", "State", "Mind", "Flow", "Night", "Day"]
    
    # Mix and match
    name = f"{random.choice(prefixes)} {random.choice(suffixes)}"
    return name


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    POST multipart/form-data with field 'audio'.
    Optional fields: 'genre', 'mood'
    Returns { bpm: int, key: str, suggestedTitle: str }
    """
    try:
        import librosa
    except ImportError:
        return jsonify({"error": "librosa not installed — run: pip install librosa"}), 500

    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided (field: audio)"}), 400

    audio_file = request.files["audio"]
    genre = request.form.get("genre", "Other")
    mood = request.form.get("mood", "Neutral")
    
    suffix = Path(audio_file.filename or "audio.mp3").suffix or ".mp3"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name

    try:
        # Load up to 120 s for speed; use native sample rate
        y, sr = librosa.load(tmp_path, sr=None, mono=True, duration=120)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = int(round(float(np.atleast_1d(tempo)[0])))
        key = detect_key(y, sr)
        
        suggested_title = generate_title(bpm, key, genre, mood)
        
        return jsonify({
            "bpm": bpm, 
            "key": key, 
            "suggestedTitle": suggested_title
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass



@app.route("/process", methods=["POST"])
def process():
    data = request.json
    beat_id   = data.get("beatId")
    audio_path = data.get("audioPath")

    if not beat_id or not audio_path:
        return jsonify({"error": "beatId and audioPath required"}), 400

    print(f"[Process] beatId={beat_id}, audioPath={audio_path}")
    abs_audio = Path(__file__).parent / "public" / audio_path.lstrip("/")
    print(f"[Process] abs_audio={abs_audio}")
    if not abs_audio.exists():
        print(f"[Process] Error: Audio file not found: {abs_audio}")
        return jsonify({"error": f"Audio file not found: {abs_audio}"}), 400

    out_dir = STEMS_OUT / beat_id
    print(f"[Process] out_dir={out_dir}")
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        cmd = [sys.executable, "-m", "demucs", "-n", "htdemucs", "-o", str(out_dir), str(abs_audio)]
        print(f"[Demucs] Running: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True, 
            text=True, 
            timeout=900 # Increased to 15 mins
        )
        
        if result.returncode != 0:
            print(f"[Demucs Error] Return code: {result.returncode}")
            print(f"[Demucs Stderr] {result.stderr}")
            print(f"[Demucs Stdout] {result.stdout}")
            return jsonify({
                "error": "Demucs separation failed", 
                "detail": result.stderr,
                "code": result.returncode
            }), 500

        # Demucs structure: {out_dir}/htdemucs/{filename_stem}/*.wav
        # Note: Demucs usually uses the filename without extension.
        stem_name = abs_audio.stem
        model_name = "htdemucs"
        stem_folder = out_dir / model_name / stem_name
        
        print(f"[Demucs] Checking for output in: {stem_folder}")
        
        if not stem_folder.exists():
            # Sometimes Demucs preserves spaces or special characters differently
            # Let's look for any subfolder in {out_dir}/htdemucs/
            subfolders = list((out_dir / model_name).iterdir()) if (out_dir / model_name).exists() else []
            if subfolders:
                stem_folder = subfolders[0]
                print(f"[Demucs] Using fallback subfolder: {stem_folder}")
            else:
                return jsonify({
                    "error": "Demucs finished but output folder was not found.",
                    "checked": str(stem_folder)
                }), 500

        name_map = {"drums": "drums", "bass": "bass", "vocals": "melody", "other": "other"}
        stems = []
        for demucs_name, platform_name in name_map.items():
            src = stem_folder / f"{demucs_name}.wav"
            # Fallback for different models if they use different extensions
            if not src.exists():
                src = stem_folder / f"{demucs_name}.mp3"
            
            if src.exists():
                dest = out_dir / f"{beat_id}_{platform_name}.wav"
                print(f"[Demucs] Copying {src.name} -> {dest.name}")
                shutil.copy(src, dest)
                stems.append({
                    "type": platform_name, 
                    "filePath": f"/uploads/stems/{beat_id}/{beat_id}_{platform_name}.wav"
                })

        if not stems:
            return jsonify({"error": "No stem files were generated", "path": str(stem_folder)}), 500

        print(f"[Demucs] Success! Generated {len(stems)} stems.")
        return jsonify({"ok": True, "stems": stems})

    except subprocess.TimeoutExpired:
        print("[Demucs] Process timed out after 900s")
        return jsonify({"error": "Stem separation timed out (900s)"}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print(f"WAVR Stem Server running on http://localhost:{port}")
    print("Deps: pip install flask demucs librosa")
    app.run(host="0.0.0.0", port=port, debug=False)
