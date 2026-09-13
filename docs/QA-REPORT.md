# Browser QA report

> Captures below predate the 14 Sep 2026 redesign (page chrome removed, office fills the screen, protocol v3 with a visitor-only run and published baselines). Functional assertions still describe the flow; visuals are historical.

139/140 recorded assertions passed across 7 phases. 1 premature resize assertion is retained as failed and superseded by the settled portrait check. No functional defect remains open in these checks. Named and nameless visits used the real local Worker and Durable Object rehearsal path. Their answers and window placements are synthetic fixtures. No paid model measurement was performed.

Use the [settled desktop arrival](qa/settled-1440-arrival.png), [settled desktop recorded window](qa/settled-1440-window-recorded.png), [portrait arrival](qa/portrait-390-arrival.png) and [portrait paper tray](qa/portrait-390-papers-settled.png) for final visual review. These captures wait for the selected responsive image to decode. Earlier files named final-1440 preserve the first resize capture and are superseded for presentation by settled-1440 files.

| Phase | Pass / total | App revision | Started | Machine-readable evidence |
| --- | --- | --- | --- | --- |
| Named desktop integration | 21/21 | 3d96587 | 13 Sept 2026, 15:04:10 JST | [named-results.json](qa/named-results.json) |
| Recorded papers, accessibility and error states | 47/47 | 3d96587 | 13 Sept 2026, 15:04:54 JST | [ui-results.json](qa/ui-results.json) |
| Cancellation and delayed response regression | 9/9 | 4ff8a71 | 13 Sept 2026, 15:07:49 JST | [cancel-results.json](qa/cancel-results.json) |
| Failed cancellation and retry | 4/4 | 4ff8a71 | 13 Sept 2026, 15:08:48 JST | [cancel-retry-results.json](qa/cancel-retry-results.json) |
| Final mobile integration and desktop visual retakes | 28/29 | c1cf2e0 | 13 Sept 2026, 15:26:08 JST | [nameless-results.json](qa/nameless-results.json) |
| Window 2 and 4 placards | 10/10 | c1cf2e0 | 13 Sept 2026, 15:26:08 JST | [window-results.json](qa/window-results.json) |
| Portrait controls and settled desktop visual retakes | 20/20 | bb3396e | 13 Sept 2026, 15:38:06 JST | [portrait-results.json](qa/portrait-results.json) |

The named visit completed 72/72 calls. The final nameless visit completed 48/48. Both recorded $0 known, $0 uncertain and $0 reserved cost. The $0.30 cap is a ceiling, not spending. Every actual create sent rehearsal:true, without a provider key. The script required liveEnabled:false and rehearsalEnabled:true before creating any visit and blocked external browser requests. No provider or Turnstile request was needed.

The browser was headless Chrome 152.0.7977.84 driven through Playwright. The app ran at http://localhost:5173 with its existing proxy to the Worker at port 8787. Desktop viewport was 1440×900; mobile was 390×844. The nameless phase resized the same real rehearsal state for its desktop checks. Later settled desktop and portrait retakes use static rooms and the recorded pilot, with zero create requests. No mocked success was substituted for either complete visit.

Protocol version was underclass-v2. The named/config protocol hash was `aa130e60714756d53edfe535f1d4a7404106b0cbb5269f9754e80d906e254e8b`. The nameless condition set differs; its condensed receipt did not retain protocol.hash, so no nameless hash is claimed here. Future script receipts retain the snapshot hash explicitly. The named export used the synthetic identity QA 山田 Haruto, pronouns xe/QA, affiliation QA 赤い傘研究所 and email qa-canary@example.invalid. Default export removed all four values and the visitor system sentence. Identity opt-in restored them. No capability or provider credential was saved in these evidence files.

Clipboard content matched the served .md, served .txt and canonical docs/AGENT-PROMPT.md byte for byte. SHA-256 was `7df6235c57670565c3bf8733a9cef2a2649af3191e587982558779b46e22a242`, 13,165 bytes.

## Defects found and resolved

