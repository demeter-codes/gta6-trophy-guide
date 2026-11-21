# Leonida Field Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/demeter-codes/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

This repository is an entry in [the GTA 6 trophy guide bounty on make.fun](https://make.fun/bounty/gta6-trophy-guide-01).

Leonida Field Guide is a complete browser-only PlayStation 5 trophy reference for Grand Theft Auto VI. It provides
the 55 official trophies, original route notes, spoiler-aware details, a missables ledger, and a nine-stage plan.

## Preview

The app makes no build-time or runtime third-party requests. Serve the repository with:

```sh
node serve.ts
```

The preview binds to `127.0.0.1:8080`. An alternate loopback port is available with `node serve.ts --port 8099`.

## Features

- A searchable checklist grouped by stage or medal grade.
- Kind, grade, remaining, and spoiler controls.
- A two-pane guide with official wording, steps, notes, and cited sources.
- Separate missables, roadmap, and saved-progress views.
- Local JSON export/import and keyboard navigation.

## Validation

Build the handoff with Node 22 and run the kit from the repository root:

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
node /Users/kq/makefun-work/gta6/gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit /Users/kq/makefun-work/gta6/gta6-trophy-guide-01-kit --repo .
```
