"""Rebuild the owner-requested, copyrighted t.A.T.u. preview medley.

Requires ffmpeg and the two locally obtained WAVs beside this script.
No pitch shift, no tempo stretch, no generated vocals.
"""
from pathlib import Path
import json
import subprocess

base = Path(__file__).resolve().parent
segments = [
    dict(id='cold-air', source='tatu-all-the-things-she-said.wav', source_in=0, source_out=3.333333, timeline_in=0, timeline_out=3.333333, fade_in=0.08, fade_out=0.02, gain=1.0),
    dict(id='english-hook-and-verse', source='tatu-all-the-things-she-said.wav', source_in=21.347, source_out=65.0, timeline_in=3.333333, timeline_out=46.986333, fade_in=0.008, fade_out=0.6, gain=1.0),
    dict(id='russian-break', source='tatu-nas-ne-dogonyat.wav', source_in=31.8, source_out=35.155, timeline_in=46.47, timeline_out=49.825, fade_in=0.12, fade_out=0.008, gain=1.0),
    dict(id='russian-drive', source='tatu-nas-ne-dogonyat.wav', source_in=35.155, source_out=49.938, timeline_in=49.825, timeline_out=64.608, fade_in=0.008, fade_out=0.008, gain=1.0),
    dict(id='russian-reprise', source='tatu-nas-ne-dogonyat.wav', source_in=42.546, source_out=49.938, timeline_in=64.608, timeline_out=72.0, fade_in=0.008, fade_out=0.02, gain=1.0),
]
sources = ['tatu-all-the-things-she-said.wav', 'tatu-nas-ne-dogonyat.wav']
inputs = []
for source in sources:
    inputs += ['-i', str(base / source)]
filters = []
for i, segment in enumerate(segments):
    source_index = sources.index(segment['source'])
    length = segment['source_out'] - segment['source_in']
    filters.append(
        f'[{source_index}:a]atrim=start={segment["source_in"]}:end={segment["source_out"]},'
        f'asetpts=PTS-STARTPTS,afade=t=in:d={segment["fade_in"]},'
        f'afade=t=out:st={length - segment["fade_out"]}:d={segment["fade_out"]},'
        f'adelay={round(segment["timeline_in"] * 48000)}S:all=1[s{i}]'
    )
gain = 'if(lt(t,3.333333),0.8,if(lt(t,9.35),0.85,if(lt(t,10.1),0.85-(t-9.35)/0.75*0.57,if(lt(t,59.7),0.28,if(lt(t,62),0.28+(t-59.7)/2.3*0.67,if(lt(t,70.5),0.95,0.95*(72-t)/1.5))))))'
filters.append(''.join(f'[s{i}]' for i in range(len(segments))) + f'amix=inputs={len(segments)}:normalize=0:dropout_transition=0,atrim=duration=72,volume=\'{gain}\':eval=frame,alimiter=limit=0.95:level=false:latency=true,volume=0.88[out]')
filter_graph = ';\n'.join(filters)
(base / 'mix-filter.txt').write_text(filter_graph)
output = base / 'underclass-tatu-mix-72s.wav'
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *inputs, '-filter_complex_script', str(base / 'mix-filter.txt'), '-map', '[out]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', str(output)], check=True)
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(output), '-c:a', 'libmp3lame', '-b:a', '320k', str(base / 'underclass-tatu-mix-72s.mp3')], check=True)
edl = {
    'duration_seconds': 72,
    'master_gain': 0.88,
    'sample_rate': 48000,
    'channels': 2,
    'copyright': 'Both songs are copyrighted. No synchronization/reuse licence obtained. Owner explicitly requested this edit and accepted possible Content ID claims on 2026-09-14.',
    'sources': {
        sources[0]: {'title': 'All The Things She Said', 'artist': 't.A.T.u.', 'url': 'https://www.youtube.com/watch?v=8mGBaXPlri8', 'provider': 'tatu official artist channel', 'copyright': '(C) 2002 Universal Music Russia', 'nominal_bpm': 90, 'playback_rate': 1.0, 'pitch_shift_semitones': 0},
        sources[1]: {'title': 'Нас не догонят', 'artist': 't.A.T.u.', 'url': 'https://www.youtube.com/watch?v=KA3Jb6eA0uo', 'provider': 'tatu official artist channel, label-provided album upload', 'copyright': '℗ 2026 Fenix Music under exclusive license Neformat', 'nominal_bpm': 130, 'playback_rate': 1.0, 'pitch_shift_semitones': 0},
    },
    'segments': segments,
    'volume_envelope': [{'start':0,'end':3.333333,'gain':0.8},{'start':3.333333,'end':9.35,'gain':0.85},{'start':9.35,'end':10.1,'from':0.85,'to':0.28},{'start':10.1,'end':59.7,'gain':0.28},{'start':59.7,'end':62,'from':0.28,'to':0.95},{'start':62,'end':70.5,'gain':0.95},{'start':70.5,'end':72,'from':0.95,'to':0}],
    'editorial': 'An opening chorus is followed continuously into its verse. A quiet percussion/riser break hands off to the Russian song at original pitch and tempo. Its final eight-second drive is reprised. No simultaneous vocal layering across the differing keys.',
    'nominal_beat_grid': {'english': [round(3.333333 + i * 60/90, 6) for i in range(66)], 'russian': [round(49.825 + i * 60/130, 6) for i in range(49)]},
    'cold_open_cut_suggestions': [3.333333,4,4.666667,5.333333,6,6.666667,7.333333],
    'main_source_ranges_seconds': {'tatu-all-the-things-she-said.wav': [[0,3.333333],[21.347,65]], 'tatu-nas-ne-dogonyat.wav': [[31.8,49.938],[42.546,49.938]]},
}
(base / 'mix-edl.json').write_text(json.dumps(edl, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'wav':str(output),'mp3':str(base / 'underclass-tatu-mix-72s.mp3'),'edl':str(base / 'mix-edl.json')}, indent=2))
