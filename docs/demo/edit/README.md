# Underclass? film edit

HyperFrames 0.8.36, 1920×1080, 30 fps, 60 seconds. Deliverables are ../underclass-demo.mp4 and ../underclass-teaser.mp4.

The latest revision uses main headlines without subtitles, longer connected office shots, 0.35-second dissolves and one continuous musical passage. BRIEF.md and STORYBOARD.md describe the sequence. timeline.json records exact picture trims.

## Rebuild

```sh
node scripts/build.mjs
bun run check
bunx hyperframes@0.8.36 snapshot --at 1,4,6,10,13,16,20,25,28,33,37,41,45,49,53,58
bun run render
python3 scripts/teaser.py
```

The original finished score is included at assets/audio/underclass-score-60s.wav. Full source downloads remain local. Audio production and the source ledger are separate. Do not render a final film with a missing score. The --silent-check build option exists only to inspect picture while the music is being prepared; rebuild without it before delivery.

## Replace approved assets

Supply six approved captures named arrival.mp4, ticket.mp4, waiting.mp4, window.mp4, papers.mp4 and outside.mp4, then run:

```sh
python3 scripts/stage-product.py /path/to/approved/clips
node scripts/build.mjs
```

Product footage comes from the real deployed site. Its evidence is an explicitly labelled recorded v1 pilot, so the edit does not claim an actual visitor assignment. --live changes the provenance field only; use it only after replacing footage with a verified real run. Mode labels and actual results must stay intact, and protected requests must already be blurred.

Staging retains source ranges long enough for the edit, converts to frame-exact 30 fps and gives every second a keyframe. Padding only holds the source's final frame; it never invents progress.

The reviewed atmosphere is included at assets/generated/welcome-slow.mp4 and assets/generated/threshold-endframe.png. The slow clip derives from the five-second welcome.mp4 with a 1.6× timestamp stretch and an outgoing hold, for 8.4 seconds total. Generated shots never replace measured interface evidence. Generation provenance and prompts are in ../SOURCES.md.

The project uses local fonts and GSAP. Opening and closing title compositions are maintained separately from scripts/build.mjs. No command here uploads or publishes the film.
