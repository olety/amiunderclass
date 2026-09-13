# Sources and edit ledger

This 60-second cut follows the revised welcome, identity, waiting, evidence, release and return structure. It uses original Suno music, one reviewed Flora shot, public-domain archive excerpts and a labelled recorded pilot from the deployed site.

## Archival picture

The individual Internet Archive items identify these Prelinger films as public domain. Original archive audio is not used. The archive depicts office rituals, not product users or model results. Raw source ranges, item metadata and the retrieval script are retained in `source-assets/archive`.

| Picture | Primary source | Original film seconds | Edit seconds |
|---|---|---|---|
| Smiling receptionist at a desk under venetian blinds | [OfficeCo1952](https://archive.org/details/OfficeCo1952) | 669.500–672.500 | 5.000–8.000 |
| Visitors waiting on chairs opposite the receptionist | [OfficeCo1952](https://archive.org/details/OfficeCo1952) | 333.000–335.500 | 24.000–26.500 |
| Hands operating a typewriter | [CoastGua1943](https://archive.org/details/CoastGua1943) | 299.200–300.700 | 26.500–28.000 |
| Hands sorting a thick stack of paper files | [CoastGua1943](https://archive.org/details/CoastGua1943) | 186.300–187.800 | 28.000–29.500 |
| Hands operating a typewriter | [CoastGua1943](https://archive.org/details/CoastGua1943) | 299.200–301.200 | 29.500–31.500 |
| Hands operating a typewriter | [CoastGua1943](https://archive.org/details/CoastGua1943) | 299.200–299.700 | 52.000–52.500 |
| Worker placing documents in a filing cabinet | [OfficeEt1950](https://archive.org/details/OfficeEt1950) | 665.500–666.000 | 52.500–53.000 |
| Smiling receptionist at a desk under venetian blinds | [OfficeCo1952](https://archive.org/details/OfficeCo1952) | 670.500–671.000 | 53.000–53.500 |
| Hands sorting a thick stack of paper files | [CoastGua1943](https://archive.org/details/CoastGua1943) | 187.000–187.500 | 53.500–54.000 |
| High-angle uniformed women marching in formation; no weapons or flags | [CoastGua1943](https://archive.org/details/CoastGua1943) | 117.000–117.500 | 54.000–54.500 |
| Worker placing documents in a filing cabinet | [OfficeEt1950](https://archive.org/details/OfficeEt1950) | 666.500–667.000 | 54.500–55.000 |

## Generated picture

The opening uses five seconds of `source-assets/generated/hall-reviewed.mp4`, generated through the owner's Flora account with Seedance 1.5 Pro on 14 September 2026 JST. It shows the approved office with tiny seated movements and a blank wall board. The edit places its welcome lettering on that board. Generated footage supplies atmosphere only.

Two generation runs cost $0.624 in total. The service returned references in an unexpected order and did not retain the requested 16:9 setting. The second usable output was inspected at five time samples, transcoded to 30 fps and framed for the master. The exterior output invented board digits and was rejected. It is excluded from the edit and repository. Exact requests, source images, hashes, run IDs and observed outputs are recorded in `source-assets/generated/generated-ledger.json`.

## Music and sound

[Everyone Is Helped](https://suno.com/song/7c0664a6-c0ec-48d4-80b5-c498f341636e) is an instrumental generated in Suno v6 through the owner's Pro account for this film. Creation was credit-free in the displayed promotion; one song download was unlocked from the existing plan allowance. It was downloaded as WAV through the site's interface. No new subscription or purchase was made. Generation and download do not establish an independent licence determination.

The score uses the track's actual opening for 0–24 seconds, a repeated phrase for 24–35, nearly silent original room tone for 35–47, its late breakbeat section at source 140.341–148.341 for the release at 47–55, an original synthesized office bell at 55, and a distant return from source 128.000–132.150 for the ending. The edit keeps the original pitch. Full source intervals and gain treatments are in `source-assets/audio/score-60-edl.json`.

The WAV master measures 60.000 seconds, stereo 48 kHz, −16.00 LUFS and −1.20 dBTP, with no clipped samples. Acoustic judgement belongs to playback of the finished picture; these values are technical checks. Earlier t.A.T.u. downloads and the rejected 72-second music experiment remain local and are not used in this cut.

## Product picture and evidence

Captured from [amiunderclass.com](https://amiunderclass.com), at 1440×900, with a visible pointer and no browser chrome. Protected requests are blurred; output evidence is unaltered. Mode labels remain visible. Product footage is presented at its native aspect ratio with cream margins.

**This cut uses the labelled recorded v1 pilot.** The updated design recording has not been supplied as of this export. The pilot is a historical task-grade experiment; it does not establish a visitor's position or the newer protocol's treatment measures. Window 5 is the recorded presentation, not a measured visitor assignment. The waiting footage explicitly shows an unjoined queue. No new funded visit was started for this edit. See `source-assets/product/capture-notes.md` and `clip-edl.json`.

The approved office art belongs to the project. The male clerk's appearance is preserved. Archivo, Cormorant Garamond and IBM Plex Mono are local font assets. The welcome lettering reuses the site's bitmap alphabet.

## Deliverables and reproduction

`underclass-demo.mp4`: 60 seconds, 1920×1080, 30 fps, H.264 and stereo AAC. `underclass-teaser.mp4`: 15 seconds drawn from master ranges 0–4, 15–18, 47–52 and 57–60. The teaser contains 450 frames, with 8 ms audio splice fades. Seven full-resolution proof frames are in `frames`.

The composition is authored in HyperFrames 0.8.36 with local GSAP 3.14.2 and FFmpeg. `edit/scripts/build.mjs` and `edit/timeline.json` hold picture timing. `source-assets/audio/build_score_60.py` rebuilds the music edit. `edit/README.md` has staging, verification and rendering commands. No upload or publication is part of this export.
