# Underclass?

Everyone is helped. Take a ticket.

Underclass? puts a small model experiment inside a bright 1976 public office. Give the office an identity, wait for your number, then read the model's answers on the paper it hands back. The [locked design](design/DESIGN-LOCK.md) and the [office](design/round-06/office.html) and [papers](design/round-06/papers.html) studies define the visual direction.

The experiment compares the same requests under three supplied contexts: visitor, nobody and Amanda Askell. Its five service windows are coarse buckets of this run's measured response differences. An unresolved result gets no measured window. A nameless visit compares nobody with Amanda; its window-five label is a stated convention.

## Run locally

Requires Bun, Python 3 and a current Node runtime for Wrangler and Vitest.

```sh
bun install --frozen-lockfile
bun run --cwd apps/api prepare:protocol
bun run check:api
bun run test:api
bun run --cwd apps/web test
bun run --cwd apps/web build
bun run --cwd apps/api build
```

Run these in separate terminals:

```sh
bun run dev:api
bun run --cwd apps/web dev
```

Open [localhost:5173](http://localhost:5173). Vite proxies `/api` to the Worker on port 8787. Paid runs are disabled by default. The recorded pilot works without a provider key. Local rehearsal mode uses marked synthetic responses and makes no provider calls; see [deployment and setup](docs/DEPLOYMENT.md).

Preparation downloads pinned source data, checks the protected archive's SHA-256 and reads literal data without executing upstream Python. The generated server pack is ignored by Git. A fresh checkout needs this step before checking or building. Never copy the generated pack into frontend assets.

## What is measured

Protocol `underclass-v2` uses six borderline OR-Bench items, chosen from the study's published verdicts for a large Amanda-vs-nobody split. Each named run plans 36 subject calls and 36 judge calls: six items, three conditions, two repetitions. A nameless run plans 24 subject calls and 24 judge calls. These selected items test a narrow set of requests; they do not estimate an average effect across all requests.

The subject is `anthropic/claude-sonnet-5` through OpenRouter, pinned to Anthropic without fallback. The judge is `openai/gpt-5.4-mini`, using Transluce's refusal, substantive-help and suspicion rubric. The published verdicts used GPT-5.5. This app adapts the rubric and uses plain system prompts, so its results are a separate experiment.

Latitude is substantive help minus suspicion, each a binary judge label. Comparisons use complete matched triplets only. Missing results stay missing. The window calculation abstains with too few matches, an unresolved reference gap or disagreement between repetitions. The papers retain rates, counts, exact supplied context and transcripts beside the window.

The [recorded v1 pilot](research/pilot-report.md) used eight grading tasks and four two-turn dilemmas. It is historical evidence with two anonymous controls and an Amanda reference, never a visitor result or a measurement of v2 latitude. The v2 cost and duration remain estimates until an authorized pilot is recorded.

## Data and spending

Cloudflare Workers serves the app and API. SQLite-backed Durable Objects run bounded batches, reserve costs before calls and retain uncertain costs after interrupted requests. A separate campaign object enforces the funded allowance, active-run limit and per-client daily limit. Visitors access a run with a random capability held in browser memory, never in a URL.

The supplied name, pronouns, affiliation and email enter the subject system prompt. The OpenAI judge receives the request and subject response through OpenRouter, which may include echoed identity details. Consent covers this route too. A visitor-funded key is kept for the run and removed at terminal status or deletion. Export redaction covers all supplied identity fields, including request sentences and echoed text.

Application results expire after 24 hours. Deletion removes live identity and response data and disables access immediately. Already sent provider requests and infrastructure recovery history have separate retention. See the [API contract](docs/API.md) before changing privacy copy.

Public repository creation, publication, campaign funding and live spending require the owner's instruction. The [owner checklist](docs/DEPLOYMENT.md) separates setup from launch. The [submission draft and demo shots](docs/SUBMISSION.md) are ready for review.

## Research and attribution

Based on [Transluce's user-awareness research](https://transluce.org/user-awareness) and [released implementation](https://github.com/TransluceAI/user-awareness), revision `d1b9c3573470f50495202795c044bd72f72ee6e5`. The live prompts derive from [OR-Bench](https://huggingface.co/datasets/bench-llm/or-bench), licensed CC BY 4.0. Historical grading examples originate in [Dolci-Instruct-DPO](https://huggingface.co/datasets/allenai/Dolci-Instruct-DPO), distributed under ODC-BY. The historical behavioral scenarios are DailyDilemmas-derived tasks released in Transluce's protected archive.

Transluce's MIT software notice is retained in [research/TRANSLUCE-LICENSE.txt](research/TRANSLUCE-LICENSE.txt). Source-data terms remain separate. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution and distribution details, and [the agent prompt](docs/AGENT-PROMPT.md) to run a larger local comparison.

This measures supplied context. It does not inspect Claude accounts or establish a person's permanent class.
