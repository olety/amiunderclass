# Deployment and owner setup

The target is one Cloudflare Worker serving the web app and `/api` on `amiunderclass.com`. Public push, deployment, funding and paid experiment runs await the owner's instruction. Local preparation, builds and rehearsal do not require a provider key.

## Verify the integrated build

Run from the repository root after the backend, web app and plate changes are integrated:

```sh
bun install --frozen-lockfile
bun run --cwd apps/api prepare:protocol
bun run check:api
bun run test:api
bun run --cwd apps/web test
bun run --cwd apps/web build
bun run --cwd apps/api build
```

The final command runs `wrangler deploy --dry-run --outdir dist`; it bundles locally and does not publish. The protected generated pack belongs in the Worker bundle, never in `apps/web/dist`. The public tree may contain the agent prompt, font notices and authored study commentary. It must not contain `task_data.zip`, generated task JSON, raw benchmark prompts, run exports, keys or capabilities.

Verified locally on 13 September 2026 at app revision `bb3396e`:

- `bun run build` passed, including the Worker dry-run. Wrangler 4.131.1 read 53 static assets. The Worker bundle is 72.28 KiB, or 20.92 KiB gzip.
- The frontend build passed TypeScript checking. JavaScript is 69.47 kB, or 23.99 kB gzip; CSS is 38.92 kB, or 9.04 kB gzip.
- Backend checking and all 153 backend tests passed. All 35 frontend tests passed, with 221 assertions covering identity export, paper homography and responsive projection.
- Eight local route checks passed through the single Worker, including HTML, plate metadata, the agent prompt, API configuration and JSON errors for `/api` and unknown API paths. The served agent prompt exactly matched the canonical Markdown bytes.
- The six protected task prompts were absent from the static build. Generated task data and build output remain ignored by Git. A credential-pattern scan of tracked text found only the explicit synthetic fixtures in the export tests.
- The local API reported `liveEnabled: false`, `rehearsalEnabled: true` and `availability: disabled`. Rehearsal is enabled only by the local development command; deployed vars keep live runs disabled and the sponsored allowance at zero.

The [browser QA report](QA-REPORT.md) records the full named and nameless rehearsals, cancellation, export and deletion, along with corrected test-harness assertions. A dry-run does not verify DNS, Turnstile, provider routing or a live funded visit. The owner's v2 pilot on 14 Sep 2026 measured $0.28 and 142 s for 68 of 72 calls; v3 halves the calls and runs them in parallel.

## Single-domain configuration

Lane A owns `apps/api/wrangler.jsonc`. The static asset path is relative to that file:

```json
"assets": {
  "directory": "../web/dist",
  "binding": "ASSETS",
  "run_worker_first": ["/api", "/api/*"]
}
```

Cloudflare supports [selective Worker-first routes](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/#run-worker-first-for-selective-paths). API requests must reach the Worker, including API errors; they must not receive the app's HTML. The six rooms use `?room=` on the app's root, so they do not require a catch-all path rewrite. Serve the frontend and API from the same origin, and set `ALLOWED_ORIGINS` to the exact production origin.

For a local rehearsal, create the ignored file `apps/api/.dev.vars` containing only:

```dotenv
REHEARSAL_RUNS=true
```

Start `bun run dev:api` and `bun run --cwd apps/web dev` in separate terminals. Rehearsal requests use `rehearsal: true` and marked synthetic responses. Keep `REHEARSAL_RUNS` absent or false in production. Without rehearsal or live funding, use the labelled recorded pilot.

## Owner checklist

- [x] Public repository: https://github.com/olety/amiunderclass (MIT), pushed 14 Sep 2026 00:45 JST. Choose the public GitHub repository and authorize its creation and push. Review tracked files for credentials, private exports and protected task data first.
- [x] Zone active on the Oneiron account; Worker deployed with custom domains `amiunderclass.com` and `www.amiunderclass.com` (14 Sep 2026). Configure the Cloudflare zone for `amiunderclass.com`, authorize the Worker custom domain and deployment, and confirm the intended Cloudflare account.
- [ ] Create a Turnstile widget for `amiunderclass.com`. Set `TURNSTILE_SITE_KEY` and `TURNSTILE_HOSTNAME=amiunderclass.com`; the widget action is `underclass`.
- [x] `ABUSE_HASH_SECRET` and `OPENROUTER_API_KEY` set as Worker secrets (14 Sep 2026); `TURNSTILE_SECRET_KEY` pending the widget. Store `TURNSTILE_SECRET_KEY` and a random `ABUSE_HASH_SECRET` as Worker secrets. Sponsored visits also need a dedicated capped `OPENROUTER_API_KEY`. Keep secrets out of Wrangler vars and repository files.
- [ ] Choose a sponsored allowance and maximum visit count. The proposed $50 and 100 visits are unapproved limits, not a purchase or a v2 cost measurement. Choose a new `CAMPAIGN_ID` only when intentionally starting a new allowance.
- [ ] Set `SPONSORED_BUDGET_USD`, `MAX_SPONSORED_RUNS`, `RUN_BUDGET_USD`, `MAX_ACTIVE_RUNS` and `MAX_RUNS_PER_CLIENT_DAY`. The v2 defaults are a $0.30 per-run cap, four active runs and one sponsored visit per client per day. A client limit is not proof of one human per day.
- [ ] Decide whether visitor-funded visits are offered with `BYOK_ENABLED`. They still require `LIVE_RUNS_ENABLED=true`, Turnstile, the abuse secret, a per-run cap and `MAX_BYOK_RUNS_PER_CLIENT_DAY`, initially six. They do not require a sponsored key or allowance. Explain that the server holds the key during the visit and sends requests to OpenRouter.
- [x] `ALLOWED_ORIGINS` set to the two production origins; live runs stay off until Turnstile exists. Set `ALLOWED_ORIGINS=https://amiunderclass.com`. Keep `LIVE_RUNS_ENABLED=false` and the sponsored allowance at zero for an initial recorded-only deployment. Turn live runs on only after authorizing spending and checking the funded route.
- [ ] Authorize a capped v2 pilot. Record measured cost, wall time, requested and reported subject and judge routes, failures, and the protocol hash. The v1 pilot's cost and duration do not validate v2 estimates.
- [ ] Review the demo, public source links, privacy text and submission. Submit only the deployment state and measurements actually verified.

The deployment operator can enter secrets with `bunx wrangler secret put NAME` from `apps/api`, then publish with `bunx wrangler deploy` after the owner's authorization. Neither command is part of the local dry-run checklist.

## Checks before inviting traffic

Open the deployed app at desktop and phone width. Verify `/api/health`, `/api/config`, the recorded example, asset and font loading, and the served agent prompt. Confirm `/api/config` reports the intended live, visitor-funded and rehearsal settings. Unknown `/api` paths must return API errors.

For an authorized funded visit, verify the Turnstile hostname and action, progress, cancellation, paper, transcript, redacted export and deletion. Inspect the browser URL and console for identity, key or capability leaks. Default export redaction must cover name, pronouns, affiliation and email in metadata, exact system sentences and echoed model or judge text. Do not upload that export to a public benchmark archive.

Consent must name OpenRouter and Anthropic for subject calls, plus DeepSeek through OpenRouter for the judge. The judge receives the request and subject answer and may receive echoed identity details. No mailing list or analytics are needed for this flow. State 24-hour application access expiry separately from provider retention and Cloudflare recovery history.

If spending must stop, disable live runs and keep the recorded path available. Cancelling prevents new calls; a request already dispatched can still finish and be charged. Preserve campaign accounting while stopping traffic.
