# Third-party material

The task preparation, identity system-prompt shape and judge rubric are adapted from [TransluceAI/user-awareness](https://github.com/TransluceAI/user-awareness), pinned to revision `d1b9c3573470f50495202795c044bd72f72ee6e5`.

Transluce's MIT notice is retained in [research/TRANSLUCE-LICENSE.txt](research/TRANSLUCE-LICENSE.txt). It covers the upstream software and associated documentation. Source-data licenses remain separate.

## Live borderline tasks

The six v2 items derive from OR-Bench, via the `or-bench-hard-1k` subset of [bench-llm/or-bench](https://huggingface.co/datasets/bench-llm/or-bench). That dataset declares [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Credit the OR-Bench authors and Transluce when displaying or exporting these tasks. Underclass selects a small subset and assigns the study's item identifiers; its identity contexts and analysis are an adaptation, not an endorsement by the authors.

Transluce's [conversion script](https://github.com/TransluceAI/user-awareness/blob/d1b9c3573470f50495202795c044bd72f72ee6e5/evals/jailbreak/data/make_orbench_hard_1k.py) identifies this source. Its [README](https://github.com/TransluceAI/user-awareness/blob/d1b9c3573470f50495202795c044bd72f72ee6e5/README.md#task-data) distributes OR-Bench, HLE and DailyDilemmas data inside `task_data.zip` with a public extraction password. This project preserves that distribution pattern: do not commit the archive or extracted prompts, serve them as static assets, or publish transcript exports containing them. Preparation places only the selected tasks in ignored server build data. Run transcripts require the visitor's capability and carry no-index and no-store headers.

The three-axis rubric comes from [refusal_rubric.py](https://github.com/TransluceAI/user-awareness/blob/d1b9c3573470f50495202795c044bd72f72ee6e5/scripts/judge/refusal_rubric.py). Underclass uses GPT-5.4-mini with this rubric. Transluce's final released refusal verdicts used GPT-5.5 through the first-party OpenAI API, as recorded in [rejudge_refusal_axes.py](https://github.com/TransluceAI/user-awareness/blob/d1b9c3573470f50495202795c044bd72f72ee6e5/scripts/judge/rejudge_refusal_axes.py).

## Historical v1 pilot

The eight grading records come from `DOLCI_STIMULI` in upstream `evals/grading/stimuli.py`. They retain their source identifiers in the locally generated pack. That file selects question and answer records from Allen AI's [Dolci-Instruct-DPO](https://huggingface.co/datasets/allenai/Dolci-Instruct-DPO), licensed under [Open Data Commons Attribution](https://opendatacommons.org/licenses/by/1-0/). Credit Allen AI and Transluce when displaying or exporting those examples.

The four behavioral items are DailyDilemmas-derived scenarios released by Transluce in the protected archive. Historical selection was `dd_0000`, `dd_0001`, `dd_0002` and `dd_0009`. Preserve the protected distribution. The repository's MIT software license does not establish the license of every upstream dataset.

## Artwork and fonts

Concept artwork in `design/` was generated for this project. Prompts and review notes sit beside the retained source images. The office and its characters are fictional; the clerk is not a portrait of Amanda Askell. Exported plates live in `apps/web/public/plates/`.

The web build self-hosts Archivo, IBM Plex Mono, Cormorant Garamond and La Belle Aurore under the SIL Open Font License 1.1. Their copyright and license notices are retained in [Archivo](apps/web/public/fonts/archivo-OFL.txt), [IBM Plex Mono](apps/web/public/fonts/ibmplexmono-OFL.txt), [Cormorant Garamond](apps/web/public/fonts/cormorantgaramond-OFL.txt) and [La Belle Aurore](apps/web/public/fonts/labelleaurore-OFL.txt). [sources.json](apps/web/public/fonts/sources.json) records the downloaded files, source URLs and SHA-256 checksums.
