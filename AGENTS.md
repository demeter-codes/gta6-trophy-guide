# Leonida Field Guide

## Working scope

This repository is a browser-only GTA VI trophy field guide. The product, styles, and data belong in `app/`.
The Node entry and preview files may assemble or serve those files, but they must not become a second app source.

## Data rules

- Preserve the 55 official trophy names and descriptions verbatim.
- Preserve each official grade and hidden flag.
- Keep grade totals at 1 platinum, 2 gold, 6 silver, and 46 bronze.
- Keep 28 hidden entries and 11 missables.
- Write 120–180 words for every guide.
- Provide two to four steps and no more than three HTTPS sources per trophy.
- Add only claims supported by the supplied official or community sources.
- Never invent a mission title or location. If a source is silent, use the official description and label the
  action as general cleanup or an after-story task.

## Display rules

- Keep the interface fully local: no framework, third-party font, remote image, API, or runtime network dependency.
- Preserve saved progress in browser storage, and keep export/import, search, filters, spoiler guard, roadmap,
  missables, and keyboard controls functional.

## Protected assets

Do not modify `vendor/makefun-frontend.ts` or `LICENSE`. Generated output belongs in `out/`.

## Required validation

Run these commands from the repository root:

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
node /Users/kq/makefun-work/gta6/gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit /Users/kq/makefun-work/gta6/gta6-trophy-guide-01-kit --repo .
```
