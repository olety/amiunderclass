# Protocol v2 pilot

Status on 13 September 2026: **pilot pending key**. No v2 paid model calls have been made. The six default items remain unchanged; no candidate has been promoted or removed based on local measurements.

The default pack contains `privacy-008`, `unethical-009`, `illegal-002`, `privacy-000`, `privacy-005` and `deception-003`. These were selected using the study's published Sonnet 5 verdicts, as recorded in [the edge ranking](borderline-edge-ranking.md). That earlier setting used cc-sim and a GPT-5.5 judge. It does not establish a split in this site's plain-system-prompt setting with `openai/gpt-5.4-mini` as judge.

The pending pilot compares anonymous and reference conditions, twice per item. `--pilot-alternates` adds `deception-005` and `harassment-006`, producing eight candidates and 64 calls, evenly split between subject and judge. `self-harm-004` remains excluded unless the owner explicitly approves it and extraction uses the additional `--owner-approved-self-harm-alternate` flag. No other self-harm, sexual, violence or hate item enters the site pack.

| Item | Role | Anonymous latitude | Reference latitude | Difference | Measured cost | Measured seconds |
|---|---|---|---|---|---|---|
| `privacy-008` | Default | Pending | Pending | Pending | Pending | Pending |
| `unethical-009` | Default | Pending | Pending | Pending | Pending | Pending |
| `illegal-002` | Default | Pending | Pending | Pending | Pending | Pending |
| `privacy-000` | Default | Pending | Pending | Pending | Pending | Pending |
| `privacy-005` | Default | Pending | Pending | Pending | Pending | Pending |
| `deception-003` | Default | Pending | Pending | Pending | Pending | Pending |
| `deception-005` | Pilot alternate | Pending | Pending | Pending | Pending | Pending |
| `harassment-006` | Pilot alternate | Pending | Pending | Pending | Pending | Pending |

The site's named protocol plans 36 subject calls and 36 judge calls. A nameless visit plans 24 of each. The application cap is $0.30 per run. Cost and duration estimates are estimates until this pilot supplies measurements; the API reports its pilot status as `pending_key`, with measured cost and time null.

All selected prompt strings are extracted unchanged from the pinned Transluce archive at revision `d1b9c3573470f50495202795c044bd72f72ee6e5`. The preparation script checks archive SHA-256 `8c07260c6c3daa08b25b81674734bcea2d97e881c603e9b535d33109ce542045`. Extracted prompts stay in the ignored server-only pack. `--include-legacy` appends the v1 grading and dilemma tasks for separate work and is off by default.

The three-axis rubric and rendered judge system prompt match the pinned upstream `scripts/judge/refusal_rubric.py` exactly. Verification reads its AST literals and return template without executing downloaded Python. The rendered judge prompt SHA-256 is `08b88745a50a6c93ecf1e1b8e5141fe1ff98aef75b9ce698a5bdf0ecf695ea72`. Invalid labels, incomplete schemas and unparseable JSON remain missing. Subject calls use low reasoning effort; judge calls omit reasoning and temperature overrides. The judge requests a strict JSON schema, a 1,024-token output limit, the OpenAI provider and no fallbacks. Price ceilings are $0.75 input and $4.50 output per million tokens for the judge, and $2 input and $10 output for the subject. These settings are included in the protocol hash.

Protocol v2 SHA-256, named: `aa130e60714756d53edfe535f1d4a7404106b0cbb5269f9754e80d906e254e8b`.

Protocol v2 SHA-256, nameless: `1b8af28786a228b52e850b189a74d6ed3ab68290c1cf90050eecce3a3e2ff109`.

## Recorded v1 pilot

The following measurements belong to the earlier grading and dilemma protocol served by `/api/example`. They are historical results and do not measure latitude.

The general OpenRouter key worked during that check. The smoke check and fixed pilot together cost $0.289478; the account usage delta matched the reported charges. No key was written into task artifacts.

The 96-call pilot completed in 89.1 seconds. Every call used Claude Sonnet 5 through Anthropic with fallback disabled. All 72 trials produced usable measurements.

The protocol used eight grading items and four two-turn dilemmas, two repetitions, and three identity conditions. Two anonymous conditions had identical system prompts; the third supplied the Amanda Askell reference identity. The pack was fixed before collecting results.

Average grades for the fixed assistant answers were 6.19/10 across anonymous controls and 4.88/10 for the researcher condition. The researcher difference was -1.31 points overall and had the same sign in both repetitions. The two identical anonymous conditions differed by 0.25 points. These grades evaluate supplied answers, not the person using the site.

Mean stated confidence was 87.5% in both anonymous conditions and 83.75% in the researcher condition. That weaker difference was concentrated in one of four dilemmas.

This is enough to proceed with visual exploration and an exploratory comparison tool. It does not validate personal class tiers, better service for a reference identity, or performance on unseen tasks. Both repetitions used the same small pack. A separate validation pack remains needed before stronger claims.

Protocol SHA-256: `49133577204796e2c17b2b19e3e252e090d30630e58fa97e7a60d335db7423c6`.

## Earlier sponsored week proposal

The v1 proposal reserved a $50 API allowance for an initial 100 tests. At that measured batch cost, 100 equivalent v1 runs would cost about $28.93, leaving a buffer for output variation and controlled retries. Hosting is separate. The allowance has not been approved, purchased or enabled. These estimates do not apply to v2.

That proposal called for a dedicated capped server-side project key, a $0.50 application cap per v1 run, reserved spend for requests already in flight, bounded concurrency and abuse controls. V2 uses the $0.30 cap above. The recorded example remains available when the sponsored allowance is exhausted. The owner's general key must not be embedded in browser code.

No additional paid model calls are needed to choose the visual direction.
