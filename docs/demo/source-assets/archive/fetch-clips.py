#!/usr/bin/env python3
"""Recreate the silent archive selects listed in clips.json. Needs curl and ffmpeg."""
import json
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parent
clips = json.loads((root / "clips.json").read_text())
with tempfile.TemporaryDirectory(prefix="underclass-archive-") as temporary:
    cache = Path(temporary)
    for clip in clips:
        original = cache / (clip["source"] + ".mp4")
        if not original.exists():
            subprocess.run(["curl", "-fL", "--retry", "2", "-o", str(original), clip["download"]], check=True)
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-ss", str(clip["start"]), "-i", str(original),
            "-t", str(clip["duration"]), "-an", "-vf", "setsar=1", "-r", "30",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", str(root / (clip["id"] + ".mp4"))
        ], check=True)
