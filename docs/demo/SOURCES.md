# Sources and edit ledger

This 60-second cut follows the revised welcome, identity, waiting, evidence, release and return structure. It uses original Suno music, one reviewed Flora shot, a CPA-generated threshold image and a labelled recorded pilot from the deployed site. Secondary editorial captions and the archive montage were removed after owner review.

## Archive material considered

Public-domain Prelinger office excerpts were researched and retained in `source-assets/archive`. They are not used in the revised film. The owner found the montage abrupt and random, so the revised picture stays inside the office's visual world.

## Generated picture

The opening uses `source-assets/generated/hall-reviewed.mp4`, generated through the owner's Flora account with Seedance 1.5 Pro on 14 September 2026 JST. Five seconds of motion is slowed into an eight-second welcoming shot. The edit places its main welcome message on the existing blank wall board. The same room returns during the wait.

At 52–55 seconds, `source-assets/generated/alternate/threshold-endframe.png` shows the office through its open doors. GPT Image 2.5 generated this image through CPA using approved K6 as its reference. A subtle camera push connects the apparent exit to the welcoming room. Generated visuals supply atmosphere only.

Two original Flora runs cost $0.624 in total. One exterior result invented digits and was rejected. A subsequent first/last-frame video request using the CPA image failed input validation; its $0.481 submission amount has no visible settled charge or refund. The CPA response reports token usage rather than a dollar charge. No further retries were made. Full prompts and results are recorded in `source-assets/generated/generated-ledger.json` and `source-assets/generated/alternate/alternate-ledger.json`.


## Music and sound

[Everyone Is Helped](https://suno.com/song/7c0664a6-c0ec-48d4-80b5-c498f341636e) is an instrumental generated in Suno v6 through the owner's Pro account for this film. Creation was credit-free in the displayed promotion; one song download was unlocked from the existing plan allowance. It was downloaded as WAV through the site's interface. No new subscription or purchase was made. Generation and download do not establish an independent licence determination.

The revised score uses one continuous source passage, Suno seconds 0–60. It contains no musical splices, repeated fragments, jumps to another section or added bell. A short opening fade, a smooth 4 dB reduction under the evidence and a three-second ending fade preserve musical continuity. Exact gain envelopes are in `source-assets/audio/score-60-edl.json`.

The revised WAV measures 60.000 seconds, stereo 48 kHz, −16.00 LUFS and −3.19 dBTP. The earlier chopped Suno mix and t.A.T.u. experiments are superseded. The teaser uses one continuous passage from the revised score rather than cutting music with the picture.


## Product picture and evidence

Captured from [amiunderclass.com](https://amiunderclass.com), at 1440×900, with a visible pointer and no browser chrome. Protected requests are blurred; output evidence is unaltered. Mode labels remain visible. Product footage is presented at its native aspect ratio with cream margins.

**This cut uses the labelled recorded v1 pilot.** The updated design recording has not been supplied as of this export. The pilot is a historical task-grade experiment; it does not establish a visitor's position or the newer protocol's treatment measures. Window 5 is the recorded presentation, not a measured visitor assignment. The waiting footage explicitly shows an unjoined queue. No new funded visit was started for this edit. See `source-assets/product/capture-notes.md` and `clip-edl.json`.

The approved office art belongs to the project. The male clerk's appearance is preserved. Archivo, Cormorant Garamond and IBM Plex Mono are local font assets. The welcome lettering reuses the site's bitmap alphabet.

## Deliverables and reproduction

`underclass-demo.mp4`: 60 seconds, 1920×1080, 30 fps, H.264 and stereo AAC. `underclass-teaser.mp4`: 15 seconds drawn from master ranges 0–4, 15–18, 47–52 and 57–60. The teaser contains 450 frames, with one continuous soundtrack passage and a gentle closing fade. Seven full-resolution proof frames are in `frames`.

The composition is authored in HyperFrames 0.8.36 with local GSAP 3.14.2 and FFmpeg. `edit/scripts/build.mjs` and `edit/timeline.json` hold picture timing. `source-assets/audio/build_score_60.py` rebuilds the music edit. `edit/README.md` has staging, verification and rendering commands. No upload or publication is part of this export.
