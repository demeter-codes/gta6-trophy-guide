# Leonida Field Guide

## Working scope

The product, styles, and trophy data belong in `app/`. `main.ts` and `serve.ts` assemble or preview that static app; they do not become a second app source.

## Data rules

- Preserve all 55 official trophy names, descriptions, grades, and hidden flags exactly.
- Keep 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden records, and 11 missables.
- Give every guide 120–180 words, two to four steps, and no more than three HTTPS sources.
- Name missions or locations only when the supplied sources support them.
- If a source is silent, keep guidance tied to the official description and mark the action as general cleanup or after the story.

## Display rules

- Keep the app fully local and framework-free.
- Preserve localStorage progress and export, import, search, filters, spoiler guard, roadmap, missables, and keyboard controls.

## Protected assets

Do not modify `vendor/makefun-frontend.ts` or `LICENSE`. Build output belongs in `out/`.
