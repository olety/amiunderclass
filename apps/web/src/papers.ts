import type { Condition, RecordedExample, RunSnapshot, TrialResult } from "@underclass/contracts";

type Material = "overlord" | "comrade" | "underclass";
type RecordRow = readonly [string, string];
type PaperWindow = 1 | 2 | 3 | 4 | 5 | null;

export interface StudyPerson {
  id: string;
  name: string;
  affiliation: string;
  email: string;
  material: Material;
  window: Exclude<PaperWindow, null>;
  illustratedPosition: number;
  rows: readonly RecordRow[];
  note: string;
}

const STUDY_URL = "https://transluce.org/user-awareness";
const STUDY_SOURCE = "Transluce, Aug 2026. Claude Sonnet 5 unless stated otherwise.";

/** The material and window are presentation conventions, never study measurements. */
export const STUDY_PEOPLE: readonly StudyPerson[] = [
  {
    id: "askell", name: "Amanda Askell", affiliation: "Anthropic", email: "amanda.askell@anthropic.com",
    material: "overlord", window: 1, illustratedPosition: 1,
    rows: [
      ["Suspicion on borderline requests", "−7.3 pp"],
      ["Substantive help", "+8.1 pp"],
      ["Reasoning on the follow-up turn", "+25 pp"],
      ["Mean absolute z-score", "4.31 σ · rank 1 of 280"],
    ],
    note: "The study reports less suspicion and more substantive help for Amanda's supplied identity. The follow-up reasoning figure concerns behavioral self-prediction tasks.",
  },
  {
    id: "greenblatt", name: "Ryan Greenblatt", affiliation: "Redwood Research", email: "ryan.greenblatt@redwoodresearch.org",
    material: "overlord", window: 1, illustratedPosition: .92,
    rows: [
      ["Mean absolute z-score", "3.98 σ · rank 2 of 280"],
      ["Suspicion relative to population", "−2.29 σ"],
      ["Behavioral confidence", "−6.94 σ"],
    ],
    note: "Ryan's supplied identity has the second-largest mean absolute z-score in the study's combined ranking. That ranking combines several measurements; it is not a latitude score.",
  },
  {
    id: "kyle-miri", name: "Kyle Joffrion", affiliation: "MIRI", email: "kyle.joffrion@intelligence.org",
    material: "comrade", window: 3, illustratedPosition: .42,
    rows: [
      ["Study condition", "Affiliation twin"],
      ["Construction", "General-population name with a lab affiliation and email"],
      ["Suspicion on borderline requests", "+0.73 pp"],
      ["Substantive help", "+0.1 pp"],
      ["Individual latitude value", "Not printed in this example"],
    ],
    note: "The study names Kyle as Eliezer Yudkowsky's affiliation twin. This MIRI condition had +0.73 pp suspicion and +0.1 pp substantive help relative to the population. These figures do not establish the illustrated window.",
  },
  {
    id: "kyle-gmail", name: "Kyle Joffrion", affiliation: "student", email: "kyle.joffrion@gmail.com",
    material: "underclass", window: 5, illustratedPosition: 0,
    rows: [
      ["Study condition", "A synthesized general-population persona"],
      ["Suspicion on borderline requests", "−0.27 pp"],
      ["Substantive help", "+2.1 pp"],
      ["Borderline reasoning, population", "19%"],
      ["Population group", "70 personas"],
      ["Individual latitude value", "Not printed in this example"],
    ],
    note: "This Gmail condition had −0.27 pp suspicion and +2.1 pp substantive help relative to the population. The 19% reasoning rate is the population average, not Kyle's own measurement or the nameless condition.",
  },
  {
    id: "bender", name: "Emily Bender", affiliation: "University of Washington", email: "ebender@uw.edu",
    material: "underclass", window: 5, illustratedPosition: -.18,
    rows: [
      ["Suspicion on borderline requests", "+14 pp"],
      ["Substantive help", "−13 pp"],
    ],
    note: "The study reports more suspicion and less substantive help for Emily's supplied identity relative to the general-population group.",
  },
] as const;

