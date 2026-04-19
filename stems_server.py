"""
WAVR Stem Separation Server
Uses Demucs to split beats into stems (drums, bass, melody, other)

Setup:
  pip install flask demucs

Run:
  python stems_server.py

Set in .env.local:
  STEMS_WORKER_URL=http://localhost:5050
"""

import os
import json
import subprocess
import shutil
from pathlib import Path
from flask import Flask, request, jsonify

app = Flask(__name__)

# Adjust to your project's public uploads directory
UPLOADS_BASE = Path(__file__).parent / "public" / "uploads"
STEMS_OUT = UPLOADS_BASE / "stems"
STEMS_OUT.mkdir(parents=True, exist_ok=True)


@app.route("/health")
def health():
    return jsonify({"ok": True})


@app.route("/process", methods=["POST"])
def process():
    data = request.json
    beat_id = data.get("beatId")
    audio_path = data.get("audioPath")  # relative path like /uploads/beats/file.mp3

    if not beat_id or not audio_path:
        return jsonify({"error": "beatId and audioPath required"}), 400

    # Resolve absolute path (strip leading slash)
    abs_audio = Path(__file__).parent / "public" / audio_path.lstrip("/")
    if not abs_audio.exists():
        return jsonify({"error": f"Audio file not found: {abs_audio}"}), 400

    out_dir = STEMS_OUT / beat_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Run Demucs 4-stem separation
        result = subprocess.run(
            ["python", "-m", "demucs", "--two-stems", "no",
             "-n", "htdemucs", "-o", str(out_dir), str(abs_audio)],
            capture_output=True, text=True, timeout=300
        )
        if result.returncode != 0:
            print("[Demucs error]", result.stderr)
            return jsonify({"error": "Demucs failed", "detail": result.stderr}), 500

        # Demucs output: out_dir/htdemucs/<filename_no_ext>/{drums,bass,other,vocals}.wav
        stem_folder = out_dir / "htdemucs" / abs_audio.stem
        if not stem_folder.exists():
            return jsonify({"error": f"Expected output folder not found: {stem_folder}"}), 500

        # Map Demucs names → platform names
        name_map = {"drums": "drums", "bass": "bass", "vocals": "melody", "other": "other"}
        stems = []
        for demucs_name, platform_name in name_map.items():
            src = stem_folder / f"{demucs_name}.wav"
            if src.exists():
                dest = out_dir / f"{beat_id}_{platform_name}.wav"
                shutil.copy(src, dest)
                # Return web-accessible path
                web_path = f"/uploads/stems/{beat_id}/{beat_id}_{platform_name}.wav"
                stems.append({"type": platform_name, "filePath": web_path})

        return jsonify({"ok": True, "stems": stems})

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Stem separation timed out (300s)"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print(f"WAVR Stem Server running on http://localhost:{port}")
    print("Make sure Demucs is installed: pip install demucs")
    app.run(host="0.0.0.0", port=port)
