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

Three views, one page, no router library. The hash is the route, so any state can be opened
directly: `#view=roadmap`, `#view=tracker`, `#trophy=3`, `#kind=collectibles`, `#q=bank vault`,
`#spoilers=off`.

- **Checklist** groups all 55 trophies by roadmap stage or by grade, with sticky headers and a
  count on each. Six filters (search, kind, grade, group, remaining-only) narrow the list. Any
  row opens a detail panel beside it: the official name, description and grade, the sources
  the guide is built on, the guide itself, and a step-by-step.
- **Roadmap** is the nine-stage plan to the platinum, with the Chapter 1 missable called out at
  the stage where it can be lost and a next-up card naming the first unearned trophy in order.
- **Tracker** shows per-grade and per-kind bars, an hours-left estimate scaled from the 200
  hours GTA Base and KeenGamer both give, the missables you have not earned, and export,
  import and reset for the save.
- **Spoiler mode** hides the name, description, chapter and guide of the 28 trophies that give
  the story away until you tick them, and the switch persists.

Progress lives in one versioned localStorage key, `gta6.fieldguide.v1`:
`{"v":1,"earned":{"<id>":<unix seconds>},"spoilers":true}`. Export writes that object to a file;
import validates it and says plainly when a file is not one of ours.

The code is five small ES modules: `app/js/data.js` loads and indexes the trophy file,
`ui.js` draws the checklist and the panel, `roadmap.js` and `tracker.js` draw their views, and
`app.js` owns the save, the hash route and the filters.


---

<sub>Entered on [make.fun](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
