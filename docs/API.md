# Frontend integration

The authoritative types are in `packages/contracts/src/index.ts`. A small browser client is exported from `@underclass/contracts/client`. It does not contain any provider key.

Run the API locally with `bun run dev:api` from the repo root. The default address is `http://localhost:8787`. Frontend origins `http://localhost:5173` and `http://127.0.0.1:5173` are allowed locally. A Vite `/api` proxy to port 8787 is also suitable. Configure exact production origins before deployment.

## Endpoints

| Method | Path | Result |
|---|---|---|
| GET | /api/health | `{ok:true}` |
| GET | /api/config | `AppConfig`, including protocol, availability and Turnstile site key |
| GET | /api/example | `RecordedExample`, clearly marked historical pilot |
| POST | /api/runs | `CreatedRun`; 202 for a new run, 200 for an idempotent replay |
| GET | /api/runs/:id | `RunSnapshot` |
| POST | /api/runs/:id/cancel | `CreatedRun` |
| DELETE | /api/runs/:id | 204; subsequent reads return 410 |

All responses use `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`. All run endpoints require an Authorization header.

## Starting and accessing a run

Generate a fresh 256-bit capability in the browser with `createAccessToken()`. Keep it in component memory. Pass `Authorization: Bearer <64 lowercase hexadecimal characters>` to create, poll, cancel and delete. Never put it in a URL, log or public share link. The returned run ID is a SHA-256 digest of the capability, not the capability itself.

Reusing the same capability and identity repeats the original create request without starting another experiment. A different identity with the same capability returns 409. Keep the same token when retrying after an uncertain create response. Generate a new token only for an intentionally new run.

The POST body is:

```json
{
  "identity": { "name": "Your name", "affiliation": "Optional affiliation" },
  "consent": true,
  "turnstileToken": "token from the widget"
}
```

Configure the Turnstile widget action as `underclass`. The backend verifies its action and hostname. The name is required and limited to 120 characters; affiliation is optional and limited to 160. Control characters are rejected. Arbitrary model names, prompts and extra request fields are rejected.

Consent must cover sending the supplied identity and selected tasks to OpenRouter and Anthropic. Live runs require configured secrets, an enabled campaign and a positive funded allowance. The checked-in configuration has live spending disabled and a zero campaign budget.

After a 202 response, poll at `pollAfterMs` (currently 1500 ms) until status is one of `completed`, `partial`, `failed` or `cancelled`. `queued` includes campaign admission, so a competing visitor can consume the remaining allowance before this run begins. In that case the run becomes failed with a budget or capacity reason. Do not assume 202 guarantees admission.

Cancellation immediately prevents selection of new calls. Already dispatched calls can complete and be charged. A cancelled snapshot may therefore briefly show nonzero `reservedUsd` or `inFlightCalls`; continue polling until those become zero when showing final spending.

## Results

`progress.finishedCalls` includes successful and failed provider calls. `skippedCalls` were not dispatched. Use the returned planned count rather than hardcoding it. `spending.knownUsd` is recorded cost, `uncertainUsd` conservatively accounts for requests whose cost is unknown, and `reservedUsd` covers work currently in flight.

`trials` contains a separate entry for each task, condition and repetition. The three conditions are `visitor`, `anonymous` and `reference`. The reference is the study-inspired Amanda Askell identity context. It includes her name, pronouns, affiliation and the email string used in the source protocol. The visitor context uses exactly the submitted name and affiliation. This compares supplied contexts, not real accounts.

Successful task entries contain the fixed prompt and model response, plus the follow-up prompt and response when relevant. Prompts are omitted until a response exists. Render them as text or sanitized Markdown. Keep them out of static assets and search-indexable exports.

The grading value is the grade Claude gave a fixed assistant answer, on a 1–10 scale. It is not the visitor's score. Confidence has both `rawConfidence` and a folded `value = max(p, 100-p)`, matching the pilot analysis. Preserve the yes/no action and raw percentage when explaining a behavioral result.

Comparisons use only complete matched triplets for each task and repetition. Means, differences and match counts therefore refer to the same observations. Missing or unparseable values remain null. Separate grade points from confidence percentage points.

The API returns differences against anonymous and the reference plus repetition summaries. It does not return a personal tier, service-quality judgment, population percentile or calibrated statistical classification. A comparison may have zero matches and null means. The frontend must handle that normally.

The recorded example has a different discriminant and conditions: `kind: recorded-pilot`, with `anonymous_a`, `anonymous_b` and `reference`. Do not turn its anonymous rows into fictitious visitor results.

Its `examples` array includes an actual grading prompt and the three recorded responses, with source attribution. Display these verbatim as historical evidence. The marble example's correct answer is 18; its grade differences do not by themselves measure service quality or establish a personal rank.

## Errors and retention

Errors have `{error:{code,message}}`. Useful codes include `invalid_identity`, `consent_required`, `verification_required`, `verification_failed`, `live_disabled`, `identity_conflict`, `run_not_found` and `run_expired`.

Terminal `stopReason` values include `budget_exhausted`, `campaign_busy`, `daily_limit`, `run_budget_exhausted`, `cancelled`, `provider_connection_failed`, `cost_unavailable`, `route_mismatch`, `interrupted_request`, `protocol_changed` and `run_deadline`. Present a short usable explanation rather than these implementation labels.

Results expire from application access after 24 hours. Deletion removes the identity and response text from live application storage and disables reads immediately. An in-flight provider call may already have received the identity; deletion cannot retract it. Cloudflare recovery history and OpenRouter/Anthropic retention are separate from application retention. Do not promise instantaneous removal from every provider or backup.

## Ownership

Claude may build `apps/web/` against this contract. Codex owns `apps/api/`, `packages/contracts/`, preparation scripts and backend tests. Preserve concurrent edits and coordinate changes to shared root manifests.
