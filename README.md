# Leonida Field Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

This repository is an entry in [the GTA 6 trophy guide bounty on make.fun](https://make.fun/bounty/gta6-trophy-guide-01).

Leonida Field Guide is an offline PlayStation 5 reference for the 55 Grand Theft Auto VI trophies.
It combines official medal data with practical stages, sourced notes, a spoiler guard, and browser-local progress.

## Run locally

No package install or network request is required:

```sh
node serve.ts
```

The local preview listens on `127.0.0.1:8080`. Select another loopback port when needed:

```sh
node serve.ts --port 8099
```

## Included

- A 55-row checklist with search, kind, grade, remaining, and stage or grade grouping.
- A detail pane containing official text, guide steps, missable warnings, and references.
- Dedicated missables, nine-stage roadmap, and local tracker views.
- JSON export/import, local save recovery, and keyboard navigation.
- No frameworks, hosted fonts, external artwork, or browser APIs beyond local storage.

## Validation

Build the dossier with Node 22:

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```
