#!/usr/bin/env python3
"""Original easy-listening library cue for Underclass?, created 2026-09-14.

All melodies, harmony, note scheduling and synthesized timbres are authored here.
No recordings, samples, borrowed melodies, external soundfonts or network calls.
Rebuild: /opt/homebrew/opt/python@3.14/bin/python3.14 generate_original_jingle.py
Outputs only original-library-jingle.wav alongside this file.
"""
from pathlib import Path
import json
import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
BPM = 108
BEAT = 60 / BPM
BARS = 32
DURATION = 72.0
N = round(DURATION * SR)
RNG = np.random.default_rng(1976)
buses = {k: np.zeros((N, 2), dtype=np.float32) for k in ('lead', 'vibes', 'strings', 'bass', 'drums')}

def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def env(t, dur, attack=.018, release=.09):
    a = np.minimum(1., t / attack)
    r = np.clip((dur - t) / release, 0., 1.)
    return np.sin(a * np.pi / 2) ** 2 * np.sin(r * np.pi / 2) ** 2

def put(bus, wave, beat, gain, pan=0):
    i = max(0, round(beat * BEAT * SR))
    wave = np.asarray(wave[:N-i], dtype=np.float32) * gain
    angle = (pan + 1) * np.pi / 4
    buses[bus][i:i+len(wave), 0] += wave * np.cos(angle)
    buses[bus][i:i+len(wave), 1] += wave * np.sin(angle)

def flute(note, beats, velocity=1):
    dur = beats * BEAT
    t = np.arange(round(dur*SR))/SR
    freq = hz(note)
    # A breathy, nearly sinusoidal lead, with delayed vibrato and a little chiff.
    vibrato = .0035 * np.sin(2*np.pi*5.1*t) * np.minimum(1,t/.25)
    phase = 2*np.pi*freq*np.cumsum(1+vibrato)/SR
    tone = np.sin(phase) + .15*np.sin(2*phase+.2) + .045*np.sin(3*phase)
    breath = signal.sosfilt(signal.butter(2, [1200, 5000], 'bandpass', fs=SR, output='sos'), RNG.normal(0,1,len(t)))
    return (tone + .024*breath) * env(t,dur,.022,min(.09,dur/3)) * velocity

def vibe(note, beats):
    dur = beats*BEAT + .5
    t=np.arange(round(dur*SR))/SR
    f=hz(note)
    tone=(np.sin(2*np.pi*f*t)*np.exp(-t/1.5)
          + .22*np.sin(2*np.pi*f*4*t)*np.exp(-t/.18)
          + .065*np.sin(2*np.pi*f*9.2*t)*np.exp(-t/.075))
    tremolo=.87+.13*np.sin(2*np.pi*5.7*t+.4)
    return tone*tremolo*env(t,dur,.002,.18)

def strings(note, beats):
    dur=beats*BEAT + .32
    t=np.arange(round(dur*SR))/SR
    f=hz(note)
    y=np.zeros_like(t)
    for cents, phase0 in [(-6,.3),(0,1.9),(7,4.3)]:
        phase=2*np.pi*f*2**(cents/1200)*t + phase0 + .01*np.sin(2*np.pi*4.1*t)
        for h, amp in [(1,1),(2,.24),(3,.10),(4,.035)]:
            y += amp*np.sin(h*phase)/3
    return y*env(t,dur,.30,.45)

def bass(note, beats):
    dur=beats*BEAT
    t=np.arange(round(dur*SR))/SR
    f=hz(note)
    phase=2*np.pi*f*t+.09*np.exp(-t/.024)
    y=np.sin(phase)+.38*np.sin(2*phase)*np.exp(-t/.20)+.12*np.sin(3*phase)*np.exp(-t/.10)
    return y*np.exp(-t/.44)*env(t,dur,.004,.07)

def brush(beats=.25, accent=False):
    dur=beats*BEAT
    t=np.arange(round(dur*SR))/SR
    noise=signal.sosfilt(signal.butter(2,[1300,9500], 'bandpass',fs=SR,output='sos'),RNG.normal(0,1,len(t)))
    decay=.075 if accent else .025
    return noise*np.exp(-t/decay)*env(t,dur,.001,.02)

def kick():
    dur=.20
    t=np.arange(round(dur*SR))/SR
    phase=2*np.pi*(52*t + 1.5*(1-np.exp(-t/.025)))
    return np.sin(phase)*np.exp(-t/.052)*env(t,dur,.002,.03)

# Diatonic C-major voicings. The small sevenths/sixths and moving inversions
# give this a civic-film/library-music warmth without an ominous harmony cue.
progression = [
    (36,[60,64,67,69]), (33,[60,64,67,69]),
    (38,[60,62,65,69]), (31,[59,62,65,69]),
    (40,[59,62,64,67]), (33,[60,64,67,69]),
    (38,[60,62,65,69]), (31,[59,62,65,69]),
    (29,[60,64,65,69]), (40,[59,62,64,67]),
    (38,[60,62,65,69]), (31,[59,62,65,69]),
    (40,[59,60,64,67]), (29,[60,64,65,69]),
    (31,[60,62,65,69]), (36,[60,64,67,69]),
]
# Entirely original, continuous 16-bar theme. Durations total four beats/bar.
melody = [
 [(76,.75),(79,.25),(81,.5),(79,.5),(76,.75),(74,.25),(72,1)],
 [(76,.5),(79,.5),(84,1),(83,.5),(81,1),(79,.5)],
 [(77,.75),(81,.25),(84,.5),(83,.5),(81,.5),(77,.5),(76,1)],
 [(74,.5),(76,.5),(79,1),(81,.5),(77,.5),(74,1)],
 [(76,1),(79,.5),(83,.5),(81,.75),(79,.25),(76,1)],
 [(72,.5),(76,.5),(81,1.5),(79,.5),(76,.5),(74,.5)],
 [(77,.75),(76,.25),(74,.5),(72,.5),(69,1),(74,1)],
 [(71,.5),(74,.5),(77,.5),(79,.5),(76,.5),(74,.5),(72,1)],
 [(81,1),(84,.5),(83,.5),(81,.75),(79,.25),(77,1)],
 [(79,.75),(76,.25),(74,.5),(76,.5),(79,1),(83,1)],
 [(81,.5),(77,.5),(74,1),(76,.5),(77,.5),(81,1)],
 [(79,1.5),(77,.5),(74,.5),(71,.5),(74,1)],
 [(76,.75),(79,.25),(84,1),(83,.5),(79,.5),(76,1)],
 [(77,.5),(81,.5),(79,.5),(77,.5),(76,.5),(72,.5),(69,1)],
 [(74,.75),(77,.25),(81,.5),(79,.5),(77,.5),(74,.5),(71,1)],
 [(72,1.5),(76,.5),(79,.5),(76,.5),(72,1)],
]
assert all(abs(sum(d for _,d in bar)-4)<1e-8 for bar in melody)