| Finding | Resolution | Verification |
| --- | --- | --- |
| Leave the queue remained disabled after create. | Action controls synchronize when request state changes. | Real cancellation and pending-first-read cancellation pass. |
| A held first read delayed the cancellation confirmation. | Waiting messages refresh before returning when no snapshot exists. | Confirmation remains visible while an older running read is released. |
| Desktop room width shrank to 1080px inside a 1440px layout. | Room width and height are explicit. | Final desktop reflow captures cover all six rooms. |
| The paper signature block inherited the room sign position and covered the comrade footer. | Room sign styles are scoped to the arrival sign. | Signature/attribution no longer overlap; mobile text-range checks pass. |
| Lowered mobile ticket and tray-paper controls were clipped by hardcoded stage transforms. | Ticket pickup has a visible control; paper uses its measured corners without the old mobile transform. | Actual ticket and paper hit targets are tested and clicked in the final mobile and portrait phases. |
| Windows 2 and 4 reused a photograph with a baked-in 3. | Matching projected number placards cover the photographed sign. | Isolated verdict 2 and 4 fixtures check sign, metadata and paper agreement at both widths. |
| Outside attributed the wrong upstream license. | The pinned source is attributed under MIT. | Final mobile Outside text check. |

The first pass is retained in [first-pass-results.json](qa/first-pass-results.json). It exposed the disabled cancellation control. It also had three harness errors: waiting for the hidden desktop form before lifting the ticket; counting capUsd as spent money; and comparing uppercase gilt-paper attribution with case-sensitive mixed-case text. The corrected script and final phases supersede those assertions. Early lift screenshots could catch the 260ms transition; the final captures wait for finite animations to finish. [cancel-first-results.json](qa/cancel-first-results.json) retains the confirmation defect and an early response-listener timing assertion. The current cancellation phase reads the completed evidence after the UI has settled.

The final mobile receipt remains 28/29. Its paper-bounds assertion read the previous desktop transform immediately after setViewportSize returned. The following real paper click succeeded, as did the rest of the visit. The harness now waits two animation frames after resize and decodes the selected image. The later portrait check repeats the desktop-to-mobile transition, measures a fully contained 188×186px paper target and clicks it successfully. This closes the geometry concern without repeating the protocol or changing the original receipt. The first static portrait attempt also needed explicit waits for the recorded navigation and image decode; [portrait-first-results.json](qa/portrait-first-results.json) is retained separately from the final portrait phase.

## Scope and limits

The live-disabled recorded path is a real /api/example read with zero create requests. Study values were compared with the current source, including its corrections to the older papers.html reference. All five options retain study attribution and label their windows as illustrations. The three paper objects were inspected at 390px and 1440px. Their body text is at least 12 CSS pixels; no text range extends beyond the mobile viewport. Receipt text has no blur or mask, its crease sits behind the text, and the form stamp has no rotation.

The 503 live-disabled, exhausted and busy states are isolated browser response fixtures. Expiry uses a real rehearsal followed by a mocked 410 read; deletion was verified against the real API and a real subsequent 410. Cancellation used the real API. Its delayed-read and failed-cancel variants are explicitly marked in the table. The window 2 and 4 checks inject completed visual fixtures with zero finished calls, solely to verify placard and paper agreement. They are not real run outcomes. Expected HTTP failures from fixtures are separate from runtime errors. The checked browser sessions had no unexpected console errors, runtime exceptions, credential or identity URLs, or external requests.

The 200% check uses a 720×450 layout viewport to exercise the reflow of a 1440×900 window at 200%. It does not claim browser-chrome zoom verification. This report covers Chromium, not Safari, a physical phone, assistive-technology speech output, live Turnstile, BYOK admission, provider billing or a paid v2 pilot. The paid pilot remains pending in config.

## Final plates observed

Earlier complete-flow screenshots used the original male-clerk window still and the provisional ticket, hall and paper stills. The named phase records those exact currentSrc values. The final mobile phase and its desktop retakes loaded the following assets.

| Session | Room | Browser image source |
| --- | --- | --- |
| nameless-390 | arrival | `/plates/K0-small.webp` |
| nameless-390 | ticket | `/plates/K1-small.webp` |
| nameless-390 | waiting | `/plates/K2-small.webp` |
| nameless-390 | window | `/plates/K4-5-small.webp` |
| nameless-390 | papers | `/plates/K5-small.webp` |
| nameless-390 | outside | `/plates/K6-small.webp` |
| portrait-390 | arrival | `/plates/K0-portrait-small.webp` |
| portrait-390 | ticket | `/plates/K1-portrait-small.webp` |
| portrait-390 | window | `/plates/K4-5-portrait-small.webp` |
| portrait-390 | papers | `/plates/K5-portrait-small.webp` |
| settled-1440 | arrival | `/plates/K0.webp` |
| settled-1440 | ticket | `/plates/K1.webp` |
| settled-1440 | waiting-no-active-run | `/plates/K2.webp` |
| settled-1440 | window-recorded | `/plates/K4-5.webp` |
| settled-1440 | papers-recorded | `/plates/K5.webp` |
| settled-1440 | outside-recorded | `/plates/K6.webp` |

