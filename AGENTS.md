# gta6-trophy-guide

Entry for make.fun's bounty "Build the best GTA 6 trophy guide" (`gta6-trophy-guide-01`).

## Rules of engagement

- Never run `makefun login`; do not create another repository; never rewrite git history; do not run `makefun submit`.
- The kit is at `../gta6-trophy-guide-01-kit`. `RULES.txt` there is the authoritative spec.
- `vendor/makefun-frontend.ts` must stay byte for byte unchanged.

## Layout

- `app/index.html`, `app/style.css`, `app/app.js`: the static, offline app (no build step, nothing loaded from the network).
- `app/data/trophies.json`: 55 trophies with official name, description and grade, plus kind, missable flag and note, count, chapter, roadmap stage, guide, steps, sources and hour estimates.
- `main.ts`: validates the data (55 trophies, non-blank guide, a source, known grade), copies `app/` and `screenshots/` to the output directory and writes `dossier.json` via the vendored library.
- `serve.ts`: loopback static server for `app/` on http://localhost:8080.
- `screenshots/` and `shots.json`: four 1280x800 JPEG (q80, under 256 KiB) renders and the paths they are taken from.

## Check and build

- `node serve.ts`
- `node ../gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit ../gta6-trophy-guide-01-kit --repo .`
- `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` writes `out/dossier.json` (`out/` is git-ignored).

## Build notes

- Views: checklist (search, kind, grade, arrange by stage or grade, remaining only, progress meter), nine-stage roadmap with missable callouts, tracker (progress, hours left, missables, per-grade breakdown, JSON export/import, reset) and a detail panel with guide, steps, warning and source links.
- Spoiler guard hides unearned story trophies as "Hidden trophy". Deep links: `#trophy=<id>`, `#view=roadmap|tracker`, plus `kind`, `grade`, `stage`, `spoilers` parameters (used by `shots.json`).
- Progress is in `localStorage` under `leonida-field-guide:v1`.
- Data: 11 missables flagged with what closes them; 28 hidden on PSN. Kinds: activities 28, story 13, exploration 6, collectibles 5, combat 3 (none tagged online). Sources: Exophase, GTAside, GTABase, KeenGamer. Hour figures are planning estimates split from the roughly 200 hours those sources quote.
- Look: ink `#14110f` on paper `#f7f2e8`, accent `#b4442e`, system serif headings, no emoji or game art.
