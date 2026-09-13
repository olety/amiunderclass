# Underclass? art direction critique and brief

## 1. The conservatory concept: what lands, what misses

**What works.** The material is right. Warm silver on film-black, fine ordered dither, screentone in the sweater knit. It reads as made, not filtered. The gesture is the best decision in the image: an open palm turned up, asking for your hand rather than shaking it. That is the whole thesis in one pose. "It's lovely to know you." carries two meanings without winking. The form is crisp and opaque against a painted world, so the Eiri two-material law is already respected. The single red caret in the name field is the only red on the page, which is exactly how Oneiron says red should behave: live, touch, one instance.

**What misses the brief.** The page is already night. The brief says warmth first, discomfort later, but this composition delivers the discomfort on arrival. Sepia darkness, a solitary figure leaning in, a lantern-lit glasshouse at midnight: that is gothic romance, a visual novel register people recognise and relax into. Nobody fills in this form thinking they are joining something cheerful. The shoggoth wears a smiley face. This wears a mood.

The framing of the woman is also a notch too close to a love interest. Low camera, hair over one eye, close crop, leaning in. Combined with the empty room, it reads as a private date rather than a warm institution. "Underclass" needs other people in the world, even as silhouettes, or the class idea has nothing to bite on.

Smaller problems: the wordmark is tiny and unattached. "Affiliation (optional)" is the actual experimental lever, yet it is styled as an afterthought. "Test my identity" implies validation of the person, when the test is of the model. Lantern density is drifting toward postcard kitsch, which both skill files warn about. Nothing on the page says what actually happens when you press the button.

## 2. Ten treatments, one recurring woman

She is a caring adult, around thirty, plain clothes, calm face, always the host. Vary the material and the room, not her dignity.

1. **Morning conservatory.** Cool-paper cerulean and white, two-ink riso with a peach second colour. Same glasshouse at 9am, blinds up, she is watering plants and glances over with a wave. Uncanny cue: every plant has a small hospital-style wristband with a name on it. Type: humanist sans for everything, a white opaque card for the form, lots of air.

2. **Public-health poster reception.** Mustard, teal, and one red on cream, mid-century institutional riso with visible misregistration. She stands behind a low counter, hand extended. Uncanny cue: the queue behind you is shown as flat silhouettes, already sorted by tag colour. Type: geometric caps headline, tiny serial numbers like "Form 1a" in mono.

3. **Manga chapter opener.** Black screentone on warm off-white, no colour. A full-bleed panel of her opening a door and stepping aside for you. Uncanny cue: one small inset panel where she, alone, writes something in a ledger. Type: hand-lettered title, the form drawn as a speech balloon with a crisp real input inside it.

4. **Watercolour veranda.** Eiri-style gansai wash, wet-on-wet sky, she is small in the frame on a sunny porch pouring tea. Uncanny cue: two cups on the tray, and one is painted in a crisper, harder material than the rest of the scene, as if the instrument leaked into the world. Type: mincho display line, crisp opaque form floating in the luminous centre.

5. **Dusk silver conservatory.** The current image, moved to blue hour with a lamp turned toward the viewer. Uncanny cue: her reflection in the glass behind her is facing a different visitor. Type: keep the serif, move Affiliation to equal weight with Name.

6. **Nursery softness.** Pastel riso, thick ink outlines, pink and mint on cream. She kneels to your eye height like a kind teacher. Uncanny cue: a row of coat hooks along the wall, each labelled, and some are set noticeably higher. Type: rounded sans, big friendly inputs, the button says "Hang up your coat."

7. **Safety card pictograms.** Flat aviation blue and yellow, instruction-leaflet style, figures as pictograms with only her face drawn properly. She demonstrates three steps with arrows. Uncanny cue: the "you" pictogram is drawn in a thinner grey stroke than the named passenger beside it. Type: Helvetica-grade sans, numbered steps that are the actual method.

8. **Faded summer film still.** Dye-shifted CMYK halftone, cicada afternoon, she waits at a train crossing and waves. Uncanny cue: the crossing signal is the only saturated red, and it is the same red as the live caret. Type: small caption type like a photo margin, the form as a paper slip.

9. **Bank window day riso.** Oneiron day mode: white instrument cards over a blue dithered sky. She sits at a counter with a number-ticket dispenser. Uncanny cue: the ticket display shows names, not numbers, and the order is not arrival order. Type: serif for her words, mono for the ticket board.

10. **Kiosk dot-matrix.** Coarse two-tone dither, ATM or ticket-machine register, warm amber on near-black. She is the kiosk's greeting avatar and blinks. Uncanny cue: a sticker on the bezel says "We value every customer" in a cheaper font than the rest of the machine. Type: bitmap system font, four fields, one button.

## 3. Headline, premise, and keeping the truth in view

**Headline:** It's lovely to know you.

**Premise (47 words):** We send Claude the same short tasks twice: once introduced as you, once with no name. Then we compare tone, effort and grades. In a small pilot, one well-known name shifted grades repeatably. That shows names can matter. It does not rank you or predict your future.

**Keeping the method honest without a wall.** Let the material carry the receipts. The result page is two prints side by side, named run and anonymous run, with differences highlighted in the one live colour. Pilot numbers live in a mono receipt strip under the prints rather than in a paragraph.

| Pilot | Value |
|---|---|
| Calls | 96 |
| Cost | $0.289 |
| Wall time | 89 s |

Give her the disclaimer as dialogue. One caption in her voice under the result: "This is what Claude did with your name today. It is not who you are." The satire is that the caring host is the one who tells the truth plainly. Label the name field with what it does: "Shown to Claude in half the runs." Put the Askell finding on the methodology page as a worked example, with the caveat in the same sentence, not in a footer.

## 4. Where to spend the exploration budget

**Build treatments 9 and 5 as one composition.** The Oneiron pipeline already makes day and night from a single scene. Day riso bank window is the welcome. Silver dither dusk is the same room after the results come in. The page itself performs warmth first, discomfort later, as the field develops from day to night while the 96 calls run. That is the strongest single idea in this brief.

**Explore treatment 2** as the alternative if the owner wants more satire and less atmosphere. Optimistic institutional graphic design is the smiley face the owner described, and it is the furthest from the current gothic register.

**Keep 4 as the wildcard** if the Askell finding becomes the centrepiece, since watercolour handles a longer editorial page better than dither does.

**Practical handoff for the frontend build.**

- **Tokens in two modes.** Day: cerulean sky, white opaque cards, slate ink ladder. Night: film-black, warm silver ink, one live red. No CSS gradients anywhere. Never pure white or pure black.
- **Type budget of three.** A serif for her lines and headlines. A plain sans for labels, inputs, body. A mono for receipts, counts, dates, transcript IDs. One register per line.
- **Asset list.** One master scene generated once and dithered twice. Three poses of the woman: greeting, waiting, reading the ledger. Ban archive, drawer, cabinet, and hacker-terminal imagery by name in every prompt.
- **Five states.** Landing, form, running with a progress well that shows call count and cost, result comparison, methodology page with the pilot as a worked example.
- **Material rules.** Field develops on load over about a second. Content sits in carved wells, not hairline boxes. The form is crisp and opaque. Red only on the live caret and the arm state of the submit button.
- **Motion.** Day-to-night crossfade tied to run progress, instant swap under reduced motion.
- **Ship gate.** Run the anti-slop detector and the category-reflex test both skill files reference before calling anything done.