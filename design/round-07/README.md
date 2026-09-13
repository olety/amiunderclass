# Office plates

The source direction is `../DESIGN-LOCK.md`. The build contract is lane B in `../../docs/BUILD-PLAN.md`.

K0 reuses the locked P3 hall plate. Its production exports are 1536 × 1024 and 768 × 512 WebP files, each below 400,000 bytes. The manifest at `../../apps/web/public/plates/plates.json` uses paper corners in a 1152 × 768 stage, ordered top left, top right, bottom right, bottom left.

The owner approved `clerk-sheet-male.png` with the response "sure, corrected one makes sense". The original hand sheet remains the visitor hand, cuff and watch reference. Keyframes use the corrected male clerk and retain their own pending approval status until reviewed.

Each generated image has a `.draft.txt` prompt, a `.review.txt` response from `gpt-6-astra` at low reasoning, a final `.txt` prompt, and a `.meta.json` record. Generation uses the requested CPA `gpt-image-2.5-flare` route at medium quality. Reference images use the multipart edits endpoint. PNGs are resized with a centered cover fit to the requested dimensions after their returned sizes are measured.

The P4 close-up supplies the original male clerk's identity, material and office fixtures. The owner rejected the earlier `clerk-sheet.png` because it changed the clerk. The corrected `clerk-sheet-male.png` preserves the P4 man and uses P4 as its sole image reference. The original P3 and P4 remain unchanged.

All nine landscape frames are exported. New keyframes retain `ownerApproved: false`; the corrected character sheet approval does not imply frame approval. K3 was requested at medium quality and returned high. Other selected generated keyframes returned medium. Rejected attempts remain under `rejected/` with their prompts, reviews and failure notes.

K1 preserves the round P3 dispenser. The original hand sheet's rectangular dispenser is excluded from its final references by using separate dispenser and hand crops, recorded under `references/`. The ticket is halfway inside the outlet, so its upper physical corners are hidden and its lower-right corner is occluded by the thumb. K1's manifest `paper` quad is a fully visible inset printable area, approximately 40 × 23 stage pixels. It suits the compact ticket mark; the form must lift for reading and input. `K1.geometry.json` records this distinction. K5 uses the actual sheet corners, with a small uncertainty where the lower edge meets the tray rim.

K2 is cropped from its full generated view to enlarge the board while retaining all five window signs. Its manifest `board` quad and `K2.geometry.json` describe the final crop. The geometry record also gives a padded rectangle that covers every baked amber dot. Keep HTML text opaque over that field.

Four portrait variants are exported for K0, K1, K4-5 and K5. Their original PNGs are 1024 × 1536. To provide the same export widths as the landscape set, the WebPs are 1536 × 2304 and 768 × 1152, each below 400,000 bytes. The larger export is an upscale of the original PNG. K5 portrait was requested at medium quality and returned low; its paper geometry and clerk continuity passed visual inspection.

Portrait geometry uses the same normalized image basis of 1152 × 768, with independent axes. For a 1024 × 1536 source PNG, multiply x by 1.125 and y by 0.5. The frontend uses the selected image dimensions and its CSS cover position to map that normalized basis onto the viewport. Each portrait lives inside its landscape entry's `portrait` object. K0 portrait includes its own `board` quad; K1 uses a printable inset; K5 uses all four actual paper corners. The portrait images remain pending owner frame review.
