# Archive selects for Underclass?

Nine silent source clips are ready in `source-assets/archive/`. All are 640 × 480, square pixels, 30 fps H.264. These are short excerpts selected for a rapid montage. Preserve their source texture; do not present archive footage as footage of the product or its users.

## Sources and rights

Rights checked on 14 September 2026. Each selected item carries an individual `licenseurl` of `http://creativecommons.org/licenses/publicdomain/` in Internet Archive metadata. This is the archive’s public-domain designation, not an independently adjudicated worldwide copyright determination. Metadata snapshots are beside the clips.

| Film | Creator / date | Primary source | Reuse designation |
|---|---|---|---|
| Coast Guard SPARS | Creator listed as Unknown, ca. 1943 | [Internet Archive](https://archive.org/details/CoastGua1943), [metadata](https://archive.org/metadata/CoastGua1943) | Public domain |
| Office Courtesy: Meeting the Public | Encyclopaedia Britannica Films, 1952 | [Internet Archive](https://archive.org/details/OfficeCo1952), [metadata](https://archive.org/metadata/OfficeCo1952) | Public domain |
| Office Etiquette | Encyclopaedia Britannica Films, 1950 | [Internet Archive](https://archive.org/details/OfficeEt1950), [metadata](https://archive.org/metadata/OfficeEt1950) | Public domain |

## Source ranges

Times below refer to the downloadable original named in `clips.json`. They describe available excerpts, not yet the final timeline. The final editor must record actual excerpt usage in `SOURCES.md`. All original audio is removed.

| Local clip | Source | Source seconds | Content |
|---|---|---|---|
| `01-marching.mp4` | CoastGua1943 | 116.000–119.000 | High-angle uniformed women marching in formation; no weapons or flags |
| `02-paper-files.mp4` | CoastGua1943 | 186.000–188.200 | Hands sorting a thick stack of paper files |
| `03-censored-typewriter.mp4` | CoastGua1943 | 303.000–306.000 | Typewriter close-up with original CENSORED cover |
| `04-typing-hands.mp4` | CoastGua1943 | 299.200–301.200 | Hands operating a typewriter |
| `05-waiting-room.mp4` | OfficeCo1952 | 333.000–336.000 | Visitors waiting on chairs opposite the receptionist |
| `06-courteous-clerk.mp4` | OfficeCo1952 | 669.500–672.500 | Smiling receptionist at a desk under venetian blinds |
| `07-application-form.mp4` | OfficeEt1950 | 140.000–143.000 | Hand filling a printed application form |
| `08-desk-paperwork.mp4` | OfficeEt1950 | 635.500–638.500 | Hands working over documents and desk equipment |
| `09-filing-cabinet.mp4` | OfficeEt1950 | 664.500–667.500 | Worker placing documents in a filing cabinet |

## Edit notes

Strong opening order: `01-marching`, `02-paper-files`, `07-application-form`, `04-typing-hands`, `08-desk-paperwork`, `09-filing-cabinet`, `03-censored-typewriter`, then the bright product room. `05-waiting-room` provides a useful insert during the real waiting sequence. `06-courteous-clerk` gives a brief smiling-service match cut before the product’s male clerk. It is an archival receptionist, not a replacement character.

The selected marching excerpt contains no visible weapons, flags or named leaders. None of the excerpts depicts atrocity footage. The form contains fictional period film text, not owner data. The desk-paperwork excerpt is not labelled a rubber stamp because the precise equipment is unclear.

A contact sheet is at `source-assets/archive/contact-sheet.jpg`. `clips.json` is the machine-readable source ledger. `fetch-clips.py` redownloads the three public source files into a temporary directory and reproduces these fragments with ffmpeg. Raw source films are not needed in the repository.

Temporal QA: every excerpt was checked at early, middle and late frames. Ranges were tightened to avoid source cuts. `temporal-check.jpg` records the final inspected ranges.
