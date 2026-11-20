# gta6-trophy-guide

Entry for make.fun's bounty **"Build the best GTA 6 trophy guide"** (`gta6-trophy-guide-01`), deadline 2026-11-21T11:00Z.

## State

- The make.fun account is connected and the CLI's stored key works. **Never run `makefun login`**: it would start an approval nobody needs, and one earlier run replaced the keypair and broke the build.
- This repository is the entry and already holds the kit's starter (`main.ts`, `serve.ts`, `vendor/makefun-frontend.ts`, `app/`, `screenshots/`, `shots.json`, `LICENSE`).
- The kit is unpacked at `../gta6-trophy-guide-01-kit`. Read `../gta6-trophy-guide-01-kit/RULES.txt` first: it is the authoritative spec (the gate, the dossier, the judge, the screenshots).
- A recording is running. Do not create another repository, never rewrite git history, and do not run `makefun submit`.

## What to build

A polished offline **guide and tracker** for the 55 PlayStation 5 trophies of Grand Theft Auto VI, as static files under `app/`, plus `app/data/trophies.json`. The starter is only a plain checklist; replace it completely with your own code. Do not read or copy anything under `../old-app`.

The judge sees one sheet of your screenshots plus an outline of your source, and ranks by, in order:

1. **Tracker and data**: every trophy with its official name, description and grade; progress saved in the browser; export and import; filters (story, missable, collectibles, activities, online); a spoiler setting that hides story trophies until earned.
2. **Roadmap and missables**: a roadmap to the platinum in order, and a missable flag with a note on every trophy that can be lost, both built from the official descriptions.
3. **Cited guidance**: each trophy's guide says what to do, where and how, and when it can be missed, and names or links where its facts come from.
4. **Clear, fast, polished**: a trophy and its guide in a glance, readable type, small first load, a coherent look of its own.

### Data

`app/data/trophies.json`: `{"trophies": [...]}`, one item per trophy with
`id`, `name` (official, unchanged), `description` (official, unchanged), `grade`, `hidden` (PlayStation hides 28), `kind` (`story`, `collectibles`, `activities`, `combat`, `exploration`, `online`), `missable` (bool), `missableNote` (what closes it, or null), `count` (the number PlayStation tracks, or null), `chapter`, `roadmapStage` (1-9), `guide` (100 to 150 words of your own writing), `steps` (2-4 short imperatives), `sources` (`[{label, url}]`).

Write every guide yourself. Never paste another guide's text. Cite the official PlayStation description, and pages you actually opened: PSNProfiles, Exophase and GTA Base for the list and the roadmap, PowerPyx or IGN for counts and locations. Only cite a page whose text supports the claim, and use the URL you really fetched. Where a claim would need a source you do not have, keep to what the official description supports and say so.

### App

A look of its own: a printed field-guide feel. Ink `#14110f` on paper `#f7f2e8`, one accent `#b4442e`, muted `#6b6257`, hairline rules, generous whitespace, tabular numerals, system serif for headings and system sans for body. No emoji, no Rockstar logo, no game art.

Three tabs plus a detail panel:

- **Checklist**: search, kind filter, grade filter, group-by (stage or grade), "remaining only", progress bar and count, and the 55 rows with grade badge and kind tags. Story trophies show as "Hidden trophy" until earned while the spoiler switch is on.
- **Roadmap**: the 9 stages in order, each with a short brief, its trophies and an earned count, and a "missable at this stage" callout where one applies.
- **Tracker**: progress, estimated hours left, missables remaining, a per-grade breakdown, export progress to a JSON file, import it back, reset.
- **Detail panel**: official name, description, grade, kind, chapter; the guide; numbered steps; the missable warning; sources as clickable links; mark earned.

Progress lives in `localStorage` under one versioned key. Deep links: `#trophy=<id>`, `#view=roadmap`, `#view=tracker`, `#view=settings`.

### Gate rules

- Nothing the app loads comes from the network: no absolute URL in any `src`, `href`, `@import`, `url()` or `import`. `data:` URIs only for images and fonts. Links a reader clicks are fine.
- `app/`: plain files only, at most 993 entries, 48 MiB; `app/index.html` at most 1 MiB. `app/data/trophies.json` at most 2 MiB, all 55 official names present, each with a non-blank guide.
- `screenshots/`: 3 or 4 files, each at most 256 KiB, long side at most 1280 px, short side at least 480 px.
- `vendor/makefun-frontend.ts` stays byte for byte unchanged.

### Screenshots

Four real renders at 1280x800, JPEG quality 80, under 256 KiB each, replacing the starter's:

1. `1-checklist.jpg` the cover: the checklist with a trophy's guide open beside it, progress, filters, spoiler switch visible.
2. `2-roadmap.jpg` the roadmap with a stage open and its missable callout.
3. `3-tracker.jpg` the tracker: progress, hours left, missables remaining, export and import.
4. `4-spoilers.jpg` the checklist with the spoiler switch on, showing hidden story trophies and the kind filter set to Story.

Serve with `node serve.ts` (http://localhost:8080) and use headless Chrome:
`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1280,800 --screenshot=screenshots/1-checklist.jpg --virtual-time-budget=3000 "http://localhost:8080/#trophy=2"`

### Extend main.ts

Keep the starter's behaviour and add a real validation of your own, for example: read `app/data/trophies.json` and fail loudly if any of the 55 trophies has a blank guide, no source, or an unknown grade, before the dossier is written.

## Finish

- Build in passes: a working first version, then improve the same files.
- `node ../gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit ../gta6-trophy-guide-01-kit --repo .` must pass.
- `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`, then confirm `out/dossier.json` exists and its Totals line is small (a first load well under 100 KB gzip-9).
- Commit as you go (signing is off here) and push to `origin main`.
- At the end, rewrite the "How it works" part of `README.md` and the "Build notes" here to describe what you actually built.

## Build notes

- The interface is an offline, three-view field guide with a split checklist/detail panel. The page loads its own trophy JSON and four local modules; external URLs appear only as reader-opened source links.
- The list retains the 55 supplied names, descriptions, and grades, and adds 28 hidden flags, six guide kinds, nine roadmap stages, tracker counts where supplied, short steps, and 55 individually written 100-to-150-word guides. `scripts/prepare-data.mjs` regenerates the data and validates each guide's length.
- Eleven entries are flagged for a story/strand, partner, choice, or Chapter 1 window. `missableStage` sorts those warnings by the point at which to finish them: Chapter 1 for Lucia's unmarked meditation and the final-story stage as the conservative cutoff for the other strand and partnership entries.
- Sources opened for this pass were PSNProfiles and Exophase's PS5 trophy lists, GTA Base's trophy list and roadmap, and KeenGamer's roadmap and meditation-location guide. The PowerPyx and IGN guide URLs tried returned 404s; no claims or citations use them. Guide text distinguishes the sourced trigger from a conservative save/finish recommendation where a precise cutoff was not named.
- Progress, spoiler state, JSON import/export, filters, and `#trophy=` / `#view=` routes are implemented in browser modules. `main.ts` now rejects incomplete trophy data before it writes the dossier.
