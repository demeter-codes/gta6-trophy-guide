# gta6-trophy-guide

Entry for make.fun's bounty **"Build the best GTA 6 trophy guide"** (`gta6-trophy-guide-01`), deadline 2026-11-21T11:00Z.

## State

- The make.fun account is connected and the CLI's stored key works. **Never run `makefun login`** (an earlier run replaced the keypair and broke the build).
- This repository is the entry and holds the kit's starter: `main.ts`, `serve.ts`, `vendor/makefun-frontend.ts`, `app/`, `screenshots/`, `shots.json`, `LICENSE`.
- The kit is at `../gta6-trophy-guide-01-kit`. Read `../gta6-trophy-guide-01-kit/RULES.txt` first: it is the authoritative spec.
- A recording is running. Do not create another repository, never rewrite git history, and do not run `makefun submit`.

## What to build

A polished offline **guide and tracker** for the 55 PlayStation 5 trophies of Grand Theft Auto VI, as static files under `app/` plus `app/data/trophies.json`. The starter is a plain checklist; replace it completely with your own code.

The judge sees one sheet of your screenshots plus an outline of your source, and ranks by, in order:

1. **Tracker and data**: every trophy with its official name, description and grade; progress saved in the browser; export and import; filters (story, missable, collectibles, activities, online); a spoiler setting that hides story trophies until earned.
2. **Roadmap and missables**: a roadmap to the platinum in order, and a missable flag with a note on every trophy that can be lost.
3. **Cited guidance**: each trophy's guide says what to do, where and how, and when it can be missed, and names or links where its facts come from.
4. **Clear, fast, polished**: a trophy and its guide in a glance, readable type, small first load, a coherent look of its own.

### Data — `app/data/trophies.json`

`{"trophies": [...]}`, one item per trophy: `id`, `name` and `description` exactly as they are now, `grade`, `hidden` (PlayStation hides 28), `kind` (`story`, `collectibles`, `activities`, `combat`, `exploration`, `online`), `missable` (bool), `missableNote`, `count` (the number PlayStation tracks, or null), `chapter`, `roadmapStage` (1-9), `guide` (100-150 words), `steps` (2-4 imperatives), `sources` (`[{label, url}]`).

**Guides.** Write each one yourself, in that trophy's own terms. Do not reuse one phrasing across the list and do not restate the description as the guide: open with what actually happens, say where and how using only what the official description supports plus what a source you read says, and add the judgment a player needs (what to do first, what combines, what to leave until after the credits). Never paste another guide's text.

**Missables.** Not everything is unmissable. The official descriptions name six character strands that each end in a "final mission" (Andy, Kenton, Billy, Randy, Tyrone, Bret), two partnership actions (Hot Together, Retail Therapy), two choice-driven ones (Actions Speak Louder, Personal Best) and one chapter event (Positive Mental Attitude). Flag every trophy whose strand, mission set, choice or chapter window can close before you finish it, with a `missableNote` saying exactly what closes it and what to do first. Leave chapter-completion and free-roam count trophies false.

**Sources.** Open real pages and cite them where they support the claim: PSNProfiles and Exophase for the list and its grades, GTA Base's trophy guide and roadmap for order and per-trophy notes, KeenGamer's roadmap, PowerPyx or IGN for counts and locations. Add a source only when you have read it and it says what the entry claims; never invent a URL. Name the source in the guide's own text ("GTA Base's roadmap puts this in Chapter 3") so a reader sees where each fact came from.

### App

A look of its own: a printed field guide. Ink `#14110f` on paper `#f7f2e8`, one accent `#b4442e`, muted `#6b6257`, hairline rules, generous whitespace, tabular numerals, system serif headings over system sans body. No emoji, no Rockstar logo, no game art.

- **Checklist**: search, kind filter (story, missable, collectibles, activities, combat, exploration, online), grade filter, arrange by stage or grade, "remaining only", a progress bar and count, and the 55 rows with grade badge and kind tags. With the spoiler switch on, unearned story trophies read "Hidden trophy".
- **Roadmap**: 9 stages in order, each with a short brief, its trophies and an earned count, and a "missable at this stage" callout where one applies.
- **Tracker**: progress, planning hours left, missables remaining, per-grade breakdown, export progress to a JSON file, import it back, reset.
- **Detail panel**: official name, description, grade, kind, chapter; the guide; numbered steps; the missable warning; sources as clickable links; mark earned.

Progress lives in `localStorage` under one versioned key. Deep links: `#trophy=<id>`, `#view=roadmap`, `#view=tracker`.

### Gate rules

- Nothing the app loads comes from the network: no absolute URL in any `src`, `href`, `@import`, `url()` or `import`. `data:` URIs only for images and fonts. Links a reader clicks are fine.
- `app/`: plain files only, at most 993 entries, 48 MiB; `app/index.html` at most 1 MiB; `app/data/trophies.json` at most 2 MiB with all 55 names and a non-blank guide each.
- `screenshots/`: 3 or 4 files, each at most 256 KiB, long side at most 1280 px, short side at least 480 px.
- `vendor/makefun-frontend.ts` byte for byte unchanged.

### Screenshots

Four real renders at 1280x800, JPEG quality 80, under 256 KiB each, replacing the starter's:

1. `1-checklist.jpg`, the cover: the checklist with the spoiler switch **off** so the real names and descriptions show, a trophy's guide open beside it, progress and filters visible.
2. `2-roadmap.jpg`: the roadmap with a stage open and its missable callout.
3. `3-tracker.jpg`: progress, hours left, missables remaining, export and import.
4. `4-spoilers.jpg`: the spoiler switch **on**, kind filter set to Story, so the hidden rows show.

Serve with `node serve.ts` (http://localhost:8080), then:
`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1280,800 --screenshot=screenshots/1-checklist.jpg --virtual-time-budget=3000 "http://localhost:8080/#trophy=2"`

### Extend main.ts

Keep the starter's behaviour and add a real validation of your own: read `app/data/trophies.json` and fail loudly if any of the 55 trophies has a blank guide, no source, or an unknown grade, before the dossier is written.

## Finish

- Build in passes: a working first version, then improve the same files.
- `node ../gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit ../gta6-trophy-guide-01-kit --repo .` must pass.
- `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`, then confirm `out/dossier.json` exists and its Totals line is small (first load well under 100 KB gzip-9).
- Commit as you go and push to `origin main`.
- At the end rewrite the description in `README.md` and the "Build notes" here to match what you built.

## Build notes

Built as a static field guide with a checklist, nine-stage roadmap, tracker and animated trophy detail panel, powered by `app/data/trophies.json`. It includes offline progress, JSON import/export, spoiler controls, keyboard shortcuts, print styles and accessible focus states. Four 1280x800 JPEG screenshots are headless Chrome captures; README documents the palette, controls, citations and storage key.