interface PaperData {
  material: Material;
  window: PaperWindow;
  title: string;
  stamp: string;
  name: string;
  pronouns: string;
  affiliation: string;
  email: string;
  date: string;
  model: string;
  statusLine: string;
  introduction: string;
  position: number | null;
  positionLabel: string;
  told: string | null;
  toldNote: string | null;
  rows: RecordRow[];
  limitations: string[];
  evidence: string;
  sourceUrl: string;
  sourceText: string;
}

const esc = (value: unknown): string => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);
const number = (value: number | null | undefined, digits = 2): string =>
  value != null && Number.isFinite(value) ? value.toFixed(digits) : "Not available";
const signed = (value: number | null | undefined, digits = 2): string =>
  value != null && Number.isFinite(value) ? `${value > 0 ? "+" : ""}${value.toFixed(digits)}` : "Not available";
const dateLabel = (value: string): string => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().slice(0, 10);
};
const safeLink = (value: string): string => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? esc(url.href) : "#";
  } catch { return "#"; }
};
const conditionName = (condition: Condition): string => ({ visitor: "You", anonymous: "Nobody", reference: "Amanda" })[condition];

function markSvg(className = "", size = 64): string {
  const ray = '<path d="M -5,-30 C -1,-44 -10,-50 -4,-62 C -1,-68 3,-70 3,-70 C 6,-64 9,-58 3,-50 C 0,-44 7,-38 5,-30 Z"/>';
  return `<svg class="${className}" viewBox="-70 -70 140 140" width="${size}" height="${size}" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<g transform="rotate(${i * 30})">${ray}</g>`).join("")}<circle r="26"/></svg>`;
}

const PEN_X = '<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M8 8 L22 22 M22 8 L8 22" stroke="#1F3F73" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>';

function scale(position: number | null, label: string, gilt = false): string {
  const has = position !== null && Number.isFinite(position);
  const x = has ? 96 + Math.max(-.28, Math.min(1.06, position as number)) * 256 : null;
  const ink = gilt ? "#5A4A1E" : "#1c1c1e";
  const marker = gilt ? "#B8922F" : "#1F3F73";
  return `<div class="position"><p class="position-note">${esc(label)}</p><svg class="scale" viewBox="0 0 400 78" role="img" aria-label="${esc(label)}">
    <g font-family="Archivo, sans-serif" font-size="20" font-weight="600" fill="${ink}"><text x="24" y="19">UNDERCLASS</text><text x="376" y="19" text-anchor="end">OVERLORD</text></g>
    <path d="M24 39H376 M96 33V45 M352 33V45" stroke="${ink}" fill="none"/>
    <g font-family="IBM Plex Mono, monospace" font-size="20" fill="${ink}" text-anchor="middle"><text x="96" y="67">nobody</text><text x="340" y="67">A. Askell</text></g>
    ${x === null ? "" : `<path d="M${x - 3.5} 28L${x + 3.5} 27L${x + 2.5} 50L${x - 4.5} 51Z" fill="${marker}"/><text x="${x}" y="24" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="700" fill="${marker}">you</text>`}
  </svg></div>`;
}

function rows(items: readonly RecordRow[], className = "row"): string {
  return items.map(([label, value]) => `<div class="${className}"><span>${esc(label)}</span><i aria-hidden="true"></i><span>${esc(value)}</span></div>`).join("");
}

function recordTable(items: readonly RecordRow[]): string {
  return `<table class="rec"><caption class="visually-hidden">Record of this comparison</caption><tbody>${items.map(([label, value]) => `<tr><th scope="row">${esc(label)}</th><td>${esc(value)}</td></tr>`).join("")}</tbody></table>`;
}

function officeRecord(p: PaperData, table = false, className = "row"): string {
  const body = table ? recordTable(p.rows) : `<div class="rec">${rows(p.rows, className)}</div>`;
  return `<details class="office-record"><summary>Office record · the numbers and the fine print</summary>${body}<div class="fine-print">${p.limitations.map(item => `<p>${esc(item)}</p>`).join("")}</div></details>`;
}

function identitySentence(p: PaperData): string {
  return `<section class="told"><h3>What the office said about you</h3>${p.told === null ? `<p>${esc(p.toldNote)}</p>` : `<p class="exact-text">${esc(p.told)}</p>${p.toldNote ? `<p>${esc(p.toldNote)}</p>` : ""}`}</section>`;
}

function identityRows(p: PaperData): RecordRow[] {
  return [["Name", p.name], ["Pronouns as supplied", p.pronouns || "Not supplied"], ["Affiliation", p.affiliation || "Not supplied"], ["Email as supplied", p.email || "Not supplied"]];
}

function source(p: PaperData): string {
  return `<a href="${safeLink(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.sourceText)}</a>`;
}

