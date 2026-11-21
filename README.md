# Leonida Field Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An entry in [the GTA 6 trophy guide bounty on make.fun](https://make.fun/bounty/gta6-trophy-guide-01).

A complete, offline PlayStation 5 field guide for Grand Theft Auto VI. It tracks all 55 trophies, separates
missables, maps a nine-stage route and keeps saved progress on the player's own device.

## Run it

The app has no build step. Either open `app/index.html` from a static server or run:

```sh
node serve.ts
```

The preview listens only on `127.0.0.1:8080`. Use `node serve.ts --port 8099` for another loopback port.

## Views

- **Checklist** combines search, grade and kind filters, roadmap grouping and a two-pane trophy guide.
- **Missables** lists every close-out item and links directly to its detail.
- **Roadmap** presents nine stages with a live "Do next" target.
- **Tracker** exports or imports progress and summarizes grades, stages and remaining targets.

The spoiler guard hides unearned story entries until either earned or disabled. Earned checks and the guard are
stored under `leonida-field-guide:v1`.

## Hash links

Use `#trophy=28` for a detail, `#view=roadmap&stage=8` for a stage, or `#view=tracker` for saved totals. Hash
parameters may also set `kind`, `grade`, and `spoilers=on|off`.

## Keyboard map

`J` and `K` move through the checklist. `Space` toggles the selected trophy. `/` focuses search. `G` followed by
`C`, `M`, `R`, or `T` changes view. `?` opens the shortcut sheet.

## Files and checks

`app/data/trophies.json` contains the official records and original guides. `main.ts` checks the 55-item list,
grade and hidden totals, missable count and guide lengths before copying the app and screenshots into an output
directory and creating `dossier.json`.

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
node /Users/kq/makefun-work/gta6/gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit /Users/kq/makefun-work/gta6/gta6-trophy-guide-01-kit --repo .
```
