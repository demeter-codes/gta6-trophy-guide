# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies: the official list with saved progress, filters, a spoiler setting, a roadmap to the platinum, and a cited guide to every trophy.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The app is static files under `app/` and makes no network request at run time.

## How it works

Three plain files plus data: `app/index.html`, `app/style.css`, `app/app.js` (one ES module) and `app/data/trophies.json`. First load is about 9 KB gzip. Nothing is fetched from the network except the local JSON; source links open only when clicked.

- **Checklist**: search, kind (including missable), grade, arrange by stage or grade, remaining only, a progress bar, and a detail panel with the guide, numbered steps, missable warning and sources.
- **Roadmap**: nine stages with a brief, an earned count and a "missable at this stage" callout.
- **Tracker**: earned, planning hours left, missables remaining, per-grade and per-stage tables, JSON export, validated import, reset.
- **Spoilers**: the switch hides unearned hidden story trophies as "Hidden trophy".
- **Storage and links**: `localStorage` key `gta6-trophy-guide:v1`. Deep links: `#trophy=<id>`, `#view=roadmap`, `#view=tracker` (optional `kind`, `grade`, `stage`, `spoilers=on|off`).

## Data and sources

Names, descriptions and grades are as published. 12 trophies are flagged missable, each with a note. Guides are original and cite only pages actually read: GAMES.GG (trophy list, collectibles, time to complete) and the Fextralife GTA 6 wiki (trophy guide, meditation spots). PSNProfiles, Exophase, KeenGamer, GTA Base and PowerPyx could not be fetched, so they are not cited. No trophy is online-only, so that filter is empty. Where no source gives a cut-off, the note says so. Hours are a rough allocation of GAMES.GG's ~200 h estimate.

`main.ts` validates `trophies.json` (55 trophies, non-blank guide, a source, a known grade) before writing the dossier.
