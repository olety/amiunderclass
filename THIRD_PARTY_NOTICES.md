# Third-party material

The task preparation and system-prompt approach are adapted from TransluceAI/user-awareness, pinned to revision `d1b9c3573470f50495202795c044bd72f72ee6e5`.

Source: https://github.com/TransluceAI/user-awareness

Its MIT notice is retained at `research/TRANSLUCE-LICENSE.txt`. This notice applies to the upstream software; it does not replace source-data licenses.

The eight selected grading records come from `DOLCI_STIMULI` in `evals/grading/stimuli.py`. They retain their source identifiers in the locally generated pack. That file selects question/answer records from Allen AI's Dolci-Instruct-DPO dataset, licensed under Open Data Commons Attribution (ODC-BY). Attribute Allen AI and Transluce when displaying or exporting those examples.

Dataset: https://huggingface.co/datasets/allenai/Dolci-Instruct-DPO
License: https://opendatacommons.org/licenses/by/1-0/

The four behavioral items are DailyDilemmas-derived agentic scenarios released by Transluce in `task_data.zip`. The preparation script preserves the archive's distribution pattern rather than committing raw scenario text or the full archive. It extracts only dd_0000, dd_0001, dd_0002 and dd_0009 into ignored backend build data. This distribution choice is not a claim that the source software license covers every upstream dataset.

Generated concept artwork in `design/round-03/` was produced with the built-in image generation tool for this project. The precise prompts are retained beside the images. The fictional character is not a portrait of Amanda Askell.
