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
  missability note, and clickable sources. The missables filter sorts by the stage where each
  warning applies, rather than by the trophy's cleanup stage.
- **Roadmap** organizes the story chapters, character strands, statewide work, and cleanup into
  nine ordered stages. A stage expands to its entries and earned count; its callouts appear at the
  stage where a one-time window closes. The Chapter 1 meditation is the earliest warning.
- **Tracker** breaks progress down by grade, estimates two planning hours per remaining entry,
  counts flagged missables, and offers JSON export, validated import, reset, and spoiler
  controls. The hour figure is a planning heuristic, not a published playtime claim.
- **Spoiler protection** starts on and covers the name, description, and guide for unearned
  story entries. The spoiler preference is saved with progress; a covered row can still be
  marked earned.

Progress uses the versioned localStorage key `gta6.fieldguide.v1` and the shape
`{"v":1,"earned":{"<id>":<unix seconds>},"spoilers":true}`. `scripts/prepare-data.mjs` enriches
the supplied trophy register with categories, stages, counters, original 100-to-150-word notes,
missable windows, and sources; it verifies each guide's length before writing the JSON. The
missable notes flag six character/stranger strands, two partner actions, two choice-linked
requirements, and Lucia's Chapter 1 meditation. Stage 6 is used as the conservative cutoff for
the strand, partner, and choice entries; the meditation closes when Chapter 1 ends.

Guidance cites the trophy registers at PSNProfiles and Exophase, GTA Base's list and roadmap,
and KeenGamer's roadmap. The Chapter 1 meditation note also links KeenGamer's location guide.
PowerPyx and IGN trophy-guide pages did not load at the attempted URLs, so they are not cited.


---

<sub>Entered on [make.fun](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
