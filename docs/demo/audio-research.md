# Underclass demo soundtrack

## Final 60-second revision

**Current correction:** the final WAV now uses one uninterrupted source interval, Suno **0–60 seconds**. The owner rejected the prior chopped treatment. There are **no loops, jumps, added bell or hard stop**. It has a 150 ms fade-in, a three-second fade-out from 57 seconds, and a smooth 4 dB duck with two-second ramps around the evidence section. `score-60-edl.json` now has `mode: continuous`; previous audio and metadata are retained in `source-assets/audio/revision-archive/`.

Rebuild the current version with `build_score_60.py --continuous --bed suno-everyone-is-helped-v6.wav`, using the source credit and URL below. The structured-cut description below is retained as revision history and does not describe the current output.

The corrected teaser retains its four picture excerpts but uses one continuous master audio interval, 0–15 seconds, with a 1.5-second fade-out. Picture edits introduce no music cuts.

The final score is `source-assets/audio/underclass-score-60s.wav`, with an MP3 audition copy beside it. It uses **Everyone Is Helped**, generated in Suno v6 through the owner's Pro account on 14 September 2026. Canonical source: https://suno.com/song/7c0664a6-c0ec-48d4-80b5-c498f341636e. The downloaded WAV is the source; the M4A was used only for initial structure analysis. No t.A.T.u. recording is used in this revision.

The source is an instrumental public-service library cue: vibraphone, pizzicato strings, flute, typewriter-like percussion and a late breakbeat release. Generation instructions requested a 92 BPM warm civic-office sound. Analysis measured approximately 92.3 BPM and identified a sparse passage around 124–139 seconds and a distinct release around 140–149 seconds. The edit uses those actual passages, rather than assuming that the generated audio followed the requested timeline.

| Film interval | Source and treatment |
| --- | --- |
| 0–24 seconds | Suno 0–24 seconds: welcoming full-width bed |
| 24–29 seconds | Suno 10.519–13.120 seconds: a four-beat phrase repeats |
| 29–35 seconds | Suno 10.519–11.169 seconds: the phrase contracts into a compulsory one-beat loop |
| 35–47 seconds | Music absent; only original very low HVAC-like room tone remains under evidence |
| 47–55 seconds | Suno 140.341–148.341 seconds: the actual bright percussive release |
| 55 seconds | Original synthesized counter bell and a hard musical stop |
| 55.85–60 seconds | Suno 128.000–132.150 seconds: the sparse passage returns quietly, filtered and faded |

`build_score_60.py` records every interval and gain in `score-60-edl.json`. It uses no pitch shift or tempo stretch. The counter bell and room tone are original synthesis, with no borrowed sound-effect sample. Mastering uses two-pass loudness measurement at −16 LUFS with a −1 dBTP maximum, followed by a bounded constant-gain correction when needed. Final measurements, duration and file size are in `score-60-qc.json`. Structure and numerical levels have been checked; acoustic audition with the picture remains.

Rebuild with `build_score_60.py --bed suno-everyone-is-helped-v6.wav --bpm 92.28515625 --loop-start 10.519 --release-start 140.341 --quiet-start 128`, resolving the bed path from the current working directory. Supply `--source-credit` and `--source-url` with the Suno provenance above.

The 15-second teaser uses master intervals 0–4, 15–18, 47–52 and 57–60 seconds, exactly 450 frames at 30 fps. It includes the premise, musical release and quiet final URL.

The earlier procedural fallback remains available as `original-library-jingle.wav`, with an original breakbeat variation in `original-jingle-breakbeat.wav`. Both have deterministic generation scripts and use no third-party samples or borrowed melody. They are not used in the final score.

## Earlier 72-second t.A.T.u. study

The owner requested both t.A.T.u. songs and explicitly accepted possible Content ID claims on 14 September 2026. These recordings are copyrighted. No synchronization or public reuse licence has been obtained, and attribution does not grant one. This is the requested local preview medley, not a claim of upload clearance.

The finished 72-second mix is `source-assets/audio/underclass-tatu-mix-72s.wav`, stereo 48 kHz / 24 bit. An MP3 audition copy is beside it. `source-assets/audio/build_mix.py` reconstructs both from the source WAVs, and `mix-edl.json` records source intervals, gains and beat grids. Full source recordings should stay local; commit the edit code, provenance and the rendered deliverable according to the project's binary policy.

| Recording | Official source | Copyright shown by source | Source intervals used | Timeline intervals |
| --- | --- | --- | --- | --- |
| t.A.T.u., All The Things She Said | https://www.youtube.com/watch?v=8mGBaXPlri8 | © 2002 Universal Music Russia, official artist channel | 0.000–3.333; 21.347–65.000 seconds | 0.000–3.333; 3.333–46.986 seconds |
| t.A.T.u., Нас не догонят | https://www.youtube.com/watch?v=KA3Jb6eA0uo | ℗ 2026 Fenix Music under exclusive license Neformat, label-provided album upload on the official artist channel | 31.800–49.938; reprise of 42.546–49.938 seconds | 46.470–64.608; 64.608–72.000 seconds |

The English hook drops at 3.333 seconds. Rapid archive cuts can land at 3.333, 4.000, 4.667, 5.333, 6.000, 6.667 and 7.333 seconds. The product cut at 10.000 seconds also lands on its nominal 90 BPM grid. The hook flows directly into the verse. At 46.470 seconds a quiet break hands off to the Russian recording, whose main drive begins at 49.825 seconds. Its 130 BPM grid is included in the EDL. The final phrase is reprised at 64.608 seconds.

Both recordings retain original tempo and pitch. Their tonal centres differ, so the handoff uses a quiet break instead of layering vocals. A gain envelope drops the product section to roughly one third of the opening level, then returns from 59.700 to 62.000 seconds. The ending fades from 70.500 to 72.000 seconds. No lyrics are added to video captions.

Acquisition used current yt-dlp 2026.08.19 through an isolated `uvx` environment and ffmpeg audio extraction. The older installed yt-dlp returned CDN 403; current yt-dlp downloaded both without cookies, login changes, DRM bypass or paywall circumvention. Raw download metadata with transient media URLs was replaced with `source-metadata.json`, containing only title, channel, canonical source URL and public description.

Audio checks: exactly 72 seconds, stereo 48 kHz, no clipped PCM samples, no unintended silence over 100 ms at −50 dB. A final 0.88 master gain leaves approximately −1.2 dB true-peak headroom while preserving the intended contrast between the opening, product bed and exit. The mix has been checked structurally and numerically; audition its handoff with the completed picture before upload.
