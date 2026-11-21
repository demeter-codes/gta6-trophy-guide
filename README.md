Leonida Field Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

This repository is an entry in [the GTA 6 trophy guide bounty on make.fun](https://make.fun/bounty/gta6-trophy-guide-01).

Leonida Field Guide is a local PlayStation 5 reference for all 55 Grand Theft Auto VI trophies. It combines the official roster with a nine-stage roadmap, missable warnings, cited guides, and browser-local progress.

## Run locally

No package install or network request is required:

```sh
node serve.ts --port 8080
```

Open `http://127.0.0.1:8080`.

## Features

- Complete 55-trophy checklist with search, grade, kind, remaining, and grouping controls.
- Local progress in browser storage, plus JSON export and import.
- Nine-stage roadmap, eleven missable records, and medal totals.
- Two-pane checklist and guide view with steps and HTTPS sources.
- Spoiler guard, keyboard navigation, and honest empty states.
- No framework, hosted font, external image, API, or runtime network dependency.

## Build

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```
