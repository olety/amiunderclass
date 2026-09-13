"""Extract the seven delivery proof frames from the final encoded master."""
from pathlib import Path
import json
import subprocess

project = Path(__file__).resolve().parents[1]
demo = project.parent
master = demo / 'underclass-demo.mp4'
if not master.is_file():
    raise SystemExit('Render underclass-demo.mp4 first.')
frames = demo / 'frames'
frames.mkdir(exist_ok=True)
points = [
    ('01-cold-open', 4), ('02-question', 16), ('03-ticket', 21),
    ('04-waiting', 32.8), ('05-window', 36.5), ('06-paper', 42), ('07-exit', 58),
]
for name, time in points:
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(time),
        '-i', str(master), '-frames:v', '1', str(frames / f'{name}.png'),
    ], check=True)
(frames / 'index.json').write_text(json.dumps([
    {'section': name, 'timeSeconds': time, 'file': f'{name}.png'}
    for name, time in points
], indent=2) + '\n')
inputs = sum((['-i', str(frames / f'{name}.png')] for name, _ in points), [])
filters = ';'.join(f'[{i}:v]scale=640:360[v{i}]' for i in range(len(points)))
filters += ';' + ''.join(f'[v{i}]' for i in range(len(points)))
filters += 'xstack=inputs=7:layout=0_0|640_0|1280_0|0_360|640_360|1280_360|0_720:fill=0x1B1B1D[out]'
subprocess.run([
    'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *inputs,
    '-filter_complex', filters, '-map', '[out]', '-frames:v', '1',
    str(frames / 'contact-sheet.jpg'),
], check=True)
print('Exported seven full-resolution frames and a contact sheet from the final MP4.')