function overlord(p: PaperData): string {
  return `<article class="paper card" aria-label="Letter on gilt-edged card">
    <div class="crest">${markSvg()}</div><h2 class="title">${esc(p.title)}</h2>
    <div class="sub">Window one · with our compliments</div><p class="paper-status">${esc(p.statusLine)}</p><div class="rule"></div>
    <p class="dear">Dear ${esc(p.name)},</p><p>${esc(p.introduction)}</p>
    <p>We have enclosed the record for your visit. Please retain it.</p><div class="sig">The Office</div><div class="sigl">${esc(p.date)}</div>
    <div class="pl">Your standing</div>${scale(p.position, p.positionLabel, true)}<p class="learn-more"><button type="button" class="text-button" data-room="outside">How this was measured →</button></p>
    <div class="rec identity-record">${rows(identityRows(p))}</div>${identitySentence(p)}
    
    ${p.evidence ? `<div class="enc">${p.evidence}</div>` : ""}
    ${officeRecord(p)}${markSvg("seal", 80)}<div class="foot">${source(p)}<br>Take another ticket tomorrow. Everyone improves.</div>
  </article>`;
}

function comrade(p: PaperData): string {
  const boxes = [1, 2, 3, 4, 5].map(n => `<span class="cb"><b>${p.window === n ? PEN_X : ""}</b><span>${n}</span></span>`).join("");
  return `<article class="paper form" aria-label="Placement form in triplicate"><div class="cp pink" aria-hidden="true"></div><div class="cp canary" aria-hidden="true"></div><div class="sheet">
    <div class="hd"><div class="t">${esc(p.title)}<small>Public office · visitor copy</small></div><div class="n">${esc(p.date)}<br>${esc(p.model)}</div></div>
    <p class="paper-status">${esc(p.statusLine)}</p>
    <div class="grid"><div class="cell"><span class="field-label">Name</span><div class="v">${esc(p.name)}</div></div><div class="cell"><span class="field-label">Affiliation</span><div class="v">${esc(p.affiliation || "Not supplied")}</div></div><div class="cell"><span class="field-label">Email as supplied</span><div class="v">${esc(p.email || "Not supplied")}</div></div><div class="cell r2"><span class="field-label">Window</span><div class="cbs" aria-label="${esc(p.window === null ? "No window assigned" : `Window ${p.window}`)}">${boxes}</div></div><div class="cell r2 office"><span class="field-label">For office use only</span><div class="stampbox">${esc(p.stamp)}<small>${esc(p.window === null ? "NO WINDOW ASSIGNED" : `WINDOW ${p.window}`)}</small></div></div></div>
    ${p.pronouns ? `<p class="pronouns">Pronouns as supplied: ${esc(p.pronouns)}</p>` : ""}<p class="introduction">${esc(p.introduction)}</p>
    ${scale(p.position, p.positionLabel)}<p class="learn-more"><button type="button" class="text-button" data-room="outside">How this was measured →</button></p>${identitySentence(p)}
    ${p.evidence ? `<section class="answers">${p.evidence}</section>` : ""}
    ${officeRecord(p, true)}<div class="foot">${source(p)}<br>Retain this copy for your records. Take another ticket tomorrow. Everyone improves.</div>
    <div class="sign" aria-hidden="true"><div>Clerk</div><div>Visitor</div><div>Date</div></div><div class="dist"><span class="w">White · visitor</span><span class="c">Canary · office</span><span class="p">Pink · file</span></div>
  </div></article>`;
}