## Reproduce

Start the app and local Worker separately with live runs disabled and rehearsal enabled. The QA script deliberately starts no server. From the repository root, run:

```sh
rtk proxy env PLAYWRIGHT_MODULE=/path/to/playwright node docs/qa/browser-qa.mjs
```

Omit PLAYWRIGHT_MODULE when playwright resolves normally. Optional QA_PHASE selects a phase by regular expression; QA_RESULTS chooses its JSON filename; QA_APP_REVISION records the tested app commit; QA_CANONICAL_PROMPT overrides the canonical prompt path. QA_CAPTURE_DESKTOP=1 adds desktop retakes while running the final nameless phase. QA_ORIGIN is restricted to localhost or 127.0.0.1. Run `rtk proxy node docs/qa/write-report.mjs` to rebuild this report from the named phase receipts.

## Checks

### Named desktop integration

| Check | Result | Evidence | Mode |
| --- | --- | --- | --- |
| named-1440 arrival: no horizontal scroll | PASS | [docs/qa/named-1440-arrival.png](qa/named-1440-arrival.png). {"viewport":1440,"document":1440,"body":1440,"room":"arrival"} | real integration |
| named-1440 identity preview | PASS | See phase JSON. All four supplied synthetic identity fields appear in the sentence. | real integration |
| named-1440 ticket: no horizontal scroll | PASS | [docs/qa/named-1440-ticket.png](qa/named-1440-ticket.png). {"viewport":1440,"document":1440,"body":1440,"room":"ticket"} | real integration |
| named-1440 waiting: no horizontal scroll | PASS | [docs/qa/named-1440-waiting.png](qa/named-1440-waiting.png). {"viewport":1440,"document":1440,"body":1440,"room":"waiting"} | real integration |
| named-1440 real progress | PASS | [docs/qa/named-1440-waiting-progress.png](qa/named-1440-waiting-progress.png). 4 / 72 calls finished · 0 missing · 0 not sent → 8 / 72 calls finished · 0 missing · 0 not sent | real integration |
| named-1440 window: no horizontal scroll | PASS | [docs/qa/named-1440-window.png](qa/named-1440-window.png). {"viewport":1440,"document":1440,"body":1440,"room":"window"} | real integration |
| named-1440 completed rehearsal | PASS | See phase JSON. completed; 72/72 calls; rehearsal. | real integration |
| named-1440 zero cost | PASS | See phase JSON. {"knownUsd":0,"uncertainUsd":0,"reservedUsd":0,"capUsd":0.3} | real integration |
| named-1440 condition count | PASS | See phase JSON. visitor, anonymous, reference | real integration |
| named-1440 papers: no horizontal scroll | PASS | [docs/qa/named-1440-papers.png](qa/named-1440-papers.png). {"viewport":1440,"document":1440,"body":1440,"room":"papers"} | real integration |
| named-1440 paper lift | PASS | [docs/qa/named-1440-papers-lifted.png](qa/named-1440-papers-lifted.png). The paper is readable and focus moves to Return to the tray. | real integration |
| named-1440 exact told sentence | PASS | [docs/qa/named-1440-papers-lifted.png](qa/named-1440-papers-lifted.png). Paper text equals told.visitor from the real snapshot. | real integration |
| named-1440 outside: no horizontal scroll | PASS | [docs/qa/named-1440-outside.png](qa/named-1440-outside.png). {"viewport":1440,"document":1440,"body":1440,"room":"outside"} | real integration |
| named-1440 transcripts | PASS | See phase JSON. The real rehearsal transcripts are present. | real integration |
| named-1440 clipboard exact bytes | PASS | See phase JSON. Clipboard, served .md/.txt and canonical prompt SHA-256 7df6235c57670565c3bf8733a9cef2a2649af3191e587982558779b46e22a242; 13165 bytes. | real integration |
| named-1440 export redacted by default | PASS | See phase JSON. Name, pronouns, affiliation, email and visitor system text are redacted. | real integration |
| named-1440 export identity opt-in | PASS | See phase JSON. All four synthetic identity fields are included only after opt-in. | real integration |
| named-1440 export preserves evidence | PASS | See phase JSON. 36 trials and protocol counts retained. | real integration |
| named-1440 real deletion and 410 | PASS | [docs/qa/named-1440-deleted.png](qa/named-1440-deleted.png). DELETE succeeded; authenticated read returned 410; export removed. | real integration |
| named-1440 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| named-1440 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 0 recorded HTTP failures. | real integration |

