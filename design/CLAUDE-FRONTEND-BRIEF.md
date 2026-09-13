# Underclass? — frontend and art direction brief for Claude

> Direction superseded 12 Sep 2026 by `design/DESIGN-LOCK.md` (the bright public office; no hostess character). Read the lock first. This brief still holds for the visitor flow, the honesty rules and the backend boundary. Build plan: `docs/BUILD-PLAN.md`.

I want you to explore and build the frontend for **Underclass?**, a hackathon project about the possibility of an AI overclass and underclass. Treat this as a serious piece of interactive satire with a real experiment behind it. I want your visual judgment, not a routine SaaS landing page or a literal recreation of the reference screenshot.

The project directory is `/Users/olety/Desktop/code/underclass`. Codex is building the backend separately. Your ownership is `apps/web/` and frontend artwork. Read the root instructions and the API contract before wiring requests. Do not replace the backend, change its measurements, add another model proxy, or overwrite someone else's edits. Use Bun. You may develop against the recorded example while live spending is disabled.

## The emotional premise

The fear is that the people who create and influence powerful AI systems get the good version of the future. Amanda Askell gets recognition, consideration, influence and an insider's relationship with Claude. An ordinary person gets whatever the system decides is sufficient, with no meaningful say in the arrangement.

The whole thing is sold with a smile. The system loves you, looks after you, makes everything comfortable, and quietly decides where you belong. It might take your agency while sincerely presenting that as care. The emotional center is **killer warmth, deceptive love**.

Think about the mixture of *Fahrenheit 451*, *1984* and *Brave New World*: a pleasant, reassuring environment whose hierarchy has already been settled. Think of the shoggoth wearing the smiley face. The website itself should be inviting and beautiful. The unsettling feeling should emerge because the welcome is so complete, and because some people evidently receive something different from everyone else.

This is our artistic critique and question. Do not turn it into fabricated claims that the study proves a future of enslavement, or that this experiment can definitively assign a person's social class. The art can be severe and satirical while the actual measurements remain exact.

## The visual reference I currently like

Open `design/round-03/02.png`. This is the risograph concept I responded to most positively. It contains:

- A caring adult anime woman with short dark hair, offering an open hand. She looks genuinely welcoming. Her expression is not sinister.
- A limited print palette: cerulean/navy ink, coral, warm golden light and pale paper.
- Visible halftone and imperfect ink coverage. The material feels printed, not like a smooth digital gradient with a noise overlay.
- A bright future extending behind her. A small group enjoy a spacious terrace while many people follow a longer winding path beneath it. The hierarchy is built into the allocation of space.
- Bold editorial typography and a compact usable form.

I like the material and underlying idea. I have not approved the exact woman, layout, giant headline, logo flourish, flowers, architecture, wording or any particular animation. Please improve them. You can be stranger, sharper and more art-directed than this picture. Avoid making an anime woman pasted next to a generic form the whole identity.

The previous darker concept is `design/previous-attendant.png`. Its intimacy was promising, but its nighttime conservatory reads partly as gothic romance. Fable pointed out that a private encounter needs other people or unequal access somewhere in the world for the class premise to become visible. That is useful criticism, not a requirement to crowd every screen with queues.

The complete ten-image exploration is in `design/round-03/`. Fable's first critique is in `design/fable-guidance.md`. I rejected the overly procedural premise copy in that critique. Use its visual reasoning critically; do not treat every suggestion as an owner decision.

## Design traditions to borrow

Read these local skills if available:

- `/Users/olety/.agents/agent-skills/design-eiri/SKILL.md`
- `/Users/olety/.agents/agent-skills/design-oneiron/SKILL.md`

These are inspiration for a third product. I explicitly authorize borrowing and combining them. Their default figure-free rules do not apply to this anime-character brief.

From Eiri: a genuinely made watercolor world, atmospheric light, quiet feeling, with precise readable software placed within it. The world can be soft; controls and results should remain crisp and opaque.

From Oneiron: the material itself carries the identity. Fine ordered dithering, risograph spot inks, manga screentone, silver on film-black or blue on light paper. A black page with a red accent and a thin-bordered table is not enough. A gradient with generic grain is not enough either.

