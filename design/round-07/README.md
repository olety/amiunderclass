# Office plates

The source direction is `../DESIGN-LOCK.md`. The build contract is lane B in `../../docs/BUILD-PLAN.md`.

K0 reuses the locked P3 hall plate. Its production exports are 1536 × 1024 and 768 × 512 WebP files, each below 400,000 bytes. The manifest at `../../apps/web/public/plates/plates.json` uses paper corners in a 1152 × 768 stage, ordered top left, top right, bottom right, bottom left.

The corrected `clerk-sheet-male.png` and visitor hand sheet are the approval checkpoint. Their approval status stays false until the owner reviews both. The dependent keyframes begin after that response.

Each generated image has a `.draft.txt` prompt, a `.review.txt` response from `gpt-6-astra` at low reasoning, a final `.txt` prompt, and a `.meta.json` record. Generation uses the requested CPA `gpt-image-2.5-flare` route at medium quality. Reference images use the multipart edits endpoint. PNGs are resized with a centered cover fit to the requested dimensions after their returned sizes are measured.

The P4 close-up supplies the original male clerk's identity, material and office fixtures. The owner rejected the earlier `clerk-sheet.png` because it changed the clerk. The corrected `clerk-sheet-male.png` preserves the P4 man and uses P4 as its sole image reference. The original P3 and P4 remain unchanged.