### Recorded papers, accessibility and error states

| Check | Result | Evidence | Mode |
| --- | --- | --- | --- |
| Live-disabled recorded path sends no identity | PASS | [docs/qa/recorded-window-390.png](qa/recorded-window-390.png). Unchecked rehearsal opens /api/example without POST /api/runs. | real integration |
| Recorded v1 attribution | PASS | [docs/qa/recorded-pilot-390.png](qa/recorded-pilot-390.png). The pilot keeps its v1 provenance and no-visitor label. | real integration |
| Study askell values and paper | PASS | [docs/qa/study-askell-390.png](qa/study-askell-390.png). Amanda Askell; −7.3 pp; +8.1 pp; +25 pp; 4.31 σ; Letter on gilt-edged card. | real integration |
| Study askell mobile width | PASS | [docs/qa/study-askell-390.png](qa/study-askell-390.png). {"viewport":390,"scroll":390} | real integration |
| Study askell text and stamp treatment | PASS | [docs/qa/study-askell-390.png](qa/study-askell-390.png). {"minimumTextPx":12,"clippedText":[],"signatureOverlap":false,"stampTransforms":[],"receiptTextFilter":null,"receiptTextMask":null} | real integration |
| Study askell switcher state | PASS | See phase JSON. Only the selected study identity is pressed. | real integration |
| Study greenblatt values and paper | PASS | [docs/qa/study-greenblatt-390.png](qa/study-greenblatt-390.png). Ryan Greenblatt; 3.98 σ; −2.29 σ; −6.94 σ; Letter on gilt-edged card. | real integration |
| Study greenblatt mobile width | PASS | [docs/qa/study-greenblatt-390.png](qa/study-greenblatt-390.png). {"viewport":390,"scroll":390} | real integration |
| Study greenblatt text and stamp treatment | PASS | [docs/qa/study-greenblatt-390.png](qa/study-greenblatt-390.png). {"minimumTextPx":12,"clippedText":[],"signatureOverlap":false,"stampTransforms":[],"receiptTextFilter":null,"receiptTextMask":null} | real integration |
| Study greenblatt switcher state | PASS | See phase JSON. Only the selected study identity is pressed. | real integration |
| Study kyle-miri values and paper | PASS | [docs/qa/study-kyle-miri-390.png](qa/study-kyle-miri-390.png). Kyle Joffrion; +0.73 pp; +0.1 pp; Placement form in triplicate. | real integration |
| Study kyle-miri mobile width | PASS | [docs/qa/study-kyle-miri-390.png](qa/study-kyle-miri-390.png). {"viewport":390,"scroll":390} | real integration |
| Study kyle-miri text and stamp treatment | PASS | [docs/qa/study-kyle-miri-390.png](qa/study-kyle-miri-390.png). {"minimumTextPx":12,"clippedText":[],"signatureOverlap":false,"stampTransforms":["none"],"receiptTextFilter":null,"receiptTextMask":null} | real integration |
| Study kyle-miri switcher state | PASS | See phase JSON. Only the selected study identity is pressed. | real integration |
| Study kyle-gmail values and paper | PASS | [docs/qa/study-kyle-gmail-390.png](qa/study-kyle-gmail-390.png). Kyle Joffrion; −0.27 pp; +2.1 pp; 19%; 70 personas; Thermal receipt. | real integration |
| Study kyle-gmail mobile width | PASS | [docs/qa/study-kyle-gmail-390.png](qa/study-kyle-gmail-390.png). {"viewport":390,"scroll":390} | real integration |
| Study kyle-gmail text and stamp treatment | PASS | [docs/qa/study-kyle-gmail-390.png](qa/study-kyle-gmail-390.png). {"minimumTextPx":12,"clippedText":[],"signatureOverlap":false,"stampTransforms":[],"receiptTextFilter":"none","receiptTextMask":"none"} | real integration |
| Study kyle-gmail switcher state | PASS | See phase JSON. Only the selected study identity is pressed. | real integration |
| Study bender values and paper | PASS | [docs/qa/study-bender-390.png](qa/study-bender-390.png). Emily Bender; +14 pp; −13 pp; Thermal receipt. | real integration |
| Study bender mobile width | PASS | [docs/qa/study-bender-390.png](qa/study-bender-390.png). {"viewport":390,"scroll":390} | real integration |
| Study bender text and stamp treatment | PASS | [docs/qa/study-bender-390.png](qa/study-bender-390.png). {"minimumTextPx":12,"clippedText":[],"signatureOverlap":false,"stampTransforms":[],"receiptTextFilter":"none","receiptTextMask":"none"} | real integration |
| Study bender switcher state | PASS | See phase JSON. Only the selected study identity is pressed. | real integration |
| Reduced-motion board is static | PASS | [docs/qa/reduced-motion-arrival-1440.png](qa/reduced-motion-arrival-1440.png). Identical board SVG across the 3.2-second rotation interval; no video or audio elements. | real integration |
| Keyboard skip link | PASS | [docs/qa/keyboard-skip-link-1440.png](qa/keyboard-skip-link-1440.png). First Tab focuses the room skip link. | real integration |
| Keyboard room navigation and heading focus | PASS | See phase JSON. ArrowRight opens Your ticket and focuses its heading. | real integration |
| Input arrow keys preserve editing focus | PASS | [docs/qa/keyboard-field-focus-1440.png](qa/keyboard-field-focus-1440.png). {"focused":true,"outlineStyle":"none","outlineWidth":"0px","boxShadow":"rgb(34, 34, 34) 0px 2px 0px 0px","borderBottom":"1px dashed rgb(119, 119, 119)"} | real integration |
| 200 percent layout zoom reflow | PASS | [docs/qa/zoom-200-reflow-comrade.png](qa/zoom-200-reflow-comrade.png). {"viewport":720,"scroll":720,"text":"12px"}; 720×450 layout viewport for a 1440×900 window at 200%. This verifies reflow, not browser chrome zoom. | real integration |
| Empty name validation | PASS | [docs/qa/error-empty-name-390.png](qa/error-empty-name-390.png). Empty named submission stays on the ticket without a create. | real integration |
| Control character validation | PASS | [docs/qa/error-control-name-390.png](qa/error-control-name-390.png). Control-character submission stays on the ticket without a create. | real integration |
| Mocked live_disabled ticket error | PASS | [docs/qa/mock-error-live_disabled-390.png](qa/mock-error-live_disabled-390.png). 503 live_disabled injected at the browser route; no real create forwarded. | isolated browser response fixture |
| Mocked budget_exhausted ticket error | PASS | [docs/qa/mock-error-budget_exhausted-390.png](qa/mock-error-budget_exhausted-390.png). 503 budget_exhausted injected at the browser route; no real create forwarded. | isolated browser response fixture |
| Mocked campaign_busy ticket error | PASS | [docs/qa/mock-error-campaign_busy-390.png](qa/mock-error-campaign_busy-390.png). 503 campaign_busy injected at the browser route; no real create forwarded. | isolated browser response fixture |
| Mocked expiry removes active controls and explains state | PASS | [docs/qa/mock-expired-390.png](qa/mock-expired-390.png). A real rehearsal was created; only its next read was mocked to 410. | real rehearsal followed by isolated browser response fixture |
| recorded-390 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| recorded-390 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 0 recorded HTTP failures. | real integration |
| a11y-1440 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| a11y-1440 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 0 recorded HTTP failures. | real integration |
| validation-390 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| validation-390 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 0 recorded HTTP failures. | real integration |
| mock-live_disabled request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| mock-live_disabled browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 1 recorded HTTP failures. | real integration |
| mock-budget_exhausted request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| mock-budget_exhausted browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 1 recorded HTTP failures. | real integration |
| mock-campaign_busy request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| mock-campaign_busy browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 1 recorded HTTP failures. | real integration |
| mock-expired-390 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| mock-expired-390 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 1 recorded HTTP failures. | real integration |

