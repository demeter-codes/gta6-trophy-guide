# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/kristinaquinones/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/kristinaquinones/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies: the official list with saved progress, filters, a spoiler setting, a roadmap to the platinum, and a cited guide to every trophy.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The app is static files under `app/` and makes no network request at run time.

## How it works

The app is a small set of static files. `app/js/app.js` owns the hash route, filters, local save,
and view switching; `data.js`, `ui.js`, `roadmap.js`, and `tracker.js` each handle one part of
the screen. Its only runtime fetch is `app/data/trophies.json`; source links open only when
clicked. No external script, font, image, or stylesheet is loaded.

- **Checklist** searches all 55 entries, filters by kind (including missable), grade, group, and
  remaining status, and groups by roadmap stage or grade. A row opens a field note with the
  supplied description, grade, category, count where tracked, original guide text, short steps,
  missability note, and clickable sources.
- **Roadmap** organizes the story chapters, character strands, statewide work, and cleanup into
  nine ordered stages. A stage expands to its entries and earned count. The available trophy
  descriptions do not establish a one-time lockout, so the data does not invent a missable; the
  roadmap says this plainly at each stage.
- **Tracker** breaks progress down by grade, estimates two planning hours per remaining entry,
  counts confirmed missables, and offers JSON export, validated import, reset, and spoiler
  controls. The hour figure is a planning heuristic, not a published playtime claim.
- **Spoiler protection** starts on and covers the name, description, and guide for unearned
  story entries. The spoiler preference is saved with progress; a covered row can still be
  marked earned.

Progress uses the versioned localStorage key `gta6.fieldguide.v1` and the shape
`{"v":1,"earned":{"<id>":<unix seconds>},"spoilers":true}`. `scripts/prepare-data.mjs` enriches
the provided trophy register with the guide's stage, category, count, steps, and source links;
it checks that each original guide is 100 to 150 words before writing the JSON.


---

<sub>Entered on [make.fun](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
