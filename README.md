# Leonida Trophy Field Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline companion for planning a Grand Theft Auto VI platinum run. It brings the 55 PlayStation 5 trophies into a working checklist, a missable-aware nine-stage route and a personal progress ledger. [See the make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## Open the guide

```sh
node serve.ts
```

Visit http://localhost:8080. The browser reads the bundled trophy data and the local app files only; source links are external only when you choose to open them.

## What is inside

- **Checklist:** search by name or description, filter by trophy kind or grade, sort by stage or grade, and show only what remains. Select a row to read its guide, steps, missable note and citations.
- **Roadmap:** nine stages ordered around the story windows first and the longer cleanup later. Each stage can be opened or folded independently and shows an earned count and any open missable warnings.
- **Tracker:** overall progress, planning hours left, a missables list and breakdowns by grade and stage. Export a JSON backup, import it on another browser, or reset the local list.
- **Spoiler control:** hide unearned hidden story trophies until they are earned or spoilers are switched off.
- **Quick navigation:** press `/` to focus search or `N` to open the next unearned trophy. Use `#trophy=<id>`, `#view=roadmap` or `#view=tracker` for direct links.
- **Print:** use the browser's print command for a paper-friendly view of the guide.

The guide preserves progress in `localStorage` under `gta6-trophy-guide:v1`. No account or network connection is needed to track trophies.

## Trophy data and citations

The JSON file carries the official names, descriptions and grades, along with a hand-written guide, two to four steps, a stage, and sources for each entry. The citations include Exophase and GTAside for list details, GTABase for trophy guidance, and KeenGamer for the platinum roadmap. Eleven trophies are marked missable; the warning explains the chapter, strand, partnership or choice that can close each window. There are no trophies tagged online.

`main.ts` checks that all 55 trophies have a non-blank guide, a usable source and a recognized grade, and that the vendored make.fun frontend is present, before it writes the dossier.
