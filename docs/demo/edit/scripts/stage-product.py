"""Stage approved capture clips with frame-exact durations and seekable GOPs.

Usage: python3 scripts/stage-product.py /path/to/approved/room-clips
Input names: arrival.mp4, ticket.mp4, waiting.mp4, window.mp4, outside.mp4. Keep source evidence and capture notes alongside the originals.
"""
from pathlib import Path
import argparse
import json
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
args = parser.parse_args()
project = Path(__file__).resolve().parents[1]
destination = project / 'assets' / 'product'
destination.mkdir(parents=True, exist_ok=True)
# Preserve sufficient source handles for the 60-second edit.
durations = dict(arrival=8, ticket=12, waiting=7, window=10, outside=6)
for name in durations:
    if not (args.source / f'{name}.mp4').is_file():
        raise SystemExit(f'Missing approved capture: {name}.mp4')
report = []
for name, duration in durations.items():
    source = args.source / f'{name}.mp4'
    target = destination / source.name
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
        '-vf', 'fps=30,tpad=stop_mode=clone:stop_duration=10', '-t', str(duration),
        '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '16',
        '-g', '30', '-keyint_min', '30', '-sc_threshold', '0',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(target),
    ], check=True)
    probe = subprocess.run([
        'ffprobe', '-v', 'error', '-show_entries',
        'stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration,size',
        '-of', 'json', str(target),
    ], capture_output=True, text=True, check=True)
    report.append({'clip': name, 'expectedDuration': duration, **json.loads(probe.stdout)})
for name, frames in [('waiting', 191), ('outside', 161)]:
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
        '-i', str(destination / f'{name}.mp4'),
        '-vf', 'fps=30,tpad=stop_mode=clone:stop_duration=3',
        '-frames:v', str(frames), '-an', '-c:v', 'libx264',
        '-preset', 'fast', '-crf', '16', '-g', '30',
        '-keyint_min', '30', '-sc_threshold', '0', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', str(destination / f'{name}-hold.mp4'),
    ], check=True)
(project / 'product-validation.json').write_text(json.dumps(report, indent=2) + '\n')
print('Staged five current captures and two outgoing holds with one-second keyframes.')