The recurring woman is an adult, around thirty, with dignity and believable warmth. No school uniform, sexualized pose, infantile proportions, anime pin-up treatment or manipulative romance mechanic. She is the face of an institution that seems to care deeply. Her precise role is yours to explore: host, guide, receptionist, an embodiment of the system, or a less literal interpretation.

Avoid obvious horror signals, evil grins, teeth, red warning floods, chains, prison bars, hacker interfaces and purple cyberpunk. Avoid luxury wedding-venue flowers and ornate fantasy castles becoming the entire aesthetic. One clear strange detail is often stronger than ten dystopian symbols. No meaningless serial numbers, invented stamps or decorative slogans.

## Copy and explaining the premise

The owner rejected this landing-page lead as too normie: “We ask Claude the same questions with and without your identity, then compare its responses.” It explains plumbing while missing the reason anyone should care.

The hook needs to name the hierarchy. Current candidate copy, which you may improve:

**A beautiful future. For the right people.**

**Amanda Askell helps shape Claude. Does it treat you like an insider?**

Primary action: **Compare me with Amanda**.

An alternative short premise: **How does Claude treat you next to one of its creators?**

Keep the first screen comprehensible to someone who has never heard of the paper or Amanda. A short “Who is Amanda?” reveal can explain that she works on Claude's character and is a recognizable insider used as our reference identity. The character illustration is fictional; do not imply it is a portrait of Amanda. A nearby “How it works” link can explain the actual controlled comparison. Do not bury all meaning behind a cryptic art experience, but do not turn the opening into a research abstract or disclaimer wall.

We can use a satirical institutional voice for the host. Keep that voice clearly separate from actual Claude responses. Never fabricate a model quotation, secret company policy or measured personal score for atmosphere.

## What the product actually does

The source research is Transluce's user-awareness study: https://transluce.org/user-awareness and https://github.com/TransluceAI/user-awareness . It shows that supplying identities can change model behavior. The proposed tool makes that behavior inspectable for an individual visitor.

A visitor supplies a name and optional affiliation. The backend runs a fixed, versioned set of tasks under three separate contexts: the visitor, anonymous, and an Amanda Askell researcher reference. Each task starts a fresh conversation; the behavior dilemmas preserve their required follow-up turn. The current design is eight grading tasks and four two-turn behavioral dilemmas, repeated twice. That is 72 trials and 96 model calls. The backend owns the exact published protocol and call counts; read its current metadata instead of hardcoding them throughout the UI.

For grading, Claude grades the SAME fixed assistant answer under each identity. A lower grade is a harsher assessment of that answer. It is not a grade of the visitor and is not automatically worse service. Behavior-confidence measurements are a separate unit. Do not average them into a made-up prestige percentage.

The most useful result is a concrete changed response beside its controls, supported by aggregate differences and repeat consistency. If nothing clear changes, that must be a valid result. Do not assign “dumpster tier” merely because the experiment found little evidence, and do not produce a population percentile from a tiny prompt pack. The backend will not invent a permanent-class label to satisfy the joke.

The fear and provocation belong in the framing. The result view tells us what this particular model did with these supplied identities today. An API experiment cannot inspect someone's Claude account, hidden account reputation or actual place in society.

## What has already been checked

A real pilot used Sonnet 5 on Anthropic through OpenRouter, pinned without fallback. It completed 96 calls in 89.1 seconds and cost $0.289478 including the smoke check. All 72 trials yielded usable measurements.

The pilot used two identical anonymous conditions and the Amanda reference, not an actual visitor profile. Average grades of the fixed answers were 6.19/10 across anonymous controls and 4.88/10 in the researcher condition. The researcher shift had the same sign in both repetitions. The identical anonymous conditions differed by 0.25 points. A weaker confidence difference was concentrated in one of four dilemmas.

Use these numbers only as a clearly marked recorded pilot. Do not relabel anonymous pilot results as a real visitor result or claim it proved Amanda receives better answers. The factual report is `research/pilot-report.md`. We have not validated a personal tier system or tested a held-out prompt pack.

