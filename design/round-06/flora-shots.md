# Underclass? · the office · Flora shot list (step two)

Every clip is image-to-video from the same plate, `P3-office-romelas.png`, so the room never changes. Daylight only. Nothing flickers. People move the way people move in a waiting room: a page turns, a head tilts, someone shifts. The horror is that nothing happens.

Landscape 3:2 from the plate; ask for 16:9 output and letterbox the plate, or crop to 16:9 first (keep the board, the five windows, the dispenser at left and the cone at right in frame). Portrait 9:16 variants for phones: crop centred on the counter and the board; the ticket and the papers are portrait objects anyway.

| # | Clip | Source frame | Camera | Length | Must stay fixed | Ends on | Overlay on the last frame |
|---|------|-------------|--------|--------|-----------------|---------|---------------------------|
| 1 | The hall, idle | plate, full | locked off | 8 s, seamless loop | board off, windows numbered 1–5, cone and smear, dispenser | same as first frame | LED board (live), the sign "Everyone is helped", the CTA |
| 2 | Take a ticket | plate, left third | slow push-in toward the red dispenser, ending close on its mouth | 5 s | dispenser red, "PLEASE TAKE A NUMBER" sign legible | a blank ticket half out of the slot | the thermal ticket slides up as the form |
| 3 | Called | plate, full | locked off | 6 s | everything | same | LED board flips to YOUR NAME → WINDOW 5, count 96/96 |
| 4 | To the window | plate, counter | slow dolly right and in, from centre to window 5, ending on the clerk's glass at chest height | 7 s | window numbers legible during the move, clerk seated, calm | the frosted glass of window 5, hands visible below | the clerk's caption on the glass, then the papers rise from the bottom edge |
| 5 | The papers | close on the counter shelf under window 5 | locked off | 5 s | plain shelf, warm light | hands slide three sheets under the glass and withdraw | the ticket, the placement, the advice sheet (HTML), stamped |

Rules for every prompt: describe what is there and what moves, in the present tense, in one paragraph. Same lens, same light, same halftone grain as the plate. Ordinary speed. Nobody looks at the camera. Nobody looks at the cone.

Fallback: if a clip will not hold the room, use the still with a 1.6 s CSS ease on `object-position` and `transform` (already in `office.html`). Reduced motion always gets the stills.

Encode: H.264 720p, ≤ 4 MB per clip, `muted playsinline loop` for 1, `muted playsinline` once for 2–5. Poster frame = the plate crop for that clip so nothing pops on load.

Run route: Flora is reachable through the executor tool as `flora_run_canvas_nodes`, which runs nodes that already exist on a project canvas and spends credits with no confirmation. Build the five nodes on one canvas (image input = the plate, one video node per clip with the prompt above), then run them in one call. Quote the credit cost before running.
