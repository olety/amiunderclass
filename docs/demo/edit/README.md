# Underclass? film edit

HyperFrames 0.8.36, 1920×1080, 30 fps, 60 seconds. Deliverables are ../underclass-demo.mp4 and ../underclass-teaser.mp4.

The owner's latest direction gives the welcome twelve seconds before the qualification appears. Evidence has eight clear seconds, the musical release starts at 47 seconds, and the office returns at 55 seconds. BRIEF.md and STORYBOARD.md describe the revised intent. timeline.json records exact picture trims.

## Rebuild

```sh
node scripts/build.mjs
bun run check
bunx hyperframes@0.8.36 snapshot --at 1,4,6,10,13,16,20,25,28,33,37,41,45,49,53,58
bun run render
python3 scripts/teaser.py
```

The master expects assets/audio/underclass-score-60s.wav. Audio production and the source ledger are separate. Do not render a final film with a missing score. The --silent-check build option exists only to inspect picture while the music is being prepared; rebuild without it before delivery.

## Replace approved assets

Supply six approved captures named arrival.mp4, ticket.mp4, waiting.mp4, window.mp4, papers.mp4 and outside.mp4, then run:

```sh
python3 scripts/stage-product.py /path/to/approved/clips
node scripts/build.mjs
```

All current picture is from the real deployed site. Its evidence is an explicitly labelled recorded v1 pilot, so the edit does not claim an actual visitor assignment. --live changes the provenance field only; use it only after replacing footage with a verified real run. Mode labels and actual results must stay intact, and protected requests must already be blurred.

Staging retains source ranges long enough for the edit, converts to frame-exact 30 fps and gives every second a keyframe. Padding only holds the source's final frame; it never invents progress.

Reviewed generated atmosphere can be admitted at assets/generated/welcome.mp4, minimum five seconds, and assets/generated/exit.mp4, minimum three seconds. The builder detects these files and otherwise uses approved office imagery and archive clips. Generated shots never replace measured interface evidence. Keep generation provenance and prompts in ../SOURCES.md.

The project uses local fonts and GSAP. Opening and closing title compositions are maintained separately from scripts/build.mjs. No command here uploads or publishes the film.