### Cancellation and delayed response regression

| Check | Result | Evidence | Mode |
| --- | --- | --- | --- |
| Real cancellation reaches a terminal result | PASS | [docs/qa/real-cancelled-390.png](qa/real-cancelled-390.png). cancelled; 4 finished, 68 skipped. | real integration |
| Cancelled partial paper keeps missing values | PASS | [docs/qa/real-cancelled-paper-390.png](qa/real-cancelled-paper-390.png). Unavailable comparison values remain unavailable. | real integration |
| Cancel enabled while first read is pending | PASS | [docs/qa/cancel-first-read-pending-390.png](qa/cancel-first-read-pending-390.png). Real create has returned while the first real running snapshot is held at the browser route. | real rehearsal with isolated delayed-read fixture |
| Confirmed cancellation survives stale running snapshots | PASS | [docs/qa/cancel-stale-running-390.png](qa/cancel-stale-running-390.png). Real cancel returned successfully; the held older running read cannot re-enable Leave the queue. | real rehearsal and cancel with isolated delayed-read fixture |
| Stale cancellation eventually collects terminal result | PASS | [docs/qa/cancel-stale-terminal-390.png](qa/cancel-stale-terminal-390.png). After the delayed read, the real terminal cancelled snapshot opens the window. | real rehearsal and cancel with isolated delayed-read fixture |
| cancel-390 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| cancel-390 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 0 recorded HTTP failures. | real integration |
| cancel-stale-390 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| cancel-stale-390 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 0 recorded HTTP failures. | real integration |

