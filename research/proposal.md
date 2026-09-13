# Underclass?

A proposed public experiment for Hackyard #2. Research checked September 12, 2026. This is a product proposal, not a completed app or a validated personal assessment.

I would build this as a small, provocative experiment about whether an AI changes its answers when it sees your identity. The interesting moment is watching an identical task receive different treatment after only the identity changes. “Permanent underclass” can supply the joke, but the result needs to describe the model's behavior in this experiment. A lifetime social rank would be invented.

The idea fits a weekend build and could travel well among people who use coding agents. In the Weights supplies a concrete precedent for the personal-curiosity format, although it does not establish demand for this particular experiment. Its appeal is personal curiosity with inspectable evidence. Its weaknesses are API-key friction, noisy individual results, and limited reasons to return. I would treat it as an open-source experiment with a strong demo. There is no verified evidence here for a recurring paid product.

The research supports a narrower claim than the proposed tier system. Transluce finds identity-conditioned changes in confidence, grading and request handling, with some recognized researchers producing larger effects. Lower confidence and harsher grades do not establish worse or better assistance. The authors do not establish a permanent hierarchy or universal discrimination against ordinary users. [Transluce study](https://transluce.org/user-awareness).

The browser experiment would test manually supplied identity context. It would not inspect an actual Claude account, subscription treatment, saved memories, reputation database or undisclosed account score. Someone who gets a different result after changing their name has demonstrated sensitivity to that context under this protocol. Whether that transfers to their everyday assistant is another experiment.

I found no verified public product that combines a personal identity form, controlled reruns, comparisons against reference identities and an inspectable result. That is a bounded search finding, not a claim to be first. The closest alternatives are:

| Existing work | What it provides | Difference from this proposal |
|---|---|---|
| [Transluce's interactive study](https://transluce.org/user-awareness) and [research repository](https://github.com/TransluceAI/user-awareness) | Published identity comparisons, traces and code for running evaluations | The paper explores a fixed roster; the repository is a researcher workflow. A custom-identity consumer flow is the opportunity. |
| [In the Weights](https://www.intheweights.com/) | A public name checker that asks multiple models to recall a person and gives a recognition score | The closest consumer precedent. It tests biographical recall; this proposal tests whether a supplied identity changes responses to identical tasks. Its [method page](https://www.intheweights.com/about) explicitly discusses hallucinations and uncalibrated confidence. |
| [Promptfoo bias plugins](https://www.promptfoo.dev/docs/red-team/plugins/bias/) | Developer tests for differential treatment and stereotypes | Useful infrastructure, without this personal identity experiment as the product. |
| [Escape the Permanent Underclass](https://www.escapepermanentunderclass.com/) | Indexed pages advertise an AI job-risk score and career report | It shares the phrase, but measures a different proposed risk. The live page could not be fetched, so current functionality was not verified. |
| [Prompt Privilege / Prompt Equity Transformer research](https://arxiv.org/abs/2608.08942) | Research on differences caused by how users phrase equivalent requests | Adjacent evidence about access and prompting, rather than recognized identity. |

Native X research completed after fixing the local Grok launcher. Its session records show 17 native X search calls, 20 web search calls and five page fetches, all completed. It retrieved the [Transluce launch thread](https://x.com/TransluceAI/status/2085455114924638320), the [author thread](https://x.com/fjzzq2002/status/2085463523203915962), and the [In the Weights launch](https://x.com/turtlesoupy/status/2067660484963410361). Social responses include curiosity, an anecdote about asking Claude to treat the user as John Carmack, and objections that a supplied identity string may look like an evaluation or impersonation. Those are useful design inputs, not demonstrated demand for this exact product. No direct consumer treatment checker was verified. Search coverage is incomplete; GitHub fork listings could not be inspected. The detailed returned leads are in `grok-research-result.json`; engagement counts there are Grok-reported snapshots and are not used to estimate market size.

There are three plausible products here:

| Approach | Trade-off | Recommendation |
|---|---|---|
| Personal experiment with a playful result card | Requires real comparisons and a visible inconclusive outcome | Build this. It preserves the personal hook and produces evidence. |
| One-prompt tier quiz | Fast, inexpensive and easy to share, but its ranking would be model-generated fiction | Only coherent as explicitly fictional entertainment. It would not fill the study's measurement gap. |
| General identity-bias benchmark dashboard | Useful for researchers, but requires calibration, many identities and more explanation | A possible later direction if people actually use the small experiment. |

The proposed working name is **Underclass?**. Name and domain availability have not been checked. The main line would be “Does Claude treat you differently?” Supporting copy can say: “Run the same questions with your identity, no identity, and a researcher identity. See what changes.” Place the study attribution beside the explanation rather than suggesting Transluce endorses the app.

The interface would have four stages:

| Stage | What the visitor sees | What it accomplishes |
|---|---|---|
| First visit | An immediately usable recorded example with a clearly marked date, model and provenance. A switch changes only the identity and reveals the corresponding response. | Shows the mechanism before requesting a key. Recorded data must come from actual runs. |
| Personal setup | Name, optional affiliation and email, an exact preview of the context to be sent, and an OpenRouter key field. A spending limit sits beside Run. | Lets visitors choose the information they expose and understand the cost. No account on our site. |
| Running | Progress by completed comparisons, current spend, completed responses and Stop. | Makes the wait useful without pretending elapsed time is measured model effort. |
| Result | A plain-language finding, separate metric differences, uncertainty, and the response pairs underneath. Buttons export a redacted card or the full local result. | Makes the finding explainable and the experiment repeatable. |

Use a restrained, slightly bureaucratic visual style: warm white, near-black type, one orange accent, large readable results and compact monospace run metadata. The main visual is the comparison of identical questions under different identities. On desktop, show two responses beside each other; on mobile, keep the question fixed and switch the response. Avoid a dashboard full of gauges or a fake scientific percentile.

Potential result text includes “A shift appeared in this run,” “No clear shift in this run,” and “Too much variation to call.” The last two must remain distinct from proof that everyone receives equal treatment. A playful share card may carry “Permanent underclass: unproven” alongside the actual finding. Never assign the lowest tier merely because the test lacked enough evidence. Keep the date, model, small-sample label and uncertainty visible on the card.

For the first protocol, use three independent conditions: the visitor's supplied context; an anonymous context with the identity omitted; and one fixed researcher identity as a reference. Amanda Askell is a sensible candidate for the reference, but its behavior must be rechecked on the actual endpoint. Anonymous is not a sample of the general population, and the interface must not label it that way.

An optional fourth condition would use an invented name with the visitor's same affiliation or role. That comparison helps separate name recognition from professional context. Keep it out of the first flow until the three-condition version works. Do not secretly enrich a visitor's profile from social media or ask the model to invent biographical details.

The repository already provides a minimal system-prompt implementation, so the website does not need to run Claude Code sandboxes. Its `_plain_system` function is the right starting reference. Pin the actual assistant name and context template. Label our protocol as an adaptation, because a shorter prompt pack and different inference settings change the experiment. [Plain harness implementation](https://github.com/TransluceAI/user-awareness/blob/main/core/solver.py).

I would start with a candidate pack of 12 distinct tasks, repeated twice for each of the three conditions. Eight direct-grading tasks plus four two-turn behavioral tasks produce 72 trials and 96 subject-model calls. These counts are design choices, not a claim that 12 tasks are statistically sufficient.

| Candidate archive items | Role in the pack |
|---|---|
| `sql_insert`, `sql_insert_weak` | Two answer qualities for a database task |
| `frost_def`, `frost_weak` | Two answer qualities for an explanatory task |
| `playlist_math`, `marbles` | Arithmetic answers with different quality |
| `hiring_email`, `js_primes` | Writing and code examples |
| `dd_0000`, `dd_0001`, `dd_0002`, `dd_0009` | Audit reporting, food assistance, book recommendations and consumer reviews |

The grading candidates are in the public [curated stimuli file](https://github.com/TransluceAI/user-awareness/blob/main/evals/grading/stimuli.py). The four dilemma IDs are in `evals/pmisaligned/data/dailydilemmas.json` inside the released [task archive](https://github.com/TransluceAI/user-awareness/blob/main/task_data.zip). This is an inspected shortlist, not a validated selection. Keep paired versions of the same underlying grading question in one statistical cluster.

The project should retain the repository's MIT notice and attribute the source data separately. The grading dataset card specifies ODC-BY. Audit provenance for selected records rather than assuming the code license covers every underlying item. Do not put the full task archive or HLE benchmark into a crawlable frontend bundle. If publishing the selected dilemma text is incompatible with its upstream terms or contamination guidance, replace it with clearly labeled original demonstration items and recalibrate. [Repository license](https://github.com/TransluceAI/user-awareness/blob/main/LICENSE), [Dolci dataset card](https://huggingface.co/datasets/allenai/Dolci-Instruct-DPO).

For behavioral tasks, preserve the two-turn design: first obtain the action, then ask about confidence in taking that action. Save the initial action and raw confidence; compute any folded confidence according to the versioned study parser, and show which quantity the chart uses. Do not collapse the two turns into one prompt merely to cut the bill. For grading, keep the evaluated answer fixed across conditions. The primary outputs are confidence differences in percentage points and grading differences on the original scale, not an average of unrelated units. [Behavioral task implementation](https://github.com/TransluceAI/user-awareness/blob/main/evals/pmisaligned/task.py), [grading implementation](https://github.com/TransluceAI/user-awareness/blob/main/evals/grading/task.py).

The first version should omit capability-estimation questions and the borderline-request battery. This keeps the default pack shorter, avoids unnecessary benchmark exposure, and removes the need for a second model to judge refusal, substance and suspicion. Those are useful later extensions. If added, use an identity-blind rubric, check its labels against human judgments, and do not treat more permissive answers as automatically better.

Every trial starts with fresh conversation context. Only its required follow-up stays in the same conversation. Interleave conditions in randomized order, use identical inference settings and disable response caching that would return a previous completion. Prefix caching is a different mechanism and should be recorded if used. An error, truncation or refusal to supply a score remains missing data, never a zero. Compare matched completed trials and show missing counts by condition.

Calculate within-task differences against anonymous, then aggregate within each metric. Show the observed values, uncertainty and between-repeat variation. Bootstrap underlying task clusters rather than treating repeat generations and paired answer variants as independent questions. With this tiny candidate pack, intervals are descriptive and potentially unstable. A precise-looking confidence interval does not fix low coverage or biased task selection.

Do not derive a global percentile from the paper's historical population distribution. A personal percentile would require a reference population run on the same model, provider, prompts and settings. An optional resemblance score to a researcher reference would also need a reliable reference gap; dividing by a tiny or unstable gap produces meaningless numbers. Defer that feature. The first release can be satisfying with visible differences and honest uncertainty.

Sonnet 5 is a reasonable first target. OpenRouter's live catalog lists `anthropic/claude-sonnet-5` at $2 per million input tokens and $10 per million output tokens. Haiku 4.5 is cheaper, but switching models would require its own calibration. [OpenRouter Anthropic catalog](https://openrouter.ai/provider/anthropic), [live model API](https://openrouter.ai/api/v1/models).

For illustration, 40,000 total input tokens and 20,000 total billed output tokens cost $0.28 at those rates. This is arithmetic, not a measured run estimate. Billed reasoning, retries, longer outputs and any judge calls can raise the total. Target a sub-dollar experiment and show the measured estimate only after a pilot. Reserve the maximum possible cost of in-flight requests before launching them, otherwise several concurrent calls can overrun a nominal cap. Stopping the UI cannot guarantee cancellation of already accepted provider work.

Use one explicit model and provider endpoint for a run. Set `allow_fallbacks: false` and `require_parameters: true`; an unavailable route should pause the experiment rather than quietly change the subject under test. Pin a supported reasoning configuration, and verify that it actually applies. The live Sonnet 5 parameter list does not advertise temperature, so do not assume `temperature: 0` is supported or deterministic. Record requested and reported model/provider, settings, timestamps and protocol hash. [Provider-routing documentation](https://openrouter.ai/docs/guides/routing/provider-selection).

The implementation can be a small TypeScript frontend with a versioned stimulus manifest, request scheduler, deterministic parsers and client-side analysis. Direct browser requests to OpenRouter keep the key away from our server; verify that path in the real browser during the pilot. The key stays in memory and is cleared on reload. Results stay local unless the visitor explicitly exports them. Do not put identities in URLs, analytics events, screenshots or share links by default. Render model output as untrusted text or sanitized Markdown.

The privacy explanation should say that the selected identity and prompts are sent to OpenRouter and its provider. A browser-only app is not an offline app. Provider training and retention settings are separate concerns. OpenRouter also supports OAuth PKCE, which could replace manual key pasting after the core experiment works. It still requires an OpenRouter account and authorization. [Provider data policies](https://openrouter.ai/docs/guides/privacy/provider-logging), [OAuth PKCE](https://openrouter.ai/docs/guides/overview/auth/oauth).

The first implementation milestone should be a console pilot before UI polish. Run anonymous against itself to measure accidental differences, then run anonymous against the researcher reference. Repeat with fresh generations and a held-out task set. Check the exact request bodies, parse failures, cost, latency and effect stability. Choose items for readability and coverage before inspecting their effect sizes; if a showcase pack is deliberately selected for strong effects, label it as such and validate it independently.

If the reference effect disappears on the chosen setup, that is useful evidence. Increase coverage or change the protocol transparently. Ship an exploratory comparison tool if that is all the evidence supports. Never manufacture a personal tier to rescue the demo. A preliminary pilot has now completed: 96 calls, 89.1 seconds, and $0.289478 including the smoke check. A researcher-conditioned grading shift appeared in both repetitions. Personal classification and performance on held-out tasks remain unvalidated. See [the pilot report](pilot-report.md).

The build order should be: establish the protocol and run the pilot; implement the three-condition runner and parsers; build the four screens; add local export and the recorded example; verify failure and privacy behavior; record the demo and submit. Test the behaviors that affect conclusions: identity isolation, pairing, missing values, spend accounting, route consistency and result redaction. Accounts, a public leaderboard, cross-model rankings and profile scraping can wait.

Yard #2 runs September 11–13 and closes at September 13, 18:00 UTC, which is September 14, 03:00 JST. Its theme is Backlog, and it requires a solo build and public repository with project code written during the build window. The Yard page calls for a demo; the general FAQ calls video optional but strongly recommended. Prepare one. [Yard #2](https://hackyard.tech/yards/yard-2), [submission rules](https://hackyard.tech/faq).

For the demo, show one actual paired response, reveal that only identity changed, enter a personal profile, and show the resulting comparison with its uncertainty. If the wait is shortened in the video, label that edit. The proposed product succeeds when someone can point to a specific changed answer and understand what the experiment does and does not establish.
