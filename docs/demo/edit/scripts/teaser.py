#!/usr/bin/env python3
"""Cut the approved 15-second teaser from the completed 30 fps master.

Usage: python3 docs/demo/edit/scripts/teaser.py
Requires ffmpeg and ffprobe. The script refuses missing or incompatible masters.
It validates a temporary encode before replacing the deliverable.
"""
from __future__ import annotations

import argparse
from fractions import Fraction
import json
from pathlib import Path
import shutil
import subprocess


def probe(path: Path) -> dict:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries",
            "stream=codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,nb_frames,duration,sample_rate,channels:format=duration",
            "-of", "json", str(path),
        ],
        check=True, capture_output=True, text=True,
    )
    return json.loads(result.stdout)


def stream(info: dict, kind: str) -> dict:
    try:
        return next(item for item in info["streams"] if item["codec_type"] == kind)
    except StopIteration as error:
        raise ValueError(f"Master has no {kind} stream") from error


def main() -> None:
    demo = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--edl", type=Path, default=demo / "teaser-edl.json")
    parser.add_argument("--input", type=Path, help="Override the EDL master path")
    parser.add_argument("--output", type=Path, help="Override the EDL deliverable path")
    args = parser.parse_args()
    edl_path = args.edl.resolve()
    edl = json.loads(edl_path.read_text())
    source = (args.input or edl_path.parent / edl["source"]).resolve()
    target = (args.output or edl_path.parent / edl["output"]).resolve()
    if not source.is_file():
        raise SystemExit(f"Render the master first: {source}")
    if source == target:
        raise SystemExit("The teaser output must differ from the master")
    for binary in ("ffmpeg", "ffprobe"):
        if shutil.which(binary) is None:
            raise SystemExit(f"Required executable is missing: {binary}")

    fps = int(edl["fps"])
    sample_rate = int(edl["audio_sample_rate"])
    frames = int(edl["duration_frames"])
    segments = edl["segments"]
    if sample_rate % fps:
        raise ValueError("This edit requires an integer number of audio samples per frame")
    samples_per_frame = sample_rate // fps
    position = 0
    for segment in segments:
        length = segment["source_end_frame_exclusive"] - segment["source_start_frame"]
        if length <= 0 or segment["source_start_frame"] < 0:
            raise ValueError(f"Invalid source interval: {segment['id']}")
        if segment["output_start_frame"] != position or segment["output_end_frame_exclusive"] != position + length:
            raise ValueError(f"Non-contiguous output interval: {segment['id']}")
        position += length
    if position != frames or Fraction(frames, fps) != Fraction(str(edl["duration_seconds"])):
        raise ValueError("EDL duration does not match its frame count")

    source_info = probe(source)
    video = stream(source_info, "video")
    stream(source_info, "audio")
    if (video["width"], video["height"]) != (edl["width"], edl["height"]):
        raise ValueError("Master must be 1920×1080; finish the master export first")
    if Fraction(video["avg_frame_rate"]) != fps:
        raise ValueError(f"Master must have the EDL's {fps} fps frame rate")
    required_frames = max(segment["source_end_frame_exclusive"] for segment in segments)
    if video.get("nb_frames") and int(video["nb_frames"]) < required_frames:
        raise ValueError("Master is shorter than the final EDL source interval")

    count = len(segments)
    filters = [
        f"[0:v]split={count}" + "".join(f"[v{i}]" for i in range(count)),
        f"[0:a]aresample={sample_rate},asplit={count}" + "".join(f"[a{i}]" for i in range(count)),
    ]
    fade = float(edl["audio_splice_fade_seconds"])
    for index, segment in enumerate(segments):
        start = segment["source_start_frame"]
        end = segment["source_end_frame_exclusive"]
        duration = (end - start) / fps
        filters.append(f"[v{index}]trim=start_frame={start}:end_frame={end},setpts=PTS-STARTPTS[cut{index}v]")
        audio = (
            f"[a{index}]atrim=start_sample={start * samples_per_frame}:end_sample={end * samples_per_frame},"
            f"asetpts=PTS-STARTPTS,afade=t=in:d={fade}"
        )
        if index < count - 1:
            audio += f",afade=t=out:st={duration - fade:.9f}:d={fade}"
        filters.append(audio + f"[cut{index}a]")
    filters.append(
        "".join(f"[cut{i}v][cut{i}a]" for i in range(count))
        + f"concat=n={count}:v=1:a=1[outv][joined-audio]"
    )
    filters.append(f"[joined-audio]atrim=end_sample={frames * samples_per_frame}[outa]")

    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(f".{target.stem}.rendering.mp4")
    try:
        subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-nostdin", "-y", "-i", str(source),
                "-filter_complex", ";".join(filters), "-map", "[outv]", "-map", "[outa]",
                "-c:v", edl["video"]["codec"], "-crf", str(edl["video"]["crf"]),
                "-preset", edl["video"]["preset"], "-pix_fmt", edl["video"]["pixel_format"],
                "-r", str(fps), "-fps_mode", "cfr", "-t", str(frames / fps),
                "-c:a", edl["audio"]["codec"], "-b:a", edl["audio"]["bitrate"],
                "-ar", str(sample_rate), "-ac", str(edl["audio"]["channels"]),
                "-movflags", "+faststart", "-map_metadata", "-1", str(temporary),
            ],
            check=True,
        )
        result = probe(temporary)
        encoded_video = stream(result, "video")
        encoded_audio = stream(result, "audio")
        if int(encoded_video.get("nb_frames", 0)) != frames:
            raise ValueError("Encoded teaser does not contain exactly 450 frames")
        if encoded_video["codec_name"] != "h264" or encoded_audio["codec_name"] != "aac":
            raise ValueError("Encoded teaser does not use H.264 and AAC")
        if encoded_audio["channels"] != 2 or int(encoded_audio["sample_rate"]) != sample_rate:
            raise ValueError("Encoded teaser audio does not match the stereo 48 kHz contract")
        if abs(float(result["format"]["duration"]) - frames / fps) > 0.001:
            raise ValueError("Encoded teaser does not have the exact 15-second duration")
        temporary.replace(target)
        print(json.dumps({"output": str(target), "frames": frames, "duration_seconds": frames / fps, "bytes": target.stat().st_size}, indent=2))
    finally:
        temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