for bar in range(BARS):
    b=bar*4
    root, chord=progression[bar%16]
    # A soft string cushion: close voices, slow bow envelope and stereo breadth.
    for v,note in enumerate(chord):
        put('strings',strings(note,3.85),b,.070,[-.58,-.2,.22,.57][v])
    # Syncopated mallets are an accompaniment, never a relentless UI bell loop.
    pattern = [(0,0),(.75,2),(1.5,1),(2.5,3),(3.25,2)]
    for j,(offset,idx) in enumerate(pattern):
        note=chord[(idx+bar//8)%4] + (12 if j==4 else 0)
        put('vibes',vibe(note,.6),b+offset,.075 if j!=4 else .055,-.34)
    # Mostly roots and fifths, with a diatonic approach into the next bar.
    nextroot=progression[(bar+1)%16][0]
    approach = nextroot-2 if nextroot%12 not in (0,5) else nextroot-1
    for offset,note,duration,gain in [(0,root,.8,.26),(1.5,root+7,.4,.19),(2,root+12,.8,.22),(3.5,approach,.4,.17)]:
        put('bass',bass(note,duration),b+offset,gain,-.03)
    # Brush swing is deliberately slight. No hard snare, crash or dance drop.
    for k in range(8):
        offset=k*.5 + (.03 if k%2 else 0)
        put('drums',brush(.30,k in (2,6)),b+offset,.035 if k%2 else .046,.36)
    for k in (0,2):
        put('drums',kick(),b+k,.10,0)
    for k in (1,3):
        put('drums',brush(.50,True),b+k,.105,-.2)
    # Small phrase-breath gaps keep the flute from sounding like an organ.
    offset=0
    for idx,(note,dur) in enumerate(melody[bar%16]):
        time=b+offset + (.01 if idx%2 else 0)
        soundlen=dur*(.88 if dur<=.5 else .93)
        gain=.185 if bar<16 else .174
        put('lead',flute(note,soundlen),time,gain,.12)
        # In the second half a few gently sparkling mallet unisons lift the cue.
        if bar>=16 and idx in (0,3) and bar%4!=3:
            put('vibes',vibe(note, soundlen),time,.042,-.30)
        offset+=dur

# One warm room, sparse early reflections and a quiet diffuse tail.
# These are synthesized impulse responses, not sampled spaces.
mix=np.zeros((N,2),dtype=np.float64)
for name,dry in buses.items():
    wet_amount={'lead':.13,'vibes':.16,'strings':.15,'bass':.02,'drums':.045}[name]
    for channel in range(2):
        ir=np.zeros(round(.85*SR))
        for delay,amp in [(.027,.35),(.049,.25),(.081,.20),(.127,.14),(.197,.09),(.293,.055)]:
            ir[round((delay+channel*.003)*SR)]=amp
        t=np.arange(len(ir))/SR
        ir += RNG.normal(0,1,len(ir)) * np.exp(-t/.19) * .00055
        wet=signal.fftconvolve(dry[:,channel],ir)[:N]
        mix[:,channel]+=dry[:,channel] + wet_amount*wet
# Gentle analogue-style bandwidth and saturation, without obvious wow or hiss.
mix=signal.sosfilt(signal.butter(2, 10500, fs=SR, output='sos'),mix,axis=0)
mix=signal.sosfilt(signal.butter(2, 32, 'highpass', fs=SR, output='sos'),mix,axis=0)
mix=np.tanh(mix*1.05)/1.05
mix[:round(.025*SR)]*=np.linspace(0,1,round(.025*SR))[:,None]
mix[-round(.70*SR):]*=np.linspace(1,0,round(.70*SR))[:,None]
# Conservative ceiling; resampled peak measurement catches between-sample overs.
peak=float(np.max(np.abs(signal.resample_poly(mix,4,1,axis=0))))
mix*=10**(-2/20)/max(peak,1e-9)
output=Path(__file__).with_name('original-library-jingle.wav')
sf.write(output,mix,SR,subtype='PCM_24')
print(json.dumps({
 'path':str(output),'duration_seconds':len(mix)/SR,'sample_rate':SR,
 'channels':2,'bpm':BPM,'bars':BARS,'sample_peak_dbfs':20*np.log10(np.max(np.abs(mix))),
 'rms_dbfs':20*np.log10(np.sqrt(np.mean(mix**2))),
 'true_peak_ceiling_dbtp':-2.0,'size_bytes':output.stat().st_size,
 'qc':'Numerical only; no claim of acoustic audition.',
 'provenance':'Original authored melody and synthesized instruments; no third-party samples.'
},indent=2))