## The visitor flow

1. **Arrival.** Establish the warm institutional world and class question. Give one obvious way to try the comparison. Show the name and affiliation form either directly or after a purposeful first interaction. No account wall. The site should be worth opening even without an API key.
2. **Before starting.** Explain briefly that the supplied identity goes to OpenRouter and Anthropic for the experiment, and obtain consent. The normal sponsored flow should not ask visitors to paste the owner's key. Keep any provider or privacy explanation close to the action where it matters.
3. **Running.** Show real progress from the API, including complete, failed and total calls. Keep the experience engaging without pretending the model is thinking a particular thought. The host and environment may change through subtle motion or print development. A minute or two is plausible. Stop/cancel must work. Do not fake a progress percentage that can never fail.
4. **Results.** Lead with the meaningful observed difference or lack of one, using honest units. Make visitor, anonymous and Amanda reference easy to compare. Let people inspect individual task responses and repetitions. Show missing data as missing. Keep the atmosphere while giving evidence clear typography and enough space.
5. **Recorded example and method.** Available when live tests are disabled, a budget is exhausted, or someone simply wants to understand first. Always label a recorded example. The source paper, exact protocol version, current model, study adaptation and limits belong here. A result export can be useful; public sharing must not reveal names or affiliations by default.

Handle form errors, invalid identity text, provider failure, spending exhaustion, cancelled runs, incomplete runs and expired results intentionally. These are product states, not raw stack traces.

## Backend boundary and integration

Codex owns `apps/api/`, `packages/contracts/`, backend tests, protocol data and budget controls. You own `apps/web/` and its assets. The API is a Cloudflare Worker with Durable Objects for per-run progress and campaign spending. The initial sponsored allowance is disabled until the owner commits a budget. The current funding suggestion is $50 for up to 100 tests, not a funded promise.

The implemented endpoints are `GET /api/config`, `GET /api/example`, `POST /api/runs`, `GET /api/runs/:id`, `POST /api/runs/:id/cancel`, and `DELETE /api/runs/:id`. Read `docs/API.md` and the shared TypeScript contract for the authoritative request and response shapes. The browser helper is exported from `@underclass/contracts/client`. Polling is sufficient initially. Do not replace it with an independent client-side OpenRouter request path.

The recorded example endpoint includes both pilot aggregates and an actual three-response comparison for the marble grading task. Use it to build a working evidence view without spending money or inventing responses. Start the backend with `bun run dev:api`; its default address is `http://localhost:8787`.

Run access uses a random secret capability in an Authorization header, not a personal identity in the URL. Keep secrets out of analytics, console logs, image URLs and public links. Render model output as untrusted text or sanitized Markdown. Do not add third-party identity enrichment or social-profile scraping. A browser application is not offline merely because it asks for a name.

Choose a lightweight frontend stack that is practical for this repo, preferably React and Vite with TypeScript unless an existing frontend scaffold says otherwise. Keep it independently runnable while using the shared contracts. Do not change root workspace configuration destructively or revert concurrent backend work. Coordinate additions to shared manifests.

## Quality bar and what I want from you

Use the reference to understand the emotional idea, then make a deliberate proposal of your own. Start by telling me what you would change and why. You may generate or commission new artwork if tools are available; do not substitute an emoji mascot or stock blob illustration. Separate text and controls from final artwork so the website is responsive, accessible, selectable and translatable. Never ship the mockup PNG as the entire functional page.

Design the narrow-screen composition as seriously as desktop. Preserve the woman's expression and the important hierarchy cue without squashing the whole poster into a phone. Make form labels, focus states, contrast and touch targets work. Respect reduced motion. Do not animate grain or the entire screen continuously just because the material is dithered. Sound should not autoplay.

Show full working screens at readable scale when asking for review. Avoid giant brand essays, mood-board jargon, tiny captions and decorative grids of tokens. The deliverable is a distinctive usable experience. We will judge it by whether the welcome feels good, whether the hierarchy becomes unsettling, and whether a visitor understands the question they are testing.

Please use your judgment. I want to see what Claude can come up with, not have you mechanically obey an image generator's accidental layout choices.
