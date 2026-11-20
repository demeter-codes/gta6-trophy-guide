# gta6-trophy-guide

Entry for make.fun's bounty **"Build the best GTA 6 trophy guide"** (`gta6-trophy-guide-01`), deadline 2026-11-21T11:00Z.

## State: what is already done

- The make.fun account is connected. `node cli/makefun.mjs login` from the kit prints `Connected: entries now go in as @lively-tapir-18-3261`; there is nothing left to approve, so do not start a login.
- This repository is the entry. It already holds the kit's starter: `main.ts`, `serve.ts`, `vendor/makefun-frontend.ts`, `app/`, `screenshots/`, `shots.json`, `LICENSE`, plus the make.fun `README.md` and `.makefun/owner.json`.
- The kit is unpacked at `../gta6-trophy-guide-01-kit`. Read `../gta6-trophy-guide-01-kit/RULES.txt` before you start: it is the full, authoritative specification (the gate, the dossier, the judge, the screenshot rules).
- A recording of this session is already running for this repository. Do not start another, do not create another repository, and never rewrite git history. Do not run `makefun submit`: that happens outside this session.

## Your job

The starter is only plumbing: a plain checklist with a one-line hint per trophy. Replace it with a real guide and tracker. The judge sees one sheet of screenshots plus an outline of the source, and ranks by, in order:

1. **Tracker and data.** Every trophy with its official name, description and grade; progress saved in the browser; export and import; filters; a spoiler setting that hides story trophies until they are earned.
2. **Roadmap and missables.** A roadmap to the platinum in order, and a missable flag on every trophy that can be missed, both built from the official descriptions.
3. **Cited guidance.** Each trophy's guide says what to do, where and how, when it can be missed, and names or links where each fact came from. A cited guide beats an uncited one.
4. **Clear, fast, polished.** Finding a trophy and its guide takes a glance; readable type and layout; a small first load; a look of its own.

Build it as an offline, static app under `app/`:

- `app/index.html` opens in desktop Chrome with the network off and loads only files under `app/`.
- `app/data/trophies.json`: the `trophies` array, one item per trophy, each with `name` (unchanged, official), `guide` (your own words), and whatever else the app needs: `description`, `grade`, `kind` (story, collectible, activity, side, online), `missable`, `chapter`, `steps`, `sources` (a list of `{label, url}`), `roadmapStage`.
- Every one of the 55 trophies needs a real guide. Write in your own words; never paste text from another guide. The official names and descriptions stay exactly as they are.
- Cite where facts come from: the official PlayStation description, and named guides or wikis with links (PowerPyx, PSNProfiles, Exophase, IGN, the GTA wiki). Where a specific location or step would need a source you do not have, keep the guide to what the official description supports and cite that.
- Support deep links so a state can be opened directly, e.g. `#trophy=<id>` opens that trophy's guide, `#view=roadmap`, `#view=missable`, `#view=guide&trophy=<id>`. The screenshots use them.

## Gate rules (a file the app loads that breaks one fails the entry)

- Nothing the app loads comes from the network, and no absolute URL in any `src`, `href`, `@import`, `url()`, import or `import()`. `data:` URIs only for images and fonts.
- `app/`: plain files only, at most 993 files and directories together, 48 MiB total, `app/index.html` at most 1 MiB. `screenshots/`: 3 to 4 images, each at most 256 KiB, a whole PNG or JPEG, long side at most 1280 px, short side at least 480 px.
- `app/data/trophies.json` at most 2 MiB; every one of the 55 official names present, each with a non-blank `guide`.
- `vendor/makefun-frontend.ts` stays byte for byte as it is. No Rockstar logo, official artwork, box art or game screenshot: the look is yours.
- `main.ts` must carry at least one line you wrote; extend it (for example a check that every trophy has a guide before writing the dossier).

## Screenshots

Take 4 real renders of the app in Chrome at 1280x800 (or 1280x720), JPEG quality about 80 so each stays under 256 KiB:

1. Cover: the checklist with a trophy's guide open beside it, progress and filters visible.
2. The roadmap to the platinum.
3. The missable trophies, flagged, with the spoiler setting on.
4. A trophy guide with its sources listed.

Replace the starter's screenshots. Use `node serve.ts` (it serves `app/` at http://localhost:8080) plus headless Chrome, e.g.
`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1280,800 --screenshot=screenshots/1-checklist.jpg --virtual-time-budget=2000 "http://localhost:8080/#trophy=2"`.

## Build, check, finish

- Work in `app/`: `index.html`, `app.js` (or a few modules), `style.css`, `app/data/trophies.json`. Split the code into files with one job each and name functions for what they do.
- Build in steps: write a first working version, run it, then edit the same files to improve them (the transcript checks look for a file edited across at least two passes).
- Check it: `node ../gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit ../gta6-trophy-guide-01-kit --repo .`
- Write the output: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`, then confirm `out/dossier.json` builds.
- Commit as you go (`git commit`; signing is off in this repository) and push to `origin main`.
- When you are done, add a short "How it works" section to `README.md` and a short "Build notes" section to this file describing what you built.