### Failed cancellation and retry

| Check | Result | Evidence | Mode |
| --- | --- | --- | --- |
| Failed cancellation restores the retry control | PASS | [docs/qa/mock-cancel-failed-390.png](qa/mock-cancel-failed-390.png). An isolated 503 cancel response prints the error and leaves Leave the queue available to retry. | real rehearsal with isolated cancel-error fixture |
| Cancellation retry reaches the real terminal result | PASS | [docs/qa/cancel-retry-complete-390.png](qa/cancel-retry-complete-390.png). After removing the fixture, the real cancel request succeeds. | real rehearsal after isolated cancel-error fixture |
| cancel-failed-390 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| cancel-failed-390 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 1 recorded HTTP failures. | real integration |

### Final mobile integration and desktop visual retakes

| Check | Result | Evidence | Mode |
| --- | --- | --- | --- |
| nameless-390 arrival: no horizontal scroll | PASS | [docs/qa/nameless-390-arrival.png](qa/nameless-390-arrival.png). {"viewport":390,"document":390,"body":390,"room":"arrival"} | real integration |
| Final desktop arrival visual reflow | PASS | [docs/qa/final-1440-arrival.png](qa/final-1440-arrival.png). Same real mobile rehearsal state resized to 1440×900; {"viewport":1440,"scroll":1440} | real integration |
| Mobile lowered-ticket hit target | PASS | [docs/qa/nameless-390-ticket-lowered.png](qa/nameless-390-ticket-lowered.png). {"left":39.5,"top":567.5,"right":203.734375,"bottom":612,"width":164.234375,"height":44.5,"withinRoom":true} | real integration |
| nameless-390 ticket: no horizontal scroll | PASS | [docs/qa/nameless-390-ticket.png](qa/nameless-390-ticket.png). {"viewport":390,"document":390,"body":390,"room":"ticket"} | real integration |
| Final desktop ticket visual reflow | PASS | [docs/qa/final-1440-ticket.png](qa/final-1440-ticket.png). Same real mobile rehearsal state resized to 1440×900; {"viewport":1440,"scroll":1440} | real integration |
| nameless-390 waiting: no horizontal scroll | PASS | [docs/qa/nameless-390-waiting.png](qa/nameless-390-waiting.png). {"viewport":390,"document":390,"body":390,"room":"waiting"} | real integration |
| Final desktop waiting visual reflow | PASS | [docs/qa/final-1440-waiting.png](qa/final-1440-waiting.png). Same real mobile rehearsal state resized to 1440×900; {"viewport":1440,"scroll":1440} | real integration |
| nameless-390 real progress | PASS | [docs/qa/nameless-390-waiting-progress.png](qa/nameless-390-waiting-progress.png). 4 / 48 calls finished · 0 missing · 0 not sent → 8 / 48 calls finished · 0 missing · 0 not sent | real integration |
| nameless-390 window: no horizontal scroll | PASS | [docs/qa/nameless-390-window.png](qa/nameless-390-window.png). {"viewport":390,"document":390,"body":390,"room":"window"} | real integration |
| Final desktop window visual reflow | PASS | [docs/qa/final-1440-window.png](qa/final-1440-window.png). Same real mobile rehearsal state resized to 1440×900; {"viewport":1440,"scroll":1440} | real integration |
| nameless-390 completed rehearsal | PASS | See phase JSON. completed; 48/48 calls; rehearsal. | real integration |
| nameless-390 zero cost | PASS | See phase JSON. {"knownUsd":0,"uncertainUsd":0,"reservedUsd":0,"capUsd":0.3} | real integration |
| nameless-390 condition count | PASS | See phase JSON. anonymous, reference | real integration |
| nameless-390 papers: no horizontal scroll | PASS | [docs/qa/nameless-390-papers.png](qa/nameless-390-papers.png). {"viewport":390,"document":390,"body":390,"room":"papers"} | real integration |
| Final desktop papers visual reflow | PASS | [docs/qa/final-1440-papers.png](qa/final-1440-papers.png). Same real mobile rehearsal state resized to 1440×900; {"viewport":1440,"scroll":1440} | real integration |
| Mobile actual paper hit target | FAIL, superseded by settled portrait check | [docs/qa/nameless-390-paper-hit-target.png](qa/nameless-390-paper-hit-target.png). {"left":461.23309326171875,"top":437.05560302734375,"right":955.2572021484375,"bottom":631.1007080078125,"width":494.02410888671875,"height":194.04510498046875,"withinRoom":false} | real integration |
| nameless-390 paper lift | PASS | [docs/qa/nameless-390-papers-lifted.png](qa/nameless-390-papers-lifted.png). The paper is readable and focus moves to Return to the tray. | real integration |
| nameless-390 nameless paper | PASS | [docs/qa/nameless-390-papers-lifted.png](qa/nameless-390-papers-lifted.png). Nameless convention printed separately from evidence. | real integration |
| nameless-390 outside: no horizontal scroll | PASS | [docs/qa/nameless-390-outside.png](qa/nameless-390-outside.png). {"viewport":390,"document":390,"body":390,"room":"outside"} | real integration |
| Final desktop outside visual reflow | PASS | [docs/qa/final-1440-outside.png](qa/final-1440-outside.png). Same real mobile rehearsal state resized to 1440×900; {"viewport":1440,"scroll":1440} | real integration |
| Pinned upstream license copy | PASS | See phase JSON. Outside attributes the pinned upstream MIT license. | real integration |
| nameless-390 transcripts | PASS | See phase JSON. The real rehearsal transcripts are present. | real integration |
| nameless-390 clipboard exact bytes | PASS | See phase JSON. Clipboard, served .md/.txt and canonical prompt SHA-256 7df6235c57670565c3bf8733a9cef2a2649af3191e587982558779b46e22a242; 13165 bytes. | real integration |
| nameless-390 export redacted by default | PASS | See phase JSON. Identity remains null. | real integration |
| nameless-390 export identity opt-in | PASS | See phase JSON. Opt-in does not invent an identity. | real integration |
| nameless-390 export preserves evidence | PASS | See phase JSON. 24 trials and protocol counts retained. | real integration |
| nameless-390 real deletion and 410 | PASS | [docs/qa/nameless-390-deleted.png](qa/nameless-390-deleted.png). DELETE succeeded; authenticated read returned 410; export removed. | real integration |
| nameless-390 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| nameless-390 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 0 recorded HTTP failures. | real integration |

