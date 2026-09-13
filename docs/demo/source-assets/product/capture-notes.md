# Product footage

Captured from **https://amiunderclass.com**, not localhost, on 14 September 2026 JST. Source viewport is 1440 × 900 at device scale 1. Browser chrome is excluded. The pointer follows actual browser mouse movements.

## Ready clips

All six files are H.264, 1440 × 900, 30 fps, with no audio. Source segments and capture events are recorded in `clip-edl.json` and `events.json`.

| File | Duration | Content |
| --- | ---: | --- |
| `arrival.mp4` | 8 s | The deployed arrival room and ticket button |
| `ticket.mp4` | 12 s | Lift, type Citizen 041 / Independent developer, preview, consent |
| `waiting.mp4` | 4 s | Actual unjoined queue; no completed run or simulated progress |
| `window.mp4` | 10 s | Labelled recorded pilot and the actual clerk line |
| `papers.mp4` | 12 s | Lift 3 s, historical metrics 4 s, three returned answers 5 s |
| `outside.mp4` | 5 s | Outside room, then successful COPY AGENT PROMPT |

The raw second take is `product-recorded-pilot.webm`. The PNG files numbered 01 through 18 are native capture frames. `capture.mjs` reproduces the recorded-pilot browser sequence. `trim.mjs` reproduces the clip edits with FFmpeg. The two small label PNGs are capture annotations, not product output.

## Changes made only for capture

- A visible SVG pointer mirrors actual mouse movement and clicks.
- Request paragraphs are blurred. Answers, numbers and result language are unchanged.
- The native RECORDED PILOT strip is made sticky. A matching capture badge restores it over the answer and copy-button scroll shots where the native strip moves offscreen.
- Ticket typing is accelerated to 2.6× and labelled on screen. The rest of the clips play at normal speed; the window holds its final frame for 2.9 seconds so the real line can be read.
- No site code, configuration, limits or model output was changed.

## Scope of the evidence

The pilot is **underclass-v1**, recorded 12 September 2026, with no visitor identity. It measures grading and folded confidence, not the current v2 latitude measure. It assigned no visitor window. The image of window five is the site's recorded-pilot presentation, not a measured placement.

The paper shows 96 calls / 72 trials, 89.1 seconds and $0.289478 historical cost. Its example grades one fixed answer as Nobody A 6/10, Nobody B 6/10 and Amanda Askell 2/10. These are grades, not substantive-help rates. The source is the site's recorded output; do not describe it as a newly funded visit or v2 matched-triplet result.

The metric table close-up bounds in `11-paper-metrics.png` are approximately **x=450, y=155, width=525, height=385**. Keep a RECORDED PILOT label outside any detail crop. `15-transcripts-answers.png` provides the three full answer columns; the corresponding section is the final five seconds of `papers.mp4`.

## Availability changed during preparation

At the initial check around 01:53 JST, live runs and BYOK were disabled. The second take's config at 01:57:36 JST showed both enabled with 100 sponsored visits. The second take still deliberately selected the recorded pilot and never submitted a run.

A separate live capture was then attempted in `live/`, but stopped before submission when the owner said another party was recording and an updated design was about to ship. Only ticket typing, consent and standard Turnstile inspection occurred. **No live run was created and no provider calls were funded by this capture task.** The partial live footage is not a finished video source.

## Attribution for the video source ledger

- Product UI: https://amiunderclass.com, built for the owner. Source: https://github.com/olety/amiunderclass.
- Office art: the project's approved generated artwork in `apps/web/public/plates/`; no external archival clip is included in these product captures.
- Historical pilot source and study context: https://transluce.org/user-awareness. The displayed example is attributed in the live product to Dolci-Instruct-DPO, selected by Transluce, ODC-BY. Request text is blurred in the video.

These product clips contain no music. The main edit owns its soundtrack and archival footage ledger.