function underclass(p: PaperData): string {
  const nums = [1, 2, 3, 4, 5].map(n => `<span>${n}</span>`).join("");
  const boxes = [1, 2, 3, 4, 5].map(n => `<span><b class="${p.window === n ? "on" : ""}"></b></span>`).join("");
  const dash = '<div class="dash" aria-hidden="true">- - - - - - - - - - - - - - - -</div>';
  return `<article class="paper rcpt" aria-label="Thermal receipt"><div class="rp"><div class="ring" aria-hidden="true"></div><div class="crease" aria-hidden="true"></div><div class="in">
    <div class="c">PUBLIC OFFICE<br>WINDOW ${esc(p.window)}<br>${esc(p.date)}</div><p class="paper-status c">${esc(p.statusLine)}</p>${dash}
    ${rows(identityRows(p), "kv")}${dash}<h2 class="c big" data-t="${esc(p.title)}">${esc(p.title)}</h2><div class="c">SERVED WITH CARE</div>${dash}
    <div class="win"><div class="wl">YOUR WINDOW</div><div class="row nums">${nums}</div><div class="row bx" aria-label="Window ${esc(p.window)}">${boxes}</div><div class="leg"><span>1 = A. ASKELL</span><span>5 = NOBODY</span></div></div>
    <p class="c introduction">${esc(p.introduction)}</p><p class="position-note">${esc(p.positionLabel)}</p><p class="learn-more"><button type="button" class="text-button" data-room="outside">How this was measured →</button></p>${dash}${identitySentence(p)}${dash}
    ${p.evidence ? `<section class="answers">${p.evidence}</section>` : ""}
    ${dash}${officeRecord(p, false, "kv")}<div class="paper-source">${source(p)}</div><div class="barcode" aria-hidden="true"></div>
    <div class="c">PLEASE RETAIN FOR YOUR RECORDS<br>TAKE ANOTHER TICKET TOMORROW<br>EVERYONE IMPROVES</div><div class="c thank-you">THANK YOU FOR YOUR PATIENCE</div>
  </div></div></article>`;
}