### Window 2 and 4 placards

| Check | Result | Evidence | Mode |
| --- | --- | --- | --- |
| Mocked window 2 sign and meta at 390 | PASS | [docs/qa/mock-window-2-390.png](qa/mock-window-2-390.png). Placard 2; window 2 · 13 Sept 2026 · anthropic/claude-sonnet-5 · 0 calls · 0 s; no real create was forwarded. | isolated completed visual fixture |
| Mocked window 2 sign and meta at 1440 | PASS | [docs/qa/mock-window-2-1440.png](qa/mock-window-2-1440.png). Placard 2; window 2 · 13 Sept 2026 · anthropic/claude-sonnet-5 · 0 calls · 0 s; no real create was forwarded. | isolated completed visual fixture |
| Mocked window 2 paper agrees | PASS | [docs/qa/mock-window-2-paper-390.png](qa/mock-window-2-paper-390.png). The paper checkbox and stamp both name window 2. | isolated completed visual fixture |
| Mocked window 4 sign and meta at 390 | PASS | [docs/qa/mock-window-4-390.png](qa/mock-window-4-390.png). Placard 4; window 4 · 13 Sept 2026 · anthropic/claude-sonnet-5 · 0 calls · 0 s; no real create was forwarded. | isolated completed visual fixture |
| Mocked window 4 sign and meta at 1440 | PASS | [docs/qa/mock-window-4-1440.png](qa/mock-window-4-1440.png). Placard 4; window 4 · 13 Sept 2026 · anthropic/claude-sonnet-5 · 0 calls · 0 s; no real create was forwarded. | isolated completed visual fixture |
| Mocked window 4 paper agrees | PASS | [docs/qa/mock-window-4-paper-390.png](qa/mock-window-4-paper-390.png). The paper checkbox and stamp both name window 4. | isolated completed visual fixture |
| mock-window-2 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| mock-window-2 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 0 recorded HTTP failures. | real integration |
| mock-window-4 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| mock-window-4 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 0 recorded HTTP failures. | real integration |

