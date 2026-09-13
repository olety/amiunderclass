#!/usr/bin/env python3
"""Edit a warm source bed into the revised 60-second institutional score.

Examples:
  python3 build_score_60.py --bed /path/to/suno.wav --bpm 108
  python3 build_score_60.py  # uses original-library-jingle.wav beside this file

Requires ffmpeg/ffprobe. Source music stays at original pitch and tempo.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess

BASE = Path(__file__).resolve().parent
SR = 48000
DURATION = 60


def run(command: list[str]) -> str:
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    return result.stdout + result.stderr


def ffmpeg(*args: str) -> str:
    return run(["ffmpeg", "-hide_banner", "-nostdin", "-y", *args])


def last_json(log: str) -> dict:
    objects = re.findall(r"\{\s*\"input_i\".*?\}", log, flags=re.S)
    if not objects:
        raise ValueError("ffmpeg did not return loudness measurements")
    return json.loads(objects[-1])


def source_duration(path: Path) -> float:
    data = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)]))
    return float(data["format"]["duration"])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bed", type=Path, default=BASE / "original-library-jingle.wav")
    parser.add_argument("--bpm", type=float, default=108)
    parser.add_argument("--bed-start", type=float, default=0)
    parser.add_argument("--loop-start", type=float, default=None)
    parser.add_argument("--release-source", type=Path, help="Optional separate release recording; default is the source bed")
    parser.add_argument("--release-start", type=float, default=None)
    parser.add_argument("--quiet-start", type=float, default=None, help="Source position for the distant final welcome")
    parser.add_argument("--source-credit", default="Original procedural composition; no third-party music samples")
    parser.add_argument("--source-url", default="")
    parser.add_argument("--output", type=Path, default=BASE / "underclass-score-60s.wav")
    args = parser.parse_args()
    bed = args.bed.resolve()
    release = (args.release_source or args.bed).resolve()
    if not bed.is_file() or not release.is_file():
        raise SystemExit(f"Source bed is not ready: {bed}")
    if not 50 <= args.bpm <= 200:
        raise ValueError("Set the source's actual BPM between 50 and 200")
    beat = 60 / args.bpm
    loop_start = args.loop_start if args.loop_start is not None else args.bed_start + 16 * beat
    release_start = args.release_start if args.release_start is not None else args.bed_start + 32 * beat
    quiet_start = args.quiet_start if args.quiet_start is not None else args.bed_start
    for path, endpoint in [(bed, args.bed_start + 24), (bed, loop_start + 4 * beat), (release, release_start + 8), (bed, quiet_start + 4.15)]:
        if endpoint > source_duration(path):
            raise ValueError(f"Source {path.name} is too short for endpoint {endpoint:.3f}; choose earlier source positions")

    bell = BASE / "office-bell.wav"
    tone = "0.35*exp(-6*t)*sin(2*PI*2093*t)+0.16*exp(-10*t)*sin(2*PI*3317*t)+0.12*exp(-18*t)*sin(2*PI*4780*t)"
    ffmpeg("-f", "lavfi", "-i", f"aevalsrc={tone}:s={SR}:d=1.2", "-af", "afade=t=in:d=0.0008,afade=t=out:st=0.85:d=0.35", "-ac", "2", "-c:a", "pcm_s24le", str(bell))

    segments = [
        {"id":"welcome", "timeline_in":0, "timeline_out":24, "source":str(bed), "source_in":args.bed_start, "source_out":args.bed_start+24, "gain":0.65, "treatment":"Soft 80 ms opening; inviting full-width bed"},
        {"id":"polite-loop", "timeline_in":24, "timeline_out":29, "source":str(bed), "source_in":loop_start, "source_out":loop_start+4*beat, "loop_seconds":4*beat, "gain":0.65, "treatment":"Repeat one four-beat phrase; modestly narrow to a public-address speaker"},
        {"id":"compulsory-loop", "timeline_in":29, "timeline_out":35, "source":str(bed), "source_in":loop_start, "source_out":loop_start+beat, "loop_seconds":beat, "gain":0.59, "treatment":"Repeat one beat; 6 ms joins; no pitch change; music stops at 35"},
        {"id":"evidence", "timeline_in":35, "timeline_out":47, "source":"original HVAC tone", "gain":0.0007, "treatment":"Music absent; nearly silent room tone"},
        {"id":"release", "timeline_in":47, "timeline_out":55, "source":str(release), "source_in":release_start, "source_out":release_start+8, "gain":1.0, "treatment":"Full-width, bright return; two-millisecond cut at the bell"},
        {"id":"office-bell", "timeline_in":55, "timeline_out":56.2, "source":str(bell), "source_in":0, "source_out":1.2, "gain":0.72, "treatment":"Original synthesized counter bell, no borrowed sample"},
        {"id":"quiet-welcome", "timeline_in":55.85, "timeline_out":60, "source":str(bed), "source_in":quiet_start, "source_out":quiet_start+4.15, "gain":0.105, "treatment":"Distant narrow-band return; fade away over final 650 ms"},
    ]

    def trim(input_index: int, start: float, duration: float, treatment: str, delay: float, label: str) -> str:
        return f"[{input_index}:a]aresample={SR},atrim=start={start:.9f}:duration={duration:.9f},asetpts=PTS-STARTPTS,{treatment},adelay={round(delay*SR)}S:all=1[{label}]"

    filters = [
        trim(0,args.bed_start,24,"volume=0.65,afade=t=in:d=0.08,afade=t=out:st=23.98:d=0.02",0,"welcome"),
    ]
    for label, duration, cell, delay, gain in [("polite",5,4*beat,24,0.65),("compulsory",6,beat,29,0.59)]:
        filters.append(
            f"[0:a]aresample={SR},atrim=start={loop_start:.9f}:duration={cell:.9f},asetpts=PTS-STARTPTS,"
            f"afade=t=in:d=0.006,afade=t=out:st={cell-0.006:.9f}:d=0.006,aloop=loop=-1:size={round(cell*SR)},"
            f"atrim=duration={duration},pan=stereo|c0=0.65*c0+0.35*c1|c1=0.35*c0+0.65*c1,"
            f"highpass=f=120,lowpass=f=6500,volume={gain},afade=t=out:st={duration-0.006}:d=0.006,"
            f"adelay={round(delay*SR)}S:all=1[{label}]"
        )
    filters += [
        trim(1,release_start,8,"volume=1.0,afade=t=in:d=0.012,afade=t=out:st=7.998:d=0.002",47,"release"),
        trim(2,0,1.2,"volume=0.72",55,"bell"),
        trim(0,quiet_start,4.15,"pan=stereo|c0=0.7*c0+0.3*c1|c1=0.3*c0+0.7*c1,highpass=f=180,lowpass=f=2800,volume=0.105,afade=t=in:d=0.5,afade=t=out:st=3.5:d=0.65",55.85,"quiet"),
        f"aevalsrc=0.0007*sin(2*PI*110*t)+0.0002*sin(2*PI*220*t):s={SR}:d=12,afade=t=in:d=0.12,afade=t=out:st=11.8:d=0.2,pan=stereo|c0=c0|c1=c0,adelay={35*SR}S:all=1[room]",
        "[welcome][polite][compulsory][room][release][bell][quiet]amix=inputs=7:normalize=0:dropout_transition=0,atrim=duration=60,alimiter=limit=0.95:level=false:latency=true[out]",
    ]
    graph = ";\n".join(filters)
    (BASE / "score-60-filter.txt").write_text(graph)
    raw = BASE / "score-60-pre-master.wav"
    ffmpeg("-i",str(bed),"-i",str(release),"-i",str(bell),"-filter_complex_script",str(BASE/"score-60-filter.txt"),"-map","[out]","-ar",str(SR),"-ac","2","-c:a","pcm_s24le",str(raw))
    measured = last_json(ffmpeg("-i",str(raw),"-af","loudnorm=I=-16:TP=-1:LRA=20:print_format=json","-f","null","-"))
    normalization = (
        f"loudnorm=I=-16:TP=-1:LRA=20:measured_I={measured['input_i']}:measured_TP={measured['input_tp']}:"
        f"measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}:"
        f"offset={measured['target_offset']}:linear=true:print_format=json"
    )
    target = args.output.resolve()
    ffmpeg("-i",str(raw),"-af",normalization,"-ar",str(SR),"-ac","2","-t","60","-c:a","pcm_s24le",str(target))
    qc = last_json(ffmpeg("-i",str(target),"-af","loudnorm=I=-16:TP=-1:LRA=20:print_format=json","-f","null","-"))
    correction_db = min(-16 - float(qc["input_i"]), -1 - float(qc["input_tp"]))
    if abs(correction_db) > 0.05:
        corrected = target.with_name(".score-60-gain-correction.wav")
        ffmpeg("-i",str(target),"-af",f"volume={correction_db}dB","-c:a","pcm_s24le",str(corrected))
        corrected.replace(target)
        qc = last_json(ffmpeg("-i",str(target),"-af","loudnorm=I=-16:TP=-1:LRA=20:print_format=json","-f","null","-"))
    ffmpeg("-i",str(target),"-c:a","libmp3lame","-b:a","320k",str(target.with_suffix(".mp3")))
    edl = {
        "version":1,"duration_seconds":DURATION,"sample_rate":SR,"channels":2,"bpm":args.bpm,
        "source_credit":args.source_credit,"source_url":args.source_url,
        "created_at":datetime.now(timezone.utc).isoformat(),"source_bed":str(bed),"source_release":str(release),
        "segments":segments,"office_bell_original":True,"music_pitch_shift_semitones":0,"music_playback_rate":1,
        "mastering":{"target_lufs":-16,"target_true_peak_db":-1,"two_pass":True,"measured":qc},
        "output_wav":str(target),"output_mp3":str(target.with_suffix(".mp3")),
        "cue_seconds":[0,24,29,35,47,55,55.85,60],
        "bed_beat_grid":[round(args.bed_start+i*beat,6) for i in range(int(24/beat)+1)],
    }
    (BASE / "score-60-edl.json").write_text(json.dumps(edl,ensure_ascii=False,indent=2)+"\n")
    (BASE / "score-60-qc.json").write_text(json.dumps({"duration_seconds":source_duration(target),"sample_rate":SR,"channels":2,"loudness":qc,"bytes":target.stat().st_size},indent=2)+"\n")
    print(json.dumps({"output":str(target),"duration_seconds":60,"lufs":qc["input_i"],"true_peak_db":qc["input_tp"],"edl":str(BASE/"score-60-edl.json")},indent=2))


if __name__ == "__main__":
    main()
