import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const specifications = [
  ['Named desktop integration', 'named-results.json', '3d96587'],
  ['Recorded papers, accessibility and error states', 'ui-results.json', '3d96587'],
  ['Cancellation and delayed response regression', 'cancel-results.json', '4ff8a71'],
  ['Failed cancellation and retry', 'cancel-retry-results.json', '4ff8a71'],
  ['Final mobile integration and desktop visual retakes', 'nameless-results.json', null],
  ['Window 2 and 4 placards', 'window-results.json', null],
  ['Portrait controls and settled desktop visual retakes', 'portrait-results.json', null],
];
const phases = await Promise.all(specifications.map(async ([name, file, revision]) => ({ name, file, revision, ...JSON.parse(await readFile(resolve(directory, file), 'utf8')) })));
const results = phases.flatMap(phase => phase.results);
const passed = results.filter(result => result.status === 'PASS').length;
const failures = results.filter(result => result.status === 'FAIL');
const correctedResize = phases.find(phase => phase.file === 'portrait-results.json').results.some(result => result.name === 'Portrait paper lift target' && result.status === 'PASS');
const superseded = failures.filter(result => result.name === 'Mobile actual paper hit target' && correctedResize);
const openFailures = failures.filter(result => !superseded.includes(result));
const jst = value => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Tokyo' }).format(new Date(value)) + ' JST';
const cell = value => String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const screenshot = path => path ? `[${path}](qa/${path.split('/').at(-1)})` : 'See phase JSON';
const phaseTable = phases.map(phase => `| ${phase.name} | ${phase.results.filter(result => result.status === 'PASS').length}/${phase.results.length} | ${phase.appRevision || phase.revision || 'See final integration commit'} | ${jst(phase.startedAt)} | [${phase.file}](qa/${phase.file}) |`).join('\n');
const checkTables = phases.map(phase => `### ${phase.name}\n\n| Check | Result | Evidence | Mode |\n| --- | --- | --- | --- |\n${phase.results.map(result => `| ${cell(result.name)} | ${result.status}${superseded.includes(result) ? ', superseded by settled portrait check' : ''} | ${screenshot(result.screenshot)}. ${cell(result.detail)} | ${cell(result.mode)} |`).join('\n')}`).join('\n\n');
const final = phases.find(phase => phase.file === 'nameless-results.json');
const plateRows = phases.filter(phase => ['nameless-results.json', 'portrait-results.json'].includes(phase.file)).flatMap(phase => phase.sessions.flatMap(session => session.plates.map(plate => `| ${cell(session.label)} | ${cell(plate.room)} | ${plate.images.filter(Boolean).map(url => '`' + new URL(url).pathname + '`').join(', ')} |`))).join('\n');
const report = `# Browser QA report

${passed}/${results.length} recorded assertions passed across ${phases.length} phases. ${superseded.length ? superseded.length + ' premature resize assertion is retained as failed and superseded by the settled portrait check.' : ''} ${openFailures.length ? openFailures.length + ' checks remain open.' : 'No functional defect remains open in these checks.'} Named and nameless visits used the real local Worker and Durable Object rehearsal path. Their answers and window placements are synthetic fixtures. No paid model measurement was performed.

Use the [settled desktop arrival](qa/settled-1440-arrival.png), [settled desktop recorded window](qa/settled-1440-window-recorded.png), [portrait arrival](qa/portrait-390-arrival.png) and [portrait paper tray](qa/portrait-390-papers-settled.png) for final visual review. These captures wait for the selected responsive image to decode. Earlier files named final-1440 preserve the first resize capture and are superseded for presentation by settled-1440 files.

| Phase | Pass / total | App revision | Started | Machine-readable evidence |
| --- | --- | --- | --- | --- |
${phaseTable}

The named visit completed 72/72 calls. The final nameless visit completed 48/48. Both recorded $0 known, $0 uncertain and $0 reserved cost. The $0.30 cap is a ceiling, not spending. Every actual create sent rehearsal:true, without a provider key. The script required liveEnabled:false and rehearsalEnabled:true before creating any visit and blocked external browser requests. No provider or Turnstile request was needed.

The browser was headless Chrome ${final.browserVersion || ''} driven through Playwright. The app ran at http://localhost:5173 with its existing proxy to the Worker at port 8787. Desktop viewport was 1440×900; mobile was 390×844. The nameless phase resized the same real rehearsal state for its desktop checks. Later settled desktop and portrait retakes use static rooms and the recorded pilot, with zero create requests. No mocked success was substituted for either complete visit.

Protocol version was underclass-v2. The named/config protocol hash was \`${final.config.protocol.hash}\`. The nameless condition set differs; its condensed receipt did not retain protocol.hash, so no nameless hash is claimed here. Future script receipts retain the snapshot hash explicitly. The named export used the synthetic identity QA 山田 Haruto, pronouns xe/QA, affiliation QA 赤い傘研究所 and email qa-canary@example.invalid. Default export removed all four values and the visitor system sentence. Identity opt-in restored them. No capability or provider credential was saved in these evidence files.

Clipboard content matched the served .md, served .txt and canonical docs/AGENT-PROMPT.md byte for byte. SHA-256 was \`7df6235c57670565c3bf8733a9cef2a2649af3191e587982558779b46e22a242\`, 13,165 bytes.

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
${plateRows}

## Reproduce

Start the app and local Worker separately with live runs disabled and rehearsal enabled. The QA script deliberately starts no server. From the repository root, run:

\`\`\`sh
rtk proxy env PLAYWRIGHT_MODULE=/path/to/playwright node docs/qa/browser-qa.mjs
\`\`\`

Omit PLAYWRIGHT_MODULE when playwright resolves normally. Optional QA_PHASE selects a phase by regular expression; QA_RESULTS chooses its JSON filename; QA_APP_REVISION records the tested app commit; QA_CANONICAL_PROMPT overrides the canonical prompt path. QA_CAPTURE_DESKTOP=1 adds desktop retakes while running the final nameless phase. QA_ORIGIN is restricted to localhost or 127.0.0.1. Run \`rtk proxy node docs/qa/write-report.mjs\` to rebuild this report from the named phase receipts.

## Checks

${checkTables}
`;
await writeFile(resolve(directory, '../QA-REPORT.md'), report);
console.log(`${passed}/${results.length} checks passed; wrote docs/QA-REPORT.md`);