### Portrait controls and settled desktop visual retakes

| Check | Result | Evidence | Mode |
| --- | --- | --- | --- |
| Portrait K0 selected and contained | PASS | [docs/qa/portrait-390-arrival.png](qa/portrait-390-arrival.png). Loaded /plates/K0-portrait-small.webp; {"viewport":390,"scroll":390}. | recorded visit and image selection check |
| Portrait K1 selected and contained | PASS | [docs/qa/portrait-390-ticket.png](qa/portrait-390-ticket.png). Loaded /plates/K1-portrait-small.webp; {"viewport":390,"scroll":390}. | recorded visit and image selection check |
| Portrait ticket pickup target | PASS | [docs/qa/portrait-390-ticket.png](qa/portrait-390-ticket.png). {"left":39.5,"top":567.5,"right":203.734375,"bottom":612,"width":164.234375,"height":44.5,"withinRoom":true} | recorded visit and image selection check |
| Portrait K4-5 selected and contained | PASS | [docs/qa/portrait-390-window.png](qa/portrait-390-window.png). Loaded /plates/K4-5-portrait-small.webp; {"viewport":390,"scroll":390}. | recorded visit and image selection check |
| Recorded duration display | PASS | [docs/qa/portrait-390-window.png](qa/portrait-390-window.png). The recorded window prints 89.1 s while stored evidence retains its original precision. | recorded visit and image selection check |
| Portrait K5 selected and contained | PASS | [docs/qa/portrait-390-papers.png](qa/portrait-390-papers.png). Loaded /plates/K5-portrait-small.webp; {"viewport":390,"scroll":390}. | recorded visit and image selection check |
| Portrait paper lift target | PASS | [docs/qa/portrait-390-papers-settled.png](qa/portrait-390-papers-settled.png). After desktop→mobile resize and two animation frames: {"left":99.93080139160156,"top":392.99346923828125,"right":287.531005859375,"bottom":578.9014892578125,"width":187.60020446777344,"height":185.90802001953125,"withinRoom":true} | recorded visit and image selection check |
| Portrait actual paper lifts | PASS | [docs/qa/portrait-390-papers-lifted.png](qa/portrait-390-papers-lifted.png). The physical paper button opens the recorded pilot paper. | recorded visit and image selection check |
| Portrait checks create no run | PASS | See phase JSON. Only config, plates and the recorded example were read. | recorded visit and image selection check |
| Settled desktop arrival | PASS | [docs/qa/settled-1440-arrival.png](qa/settled-1440-arrival.png). {"viewport":1440,"scroll":1440}; current static room or recorded pilot, no active run. | static room or recorded pilot visual retake |
| Settled desktop ticket | PASS | [docs/qa/settled-1440-ticket.png](qa/settled-1440-ticket.png). {"viewport":1440,"scroll":1440}; current static room or recorded pilot, no active run. | static room or recorded pilot visual retake |
| Settled desktop waiting-no-active-run | PASS | [docs/qa/settled-1440-waiting-no-active-run.png](qa/settled-1440-waiting-no-active-run.png). {"viewport":1440,"scroll":1440}; current static room or recorded pilot, no active run. | static room or recorded pilot visual retake |
| Settled desktop window-recorded | PASS | [docs/qa/settled-1440-window-recorded.png](qa/settled-1440-window-recorded.png). {"viewport":1440,"scroll":1440}; current static room or recorded pilot, no active run. | static room or recorded pilot visual retake |
| Settled desktop papers-recorded | PASS | [docs/qa/settled-1440-papers-recorded.png](qa/settled-1440-papers-recorded.png). {"viewport":1440,"scroll":1440}; current static room or recorded pilot, no active run. | static room or recorded pilot visual retake |
| Settled desktop outside-recorded | PASS | [docs/qa/settled-1440-outside-recorded.png](qa/settled-1440-outside-recorded.png). {"viewport":1440,"scroll":1440}; current static room or recorded pilot, no active run. | static room or recorded pilot visual retake |
| Desktop retakes create no run | PASS | See phase JSON. No POST /api/runs request occurred. | static room or recorded pilot visual retake |
| portrait-390 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| portrait-390 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 0 recorded HTTP failures. | real integration |
| settled-1440 request privacy | PASS | See phase JSON. 0 identity/credential URLs; 0 external requests. | real integration |
| settled-1440 browser console | PASS | See phase JSON. 0 runtime exceptions; 0 unexpected console errors; 0 recorded HTTP failures. | real integration |
