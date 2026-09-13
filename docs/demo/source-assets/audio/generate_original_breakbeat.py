#!/usr/bin/env python3
"""Original cheerful breakbeat release, using the original-library-jingle bed.
No external samples or borrowed melodies. Rebuild after generate_original_jingle.py.
"""
from pathlib import Path
import json
import numpy as np
import soundfile as sf
from scipy import signal
SR=48000
BPM=108
BEAT=60/BPM
DURATION=9.333333333333334
N=round(SR*DURATION)
RNG=np.random.default_rng(1976047)
ROOT=Path(__file__).parent
source,rate=sf.read(ROOT/'original-library-jingle.wav',dtype='float64')
assert rate==SR and source.shape[1]==2
# Second statement of the authored main theme, with extra mallet unisons.
start=round(64*BEAT*SR)
mix=source[start:start+N].copy()*.66
assert len(mix)==N

def put(wave,beat,gain,pan=0):
    i=round(beat*BEAT*SR)
    wave=wave[:N-i]*gain
    angle=(pan+1)*np.pi/4
    mix[i:i+len(wave),0]+=wave*np.cos(angle)
    mix[i:i+len(wave),1]+=wave*np.sin(angle)

def edge(t,dur,attack=.001,release=.03):
    return np.minimum(1,t/attack)*np.clip((dur-t)/release,0,1)

def kick():
    d=.26;t=np.arange(round(d*SR))/SR
    phase=2*np.pi*(51*t+2.1*(1-np.exp(-t/.035)))
    # Round low body with a brief beater transient; no clipping/distortion.
    body=np.sin(phase)*np.exp(-t/.073)
    click=RNG.normal(0,1,len(t))*np.exp(-t/.0025)*.12
    return (body+click)*edge(t,d)

def snare(ghost=False):
    d=.21;t=np.arange(round(d*SR))/SR
    noise=signal.sosfilt(signal.butter(2,[1100,9200], 'bandpass',fs=SR,output='sos'),RNG.normal(0,1,len(t)))
    body=.52*np.sin(2*np.pi*183*t)*np.exp(-t/.041)+.20*np.sin(2*np.pi*328*t)*np.exp(-t/.025)
    rattle=.46*noise*np.exp(-t/(.035 if ghost else .065))
    return (body+rattle)*edge(t,d)

def tamb(opened=False):
    d=.24 if opened else .12;t=np.arange(round(d*SR))/SR
    y=np.zeros_like(t)
    for f in (3197,4319,5361,6713,8191):
        y+=np.sin(2*np.pi*f*t+RNG.uniform(0,2*np.pi))*.11
    y+=.19*signal.sosfilt(signal.butter(2,[5500,13000],'bandpass',fs=SR,output='sos'),RNG.normal(0,1,len(t)))
    return y*np.exp(-t/(.059 if opened else .020))*edge(t,d,.0005,.025)

for bar in range(4):
    b=bar*4
    # Friendly funk syncopation; firm backbeats, lightly swung tambourine.
    kicks=[(0,.62),(.75,.31),(1.5,.44),(2,.50),(2.75,.39),(3.5,.35)]
    if bar%2: kicks=[(0,.62),(1.75,.42),(2.5,.52),(3.5,.35)]
    for beat,gain in kicks: put(kick(),b+beat,gain)
    for beat in (1,3): put(snare(),b+beat,.53,-.055)
    for beat in (.875,2.5,3.75): put(snare(True),b+beat,.095,-.06)
    for k in range(8):
        offset=k*.5+(.018 if k%2 else 0)
        put(tamb(k in (3,7)),b+offset,.18 if k%2 else .13,.42)
    if bar==3:
        for beat,gain in [(3.25,.14),(3.5,.23),(3.75,.30)]:
            put(snare(True),b+beat,gain,-.04)
# A short release hit at the next downbeat is optional editorial tail.
put(kick(),16,.46)
put(tamb(True),16,.30,.25)
mix=signal.sosfilt(signal.butter(2,30,'highpass',fs=SR,output='sos'),mix,axis=0)
mix[:round(.008*SR)]*=np.linspace(0,1,round(.008*SR))[:,None]
mix[-round(.28*SR):]*=np.linspace(1,0,round(.28*SR))[:,None]
peak=np.max(np.abs(signal.resample_poly(mix,4,1,axis=0)))
mix*=10**(-1.6/20)/peak
out=ROOT/'original-jingle-breakbeat.wav'
sf.write(out,mix,SR,subtype='PCM_24')
print(json.dumps({'path':str(out),'duration_seconds':len(mix)/SR,'bpm':BPM,'sample_rate':SR,'channels':2,'size_bytes':out.stat().st_size,'rms_dbfs':float(20*np.log10(np.sqrt(np.mean(mix**2)))),'true_peak_ceiling_dbtp':-1.6,'provenance':'Original jingle plus original synthesized percussion, no third-party samples','qc':'Numerical only; not acoustically auditioned'},indent=2))