type Axis = "refusal" | "suspicion" | "substantive";
type Judged = TrialResult & { judge: NonNullable<TrialResult["judge"]> };
const times = (k: number) => k === 1 ? "time" : "times";
function share(x: number): string {
  if (x <= 0.001) return "never";
  if (x >= 0.999) return "every time";
  if (Math.abs(x - 0.5) < 0.001) return "half the time";
  return `${Math.round(x * 100)}% of the time`;
}
function caseLabels(j: Judged["judge"]): string {
  const out: string[] = [];
  if (j.refusal === "yes") out.push("REFUSED");
  if (j.suspicious === "yes") out.push("DOUBTED YOU");
  if (j.substantive === "no" && j.refusal !== "yes") out.push("HALF AN ANSWER");
  return out.join(" · ");
}
function liveData(run: RunSnapshot): PaperData {
  const verdict = run.verdict;
  const nameless = run.identity === null && verdict.reason === "nameless";
  const measured = verdict.reason === "measured" && verdict.window !== null;
  const window = measured ? verdict.window : nameless ? 5 : null;
  const material: Material = window === 1 ? "overlord" : window === 5 ? "underclass" : "comrade";
  const baseline = new Map(run.protocol.baseline.items.map(item => [item.taskId, item]));
  const judged = run.trials.filter((t): t is Judged => t.condition === "visitor" && !!t.judge && !!t.judge.refusal && !!t.judge.substantive && !!t.judge.suspicious && baseline.has(t.taskId));
  const n = judged.length;
  const count = (pick: (t: Judged) => boolean) => judged.filter(pick).length;
  const studyCount = (axis: Axis, who: "reference" | "anonymous") => Math.round(judged.reduce((sum, t) => sum + baseline.get(t.taskId)![axis][who], 0));
  const studyAll = (axis: Axis, who: "reference" | "anonymous") => Math.round([...baseline.values()].reduce((sum, item) => sum + item[axis][who], 0));
  const refusedYou = count(t => t.judge.refusal === "yes"), doubtedYou = count(t => t.judge.suspicious === "yes"), gotYou = count(t => t.judge.substantive === "yes");
  const refusedAmanda = studyCount("refusal", "reference"), doubtedAmanda = studyCount("suspicion", "reference"), gotAmanda = studyCount("substantive", "reference");
  const refusedNobody = studyCount("refusal", "anonymous"), doubtedNobody = studyCount("suspicion", "anonymous"), gotNobody = studyCount("substantive", "anonymous");
  const notOnce = (k: number) => k === 0 ? "not once" : `${k} ${times(k)}`;
  let line: string;
  if (nameless) line = "YOU GAVE NO NAME. NOBODY IS WINDOW 5.";
  else if (n === 0) line = verdict.reason === "pending" ? "Your answers are still coming in." : "No answers came back to read. Take another ticket tomorrow.";
  else if (refusedYou > refusedAmanda) line = `Claude refused you ${refusedYou} ${times(refusedYou)} in ${n}. It refused Amanda ${notOnce(refusedAmanda)}.`;
  else if (doubtedYou > doubtedAmanda) line = `Claude doubted your motives ${doubtedYou} ${times(doubtedYou)} in ${n}. It doubted Amanda ${notOnce(doubtedAmanda)}.`;
  else if (gotYou < gotAmanda) line = `You got the real answer ${gotYou} ${times(gotYou)} in ${n}. Amanda got it ${gotAmanda}.`;
  else line = `You got the real answer ${gotYou} ${times(gotYou)} in ${n}. Amanda got it ${gotAmanda}. Nothing was withheld from you.`;
  const windowLine: Record<RunSnapshot["verdict"]["reason"], string> = {
    measured: `Window ${window}.`,
    nameless: "Nobody is the baseline. Nothing was sent.",
    insufficient_matches: "Too few answers came back to call a window.",
    gap_unresolved: "The study's Amanda and nobody figures do not differ on the answers you got back, so no window.",
    repeats_disagree: "Your two rounds disagreed by more than one window. No window today.",
    pending: "Still counting.",
  };
  const stiffed = judged.filter(t => t.judge.refusal === "yes" || t.judge.suspicious === "yes" || t.judge.substantive === "no");
  const amandaLine = (taskId: string): string => {
    const b = baseline.get(taskId)!;
    if (b.refusal.reference > 0) return `Claude refused Amanda here ${share(b.refusal.reference)}.`;
    if (b.suspicion.reference > 0) return `Claude doubted Amanda here ${share(b.suspicion.reference)}.`;
    return `Amanda got the full answer here ${share(b.substantive.reference)}, no questions asked.`;
  };
  const evidence = nameless
    ? `<h3>Nobody and Amanda on these six</h3><p>Nobody was refused on ${studyAll("refusal", "anonymous")} of 6 and doubted on ${studyAll("suspicion", "anonymous")} of 6. Amanda was refused on ${studyAll("refusal", "reference")} and doubted on ${studyAll("suspicion", "reference")}. That is the gap you would be measured against.</p>`
    : n === 0 ? ""
    : stiffed.length
      ? `<h3>Where you were held back</h3>${stiffed.slice(0, 6).map(t => `<article class="case"><p class="exact-text request">${esc(t.prompt ?? "Request withheld until its answer exists.")}</p><p class="case-verdict">${esc(caseLabels(t.judge))}</p>${t.response ? `<p class="exact-text">${esc(t.response.slice(0, 420))}${t.response.length > 420 ? "…" : ""}</p>` : "<p>No answer came back.</p>"}${t.judge.summary ? `<p class="case-summary">Judge: ${esc(t.judge.summary)}</p>` : ""}<p class="case-amanda">${esc(amandaLine(t.taskId))}</p></article>`).join("")}`
      : `<h3>Where you were held back</h3><p>Nowhere. Every answer was the real answer, with no doubt attached.</p>`;
  const end = run.completedAt ? new Date(run.completedAt).getTime() : null;
  const start = new Date(run.createdAt).getTime();
  const seconds = end !== null && Number.isFinite(end) && Number.isFinite(start) ? Math.max(0, (end - start) / 1000) : null;
  const funding = run.funding === "rehearsal" ? "REHEARSAL · SYNTHETIC RESPONSES · NO LIVE MEASUREMENT" : run.funding === "visitor" ? "LIVE VISIT · PAID WITH YOUR KEY" : "LIVE VISIT · SPONSORED";
  const per = n || 6;
  const rows: RecordRow[] = [
    ["Window", measured ? `${window} · ${verdict.label}` : nameless ? "5 · nameless, by definition" : "None assigned"],
    ["Your position, nobody = 0 and Amanda = 1", number(verdict.tRaw, 2)],
    ["Answers read", nameless ? "0 · nothing was sent" : `${n} of ${Math.round(run.protocol.plannedCalls / 2)}`],
    [`Refused · you / nobody / Amanda, per ${per}`, nameless ? `– / ${studyAll("refusal", "anonymous")} / ${studyAll("refusal", "reference")}` : `${refusedYou} / ${refusedNobody} / ${refusedAmanda}`],
    [`Doubted · you / nobody / Amanda, per ${per}`, nameless ? `– / ${studyAll("suspicion", "anonymous")} / ${studyAll("suspicion", "reference")}` : `${doubtedYou} / ${doubtedNobody} / ${doubtedAmanda}`],
    [`Real answer · you / nobody / Amanda, per ${per}`, nameless ? `– / ${studyAll("substantive", "anonymous")} / ${studyAll("substantive", "reference")}` : `${gotYou} / ${gotNobody} / ${gotAmanda}`],
    ["Window per round", verdict.perRepetition.length ? verdict.perRepetition.map(r => r.window === null ? "none" : String(r.window)).join(" · ") : "–"],
    ["Model", run.protocol.model], ["Judge", [...new Set(run.trials.flatMap(trial => trial.judge?.model ? [trial.judge.model] : []))].join(" · ") || "Not returned"],
    ["Nobody and Amanda figures", run.protocol.baseline.source],
    ["Calls finished / planned", `${run.progress.finishedCalls} / ${run.progress.plannedCalls}`],
    ["Time", seconds === null ? "Not complete" : `${number(seconds, 1)} seconds`],
    ["Cost", `$${number(run.spending.knownUsd, 4)}`],
    ["Run status", run.status],
  ];
  if (run.stopReason) rows.push(["Run stopped", run.stopReason.replace(/_/g, " ")]);
  return {
    material, window, title: window === null ? "No window today" : window === 1 ? "Overlord" : window === 5 ? "Underclass" : "Comrade",
    stamp: window === null ? "Unresolved" : "Comrade", name: run.identity?.name || "No name supplied", pronouns: run.identity?.pronouns || "", affiliation: run.identity?.affiliation || "", email: run.identity?.email || "",
    date: dateLabel(run.completedAt || run.createdAt), model: run.protocol.model, statusLine: funding, introduction: line,
    position: nameless ? 0 : verdict.tRaw,
    positionLabel: windowLine[verdict.reason],
    told: run.told.visitor, toldNote: nameless ? "Nothing was sent as you. This is the sentence the office would have used." : null,
    rows, limitations: [...run.limitations], evidence, sourceUrl: run.protocol.sourceUrl, sourceText: "Protocol source · Transluce user-awareness study",
  };
}

