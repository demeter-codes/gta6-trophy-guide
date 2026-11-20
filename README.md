# Leonida Field Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI, set like a printed field
guide: paper background, ink text, one rust accent, serif headings. It is plain HTML, CSS and JavaScript with no
build step and nothing fetched at run time.

## What is in it

- **Checklist**: all 55 trophies with the official name, description and grade. Search, kind filter (including
  "Missable"), grade filter, ordering by roadmap stage or grade, a remaining-only switch and a progress bar. A
  spoiler guard shows unearned story trophies as "Hidden trophy".
- **Roadmap**: nine stages toward the platinum, each with a short brief, its trophies, an earned count and a
  "Missable at this stage" callout where one applies.
- **Tracker**: earned total, planning hours left, missables remaining, breakdowns by grade and stage, JSON export
  and import, and reset.
- **Detail panel**: a guide, numbered steps, the missable warning and links to the sources behind the claims.
- Eleven trophies are flagged missable: the six character strands, the two partnership actions, the two
  choice-driven trophies and the chapter event. Each carries a note on what closes it and what to do first.

## Using it

Serve the `app/` folder and open the page:

```
node serve.ts            # http://localhost:8080
node serve.ts --port 8099
```

Progress is stored in `localStorage` under `leonida-field-guide:v1`. Export writes
`leonida-trophy-progress.json`; import reads it back. Links go straight to a view:

| Hash | Shows |
| --- | --- |
| `#trophy=28` | a trophy's guide beside the checklist |
| `#view=roadmap` (with `&stage=8`) | the roadmap, optionally with a stage open |
| `#view=tracker` | the tracker |
| `&kind=story`, `&grade=gold`, `&spoilers=on` | filters and the spoiler guard |

Keys: `/` focuses search, `n` jumps to the next unearned trophy on the route.

## Data and sources

`app/data/trophies.json` holds the 55 trophies. Names, descriptions and grades are the official ones. Each guide
names where its facts come from: GTABase's trophy list and guide, the KeenGamer platinum roadmap, the official list
on Exophase and the GTAside list. Where those sources are thin, the guide says so and leaves the step until after
the story.

## Checks

`main.ts` validates the data before writing anything: it fails if there are not 55 trophies, or if any has a
blank guide, no https source or an unknown grade. Then it copies `app/` and `screenshots/` to the output folder
and writes `dossier.json`.

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The screenshots in `screenshots/` are real 1280x800 captures of the running app, saved as JPEG.
