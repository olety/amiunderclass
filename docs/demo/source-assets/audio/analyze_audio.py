from pathlib import Path
import json
import numpy as np
import librosa
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

base = Path(__file__).parent
report = {}
fig, axes = plt.subplots(2, 1, figsize=(20, 8))
for ax, name in zip(axes, ['tatu-all-the-things-she-said', 'tatu-nas-ne-dogonyat']):
    y, sr = librosa.load(base / f'{name}.wav', sr=22050)
    onset = librosa.onset.onset_strength(y=y, sr=sr)
    tempo, frames = librosa.beat.beat_track(onset_envelope=onset, sr=sr)
    beats = librosa.frames_to_time(frames, sr=sr)
    rms = librosa.feature.rms(y=y)[0]
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr)
    ax.plot(times, rms)
    ax.set_xlim(0, 150)
    ax.set_xticks(np.arange(0, 151, 5))
    ax.grid(True)
    ax.set_title(f'{name}: detected {float(tempo[0]):.2f} BPM')
    report[name] = {'bpm_detected': float(tempo[0]), 'beats': beats.tolist(), 'rms_5s': [float(np.sqrt(np.mean(y[int(t*sr):int((t+5)*sr)]**2))) for t in range(0, 150, 5)]}
fig.tight_layout()
fig.savefig(base / 'audio-structure.png')
(base / 'beat-analysis.json').write_text(json.dumps(report, indent=2))
print(json.dumps({k: {'bpm_detected':v['bpm_detected'], 'first_beats':v['beats'][:20], 'rms_5s':v['rms_5s']} for k,v in report.items()}, indent=2))
