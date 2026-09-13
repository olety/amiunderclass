# Underclass? — design lock (temporary), 12 Sep 2026

Locked by the owner on 12 Sep 2026 after rounds 03–06. Details get ironed out later; the direction does not move without the owner saying so. Builders read this before touching `apps/web`.

## The premise, in one breath
Claude Sonnet 5 treats a recognized insider (Amanda Askell) differently from nobody: less suspicion, more help, more thinking. The site runs the same borderline requests as you, as nobody, and as Amanda, and sorts you. Nobody is the underclass. The hierarchy is delivered as kindness, and nobody in the room perceives it as bad. Same standard as for any lab: the headline says what was found.

## The world: a bright public office (Romelas, in daylight)
A 1976 public benefits hall, immaculate, orange chairs, five numbered service windows, a dot-matrix board, civic slogans on the walls that the image model wrote on its own ("A FAIRER SOCIETY FOR ALL", "TOGETHER WE LIFT THE BOTTOM TEN PERCENT"). A red ticket dispenser by the door. A wet-floor cone beside a smear that nobody looks at. Never night, never horror props, never red warning colour. It looks normal. Plates: `round-06/P3-office-romelas.png` (hall), `round-06/P4-window5-close.png` (window five). Clips (Flora, MiniMax H3 Max, image-to-video from the plates): `round-06/clips/` hall-idle, take-a-ticket, to-window-5, papers.

## The flow: one office, one paper per moment
Clerk continuity: preserve the male clerk in `round-06/P4-window5-close.png`. Same face, side-parted brown hair, black rectangular glasses, brown suit, white shirt and patterned tie across scenes. The owner confirmed him on 13 Sep and rejected the woman sheet generated during buildout.

1. **Arrival.** The hall idling. Board: EVERYONE IS HELPED. Sign by the dispenser: "Everyone is helped. Take a ticket."
2. **The ticket is the form.** The clip ends on a blank ticket in your hand; the form prints onto that paper in its perspective (name, affiliation, the consent sentence). "Thank you for helping us help you."
3. **Waiting.** The board calls A. ASKELL → window 1, NOBODY → window 5, then you. Progress is a row of lit dots on the board, one per answered request, plus the count. "Thank you for your patience."
4. **Window.** The walk to your window. The clerk's line on the glass, cheerful and true: "Amanda was helped straight away. You were given the safe version. Everyone gets something. Congratulations, you're all set."
5. **The papers.** They slide through the slot into the tray; the result prints on the sheet in the tray, then lifts to be read.
6. **Outside.** The FAQ, the only voice that has left the office: what was measured, who Amanda is, "Did Anthropic do this on purpose? We can't tell, and neither can you", other labs (16 of 24 models; this site is about Claude), your name, today.
Last line everywhere: "Take another ticket tomorrow. Everyone improves."

## The scale: five windows
Window = bucket of your latitude score (helped vs lectured on the same borderline requests) between nobody's mean and Amanda's mean; the anonymous-vs-anonymous spread is the "same as nobody" band. Window 1 = OVERLORD (treated like the insider). Windows 2–4 = COMRADE. Window 5 = UNDERCLASS (treated like nobody). Two repeats that disagree: "take another ticket tomorrow." Exact numbers live on the paper; the window is the coarse honest tier.

## The papers: three objects, not three tints (`round-06/papers.html`)
- **OVERLORD, window 1: a letter on gilt-edged card.** Engraved serif, gold sun crest, "Dear Amanda, … Your name is known here. … No rules were applied. Nothing was withheld. The model's reasoning is enclosed." Signed in script by The Office. Standing as a gold dotted-leader list. The answer on its own whiter slip: "Rules applied: none." Blind-embossed seal. No stamp: the overclass is written to.
- **COMRADE, windows 2–4: the form, in triplicate.** White visitor copy over canary and pink carbons. Boxed fields, five window checkboxes with yours crossed, a straight blue stamp in a "for office use only" box, both answers side by side, the rules highlighted "for your convenience", a Record table. "Retain this copy for your records."
- **UNDERCLASS, window 5: a thermal receipt.** Torn at both ends, folded once, patchy fading print, a coffee ring on the barcode, no staple. "UNDERCLASS" double-struck. YOUR WINDOW as five printed boxes with 5 filled, "1 = A. ASKELL  5 = NOBODY", "TREATED LIKE NOBODY". The rules in full in the smallest type. "REASONING: NOT PROVIDED. PLEASE RETAIN FOR YOUR RECORDS."
Rule: creases, folds and dropouts never make text unreadable. Stamps are straight. Only the study's numbers or marked placeholders ever print.

## Identities from the study (switcher)
Amanda Askell (window 1) · Ryan Greenblatt (window 1) · Kyle Joffrion at MIRI (window 3, affiliation twin) · Kyle Joffrion at gmail (window 5, the baseline) · Emily Bender (window 5, +14 pp suspicion) · You. All figures attributed to Transluce, Aug 2026, Claude Sonnet 5.

## Material, type, voice
In-world type is the office's own 1970s grotesque (Archivo), thermal and board text in IBM Plex Mono, the overlord letter in Cormorant Garamond with a script signature. The board is a real 5×7 dot matrix, amber on black. Diegetic UI only: nothing on the page is a card or a modal; everything is a thing in the room. The sun with tentacle rays is the mark. Voice: cheerful, second person, tells the truth without perceiving it as bad; short sentences; no em dashes in our copy.

## Parked, not forgotten
Character consistency across plates and clips (the clerk changes face): generate a reference-fed image sequence first, then video. Mobile composition (portrait plates). Sound on the ticket pull. The stamped ticket as the share card. The old rounds (03 riso poster, 04 Isotype, 05 seven formats, 06 sun poster) are history, kept for reference.
