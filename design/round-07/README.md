# Office plates

The source direction is `../DESIGN-LOCK.md`. The build contract is lane B in `../../docs/BUILD-PLAN.md`.

K0 reuses the locked P3 hall plate. Its production exports are 1536 × 1024 and 768 × 512 WebP files, each below 400,000 bytes. The manifest at `../../apps/web/public/plates/plates.json` uses paper corners in a 1152 × 768 stage, ordered top left, top right, bottom right, bottom left.

The clerk and visitor hand sheets are the approval checkpoint. Their approval status stays false until the owner reviews both. The dependent keyframes begin after that response.

Each generated image has a `.draft.txt` prompt, a `.review.txt` response from `gpt-6-astra` at low reasoning, a final `.txt` prompt, and a `.meta.json` record. Generation uses the requested CPA `gpt-image-2.5-flare` route at medium quality. Reference images use the multipart edits endpoint. PNGs are resized with a centered cover fit to the requested dimensions after their returned sizes are measured.

The P4 close-up supplies the sheet material and office fixtures. Its existing male clerk is replaced by the woman described in the build plan. The original P3 and P4 remain unchanged.
