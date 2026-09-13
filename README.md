# Underclass?

An exploratory comparison of how Claude responds to an ordinary visitor, an anonymous context and an insider reference. The visual premise is a cheerful future with unequal treatment beneath the welcome.

The owner currently prefers the risograph study in [design/round-03/02.png](design/round-03/02.png). The [Claude frontend brief](design/CLAUDE-FRONTEND-BRIEF.md) describes the intended experience. The frontend is a separate workstream.

## Local backend

Requires Bun, Python 3 and a current Node runtime for Wrangler/Vitest.

```sh
bun install
bun run --cwd apps/api prepare:protocol
bun run check:api
bun run test:api
bun run dev:api
```

The API runs at http://localhost:8787. Read [docs/API.md](docs/API.md) for the frontend contract. The default configuration offers the recorded example and disables paid experiments.

The preparation script downloads data from a pinned Transluce revision, reads literal stimulus data without executing upstream code, verifies the task archive checksum and extracts only the selected server pack. The generated pack is gitignored and must not be served as frontend assets. A fresh checkout needs the preparation step before typechecking or building.

## Backend design

Cloudflare Workers handles the API. Each experiment has its own SQLite-backed Durable Object and runs in bounded batches from durable alarms. A separate campaign object atomically reserves the per-run allowance and enforces the campaign limit, active-run limit and daily client limit. The campaign object handles admission/accounting only, not every inference request.

Calls are recorded as in flight before sending to OpenRouter. After an interrupted alarm, an unresolved call is counted conservatively and never replayed. Provider timeouts and missing cost data stop the run while retaining their reservation. Routing is pinned to Sonnet 5 through Anthropic without fallback.

The twelve-task pack and two repetitions produce 72 trials and 96 calls. Grading and confidence are analyzed separately using complete matched triplets. See the [pilot report](research/pilot-report.md) for the measured feasibility result and its limits.

## Enabling a sponsored trial

This has not been deployed or funded. When the owner chooses an allowance:

1. Create a dedicated capped OpenRouter project key, keeping the general account key out of the application.
2. Configure `OPENROUTER_API_KEY`, `TURNSTILE_SECRET_KEY` and `ABUSE_HASH_SECRET` as Worker secrets.
3. Set exact frontend origins, the Turnstile site key and hostname, the campaign allowance and `LIVE_RUNS_ENABLED=true`.
4. Keep a distinct campaign ID when intentionally starting a new allowance. Do not use an ID change to reset a live campaign's bookkeeping accidentally.
5. Deploy and check the real browser/provider path before inviting public traffic.

The current proposal is $50 for up to 100 tests with a $0.50 per-run cap. It is a proposal, not an enabled allowance. Hosting is separate. The earlier pilot used $0.289478 in model calls; backend tests mock every outbound request.

Application results expire after 24 hours. Deleting a run removes live identity/response data and immediately disables access; provider requests and infrastructure recovery history have their own retention. See the API document before writing privacy copy.

## Research and attribution

Based on [Transluce's user-awareness research](https://transluce.org/user-awareness) and [released implementation](https://github.com/TransluceAI/user-awareness), revision `d1b9c3573470f50495202795c044bd72f72ee6e5`. The selected grading examples originate in [Dolci-Instruct-DPO](https://huggingface.co/datasets/allenai/Dolci-Instruct-DPO), distributed under ODC-BY. The behavioral scenarios are the DailyDilemmas-derived agentic tasks released in the protected Transluce archive. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

The experiment measures supplied-context effects. It does not inspect Claude accounts or establish a person's permanent class.
