# Current website footage

Captured from the current local website at `http://127.0.0.1:5173` on 14 September 2026. The current site fills the frame and has removed the former beige navigation/header/footer area.

The browser viewport is 1440×810, encoded to 1920×1080 at 30fps. No capture CSS, altered labels, fake counters, substituted responses or paid submissions were used. The named identity was typed into the form but never sent. Existing source labels remain visible.

| Clip | Duration | Capture record |
| --- | ---: | --- |
| arrival.mp4 |8.6s|capture.json|
| ticket.mp4 |12.6s|capture-ticket.json|
| waiting.mp4 |7.6s|capture.json|
| window.mp4 |10.6s|capture-tail.json|
| outside.mp4 |6.6s|capture-tail.json|

`capture-ticket.mjs` unchecks the actual Rehearse checkbox before recording the ordinary form. It submits nothing. The identity is Citizen 041, affiliation Independent developer.

`capture-tail.mjs` loads the real historical pilot from `/api/example` through the site's button. The clerk remains visibly labelled RECORDED PILOT · NO VISITOR. The first capture's window attempt was discarded after development hot reload cleared its state. The replacement sessions block the Vite websocket in their own browser only, keeping the current rendering and business data intact.

The outside clip records the real copy-prompt button. The final edit substitutes its own editorial comparison for the paper-reading scene, so no new papers clip was needed.