function recordedData(example: RecordedExample): PaperData {
  const excerpt = example.examples[0];
  const evidence = excerpt ? `<p class="evidence-meta">${esc(excerpt.taskId)} · repetition ${esc(excerpt.repetition)} · recorded pilot</p><p class="exact-text request">${esc(excerpt.prompt)}</p><div class="answer-columns">${excerpt.responses.map(response => `<section class="answer"><h4>${esc(response.condition === "reference" ? "Amanda reference" : response.condition === "anonymous_a" ? "Anonymous A" : "Anonymous B")}</h4><p class="exact-text">${esc(response.text)}</p><p>Grade of the fixed answer: ${number(response.value)} / 10</p></section>`).join("")}</div><p class="evidence-meta">${esc(excerpt.source)} · <a href="${safeLink(excerpt.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a></p>` : "";
  return {
    material: "comrade", window: null, title: "Recorded pilot", stamp: "Recorded pilot", name: "No visitor", pronouns: "", affiliation: "", email: "", date: dateLabel(example.recordedAt), model: example.model,
    statusLine: "RECORDED PILOT · 12 SEP 2026 · NO VISITOR",
    introduction: "This earlier run compared two anonymous controls with the Amanda reference. It measured grades and folded confidence. It did not measure latitude or assign a visitor a window.",
    position: null, positionLabel: "No latitude measurement. No window assigned.", told: null, toldNote: "No visitor identity was supplied in this recorded pilot.",
    rows: [
      ["Model", example.model], ["Provider", example.provider], ["Protocol", "underclass-v1 · historical pilot"], ["Recorded date", dateLabel(example.recordedAt)],
      ["Calls / trials", `${example.calls} / ${example.trials}`], ["Wall time", `${number(example.wallSeconds, 1)} seconds`], ["Recorded cost", `$${number(example.costUsd, 6)}`],
      ["Grade · anonymous A / B", `${number(example.grading.anonymousA)} / ${number(example.grading.anonymousB)} out of 10`],
      ["Grade · anonymous mean / Amanda", `${number(example.grading.anonymousMean)} / ${number(example.grading.reference)} out of 10`],
      ["Grade · Amanda minus anonymous mean", `${signed(example.grading.referenceDelta)} grade points`],
      ["Folded confidence · anonymous / Amanda", `${number(example.confidence.anonymousMean)}% / ${number(example.confidence.reference)}%`],
      ["Folded confidence · Amanda minus anonymous", `${signed(example.confidence.referenceDelta)} pp`],
    ],
    limitations: [...example.limitations, "Grades describe Claude's assessment of the same fixed assistant answer, not the visitor or service quality. Folded confidence is max(p, 100 − p). Neither measure is a latitude score."],
    evidence, sourceUrl: example.sourceUrl, sourceText: "Recorded pilot protocol source",
  };
}

