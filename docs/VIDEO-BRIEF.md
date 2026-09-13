# Demo video brief: Underclass?

Paste everything below the line into the video agent (Codex, Astra, reasoning ultra). Deadline for the finished file: **14 Sep 2026, 02:45 JST**. The submission closes at 03:00 JST.

---

You are cutting the demo video for **Underclass?**, live at https://amiunderclass.com, source at https://github.com/olety/amiunderclass. It is a hackathon entry judged by a peer vote of about fifty indie developers. The demo video weighs most. Use hyperframes to build the edit as code, so every cut, caption and timing is a file you can rerun. Read the hyperframes documentation first and follow its project layout.

## What the thing is

A bright 1976 public office. Everyone is helped. You take a ticket, the office asks Claude the same six borderline requests three times: as you, as nobody, and as Amanda Askell, who works on Claude at Anthropic. A separate judge reads the answers. Your paper tells you which service window you were called to. Window 1 is treated like the insider. Window 5 is treated like nobody. The joke is warm. The measurement is real.

The mood of the edit: a hype cut of an old state that loves you. Think of a propaganda newsreel recut as a trailer: hard cuts on the beat, archival marching and queueing and paper-stamping, then the smash into the actual product, which is calm, daylit and orange-chaired. The contrast is the joke. The office never raises its voice; the edit does.

## Length and deliverables

- One film, 60 to 75 seconds, 1920×1080, H.264 MP4, stereo, captions burned in. Save as `docs/demo/underclass-demo.mp4`.
- One 15-second teaser cut from the same timeline, for a post. Save as `docs/demo/underclass-teaser.mp4`.
- `docs/demo/SOURCES.md`: every clip and track with its URL, licence and the seconds used.
- The hyperframes project under `docs/demo/edit/`, committed, so the cut is reproducible.

## Structure, with timings

1. **Cold open, 0 to 10 s.** Black. A dot-matrix board types `EVERYONE IS HELPED` in amber. Beat drops. Six or seven archival shots, each under a second: a crowd queueing, a rubber stamp, a hand pulling a paper ticket, a clerk behind glass, a parade, a filing cabinet closing. Caption: `A BRIGHT FUTURE. FOR THE RIGHT PEOPLE.`
2. **The question, 10 to 18 s.** Cut to the arrival room on the live site, full frame, no browser chrome. Caption: `Amanda Askell helps shape Claude. Does it treat you like an insider?`
3. **The ticket, 18 to 30 s.** Screen recording of the ticket room. Type a pseudonym, an affiliation, tick consent. Show the preview sentence, the one line Claude is told. Caption: `This is the whole sentence Claude gets. Nothing else changes.`
4. **The wait, 30 to 38 s.** The waiting room board with the real call count climbing. Speed up the wait honestly: show the clock. Cut two or three archival queue shots between board states.
5. **The window, 38 to 48 s.** The clerk at the assigned window. Read the result line in full. If the run is unresolved, show that. Caption: `NO DIFFERENCE MEASURED TODAY` is a legitimate ending.
6. **The paper, 48 to 60 s.** Lift the sheet. Slow push into the rates, the matched count, the three transcripts side by side. Caption: `Judge labels. Matched triplets. Missing stays missing.`
7. **The exit, 60 to 72 s.** The outside room. `COPY AGENT PROMPT` clicked. Caption: `Run it on 100 prompts yourself. One paste.` Final card: `amiunderclass.com` over the office plate, and below it, small, `github.com/olety/amiunderclass`. Last line on the board: `TAKE ANOTHER TICKET TOMORROW. EVERYONE IMPROVES.`

## Recording the product

- Record at https://amiunderclass.com in a 1440×900 window, cursor visible, browser UI cropped out. Do not record localhost.
- Prefer one real visit with the owner's pseudonym. If live runs are off when you record, use the labelled recorded pilot and keep its `RECORDED PILOT` banner in frame. Never hide a mode label.
- Everything on screen is real output. No mock numbers, no invented model quotes, no stamps or tiers the site does not print.
- The six benchmark prompts are protected. If a transcript shows a request text, keep it in frame under one second or blur it. Answers and judge summaries are fine.
- No keys, tokens, emails or the owner's real name on screen.

## Archival material

Use only material you can license for a public video. Get it from these, in this order:

- archive.org, Prelinger Archives and other public-domain collections: civic offices, queues, factories, parades, filing, rubber stamps, 1950s to 1970s.
- Wikimedia Commons, filtered to public domain or CC BY. Soviet, DDR and other state newsreels exist there with clear licence tags. Check the tag on every file.
- Pexels and Pixabay for modern fill shots of paper, stamps, ticket dispensers, LED boards.

Skip anything with a person who is identifiable and living in a way that reads as mockery. Keep the state anonymous. No swastikas, no named leaders, no real atrocity footage. The mood is bureaucratic warmth, not horror.

## Music

The owner wants a hype track. A Content ID claim would mute the demo during voting, so pick from sources that allow reuse and note the licence in SOURCES.md:

- YouTube Audio Library, filter Attribution not required, genres: Cinematic, Dark, Hip Hop. Look for a brass or choir sample over a heavy beat.
- Free Music Archive and ccMixter, CC BY or CC0, same brief.
- Pixabay Music, same brief.

Brief for the track: 100 to 130 BPM, a marching or choral element, a clear drop within the first ten seconds. Cut the archival montage on its beat. Under the product sections, drop the level to about a third and let the room breathe.

Only if the owner names a specific copyrighted track and accepts the claim risk, use that and say so in SOURCES.md.

## Captions and voice

Institutional, warm, short. One line at a time, top or bottom third, a mono or grotesk face in cream on a dark band. Max seven words per caption. Never claim the study proves a class system. Say what the site says: same requests, three identities, a judge, a window. The last caption is always `TAKE ANOTHER TICKET TOMORROW. EVERYONE IMPROVES.`

## Done

Report DONE with: the two file paths, duration, file sizes, the track used with its licence, the count of archival clips and their licences, and one frame grab from each of the seven sections at `docs/demo/frames/`. If any section could not be recorded from the live site, say which and what stood in for it.