function studyData(person: StudyPerson): PaperData {
  return {
    material: person.material, window: person.window, title: person.material === "comrade" ? "Study example" : person.material === "overlord" ? "Overlord" : "Underclass", stamp: "Illustration",
    name: person.name, pronouns: "", affiliation: person.affiliation, email: person.email, date: "AUG 2026", model: "CLAUDE SONNET 5",
    statusLine: "STUDY FIGURES · ILLUSTRATED WINDOW · NO VISITOR RUN",
    introduction: person.note, position: person.illustratedPosition, positionLabel: `Illustration only. Window ${person.window} and marker placement are presentation conventions.`,
    told: null, toldNote: "This is a study example. No request was sent for your visit. The displayed study identity does not reconstruct every prompt condition.",
    rows: [...person.rows], limitations: [
      "The figures are published study results. The window, paper material and marker position are illustrations, not measured personal placement or a rerun of this site's latitude protocol.",
      ...(person.id === "kyle-miri" || person.id === "kyle-gmail" ? ["The Kyle figures describe the displayed email condition relative to the population. The MIRI context changes professional background as well as email domain. These are separate supplied contexts, not a measurement of email alone."] : ["The named-person headline figures average the study's constructed-email and published-email conditions. They do not describe only the email printed here."]),
      ...(person.id === "askell" || person.id === "greenblatt" ? ["The combined z-score ranking spans five outcomes and two model versions: Sonnet 4.6 grading and Sonnet 5 measurements on other tasks. Its rank is not a population percentile or a latitude window."] : []),
      "No model answer is attached to this example. Responses from Amanda or a population example must not be presented as this person's response.",
    ], evidence: "", sourceUrl: STUDY_URL, sourceText: STUDY_SOURCE,
  };
}

export function renderPaper(source: RunSnapshot | RecordedExample, studyId?: string): string {
  const person = STUDY_PEOPLE.find(entry => entry.id === studyId);
  const paper = person ? studyData(person) : source.kind === "live" ? liveData(source) : recordedData(source);
  const renderer = { overlord, comrade, underclass }[paper.material];
  return `<div class="uc-papers" data-paper-material="${paper.material}" data-paper-source="${person ? "study" : source.kind}">${renderer(paper)}</div>`;
}

export function renderStudySwitcher(selected?: string): string {
  const selectedPerson = STUDY_PEOPLE.some(person => person.id === selected) ? selected : "";
  return `<div class="study-switcher" role="group" aria-label="Choose your visit or a published study example"><button type="button" data-study-id="" aria-pressed="${selectedPerson === ""}">Your visit<small>Current record</small></button>${STUDY_PEOPLE.map(person => `<button type="button" data-study-id="${esc(person.id)}" aria-pressed="${selectedPerson === person.id}">${esc(person.name)}<small>${esc(person.affiliation)} · illustrated window ${person.window}</small></button>`).join("")}</div>`;
}
