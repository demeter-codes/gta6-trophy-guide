# gta6-trophy-guide

Entry for make.fun's bounty "Build the best GTA 6 trophy guide" (`gta6-trophy-guide-01`). The kit lives at
`../gta6-trophy-guide-01-kit`; its `RULES.txt` is the spec.

## Ground rules

- Never run `makefun login`, `record`, `submit` or `init`. Never rewrite history.
- Leave `vendor/makefun-frontend.ts` and `LICENSE` untouched.
- Nothing the app loads may come from the network. Links a reader clicks are fine.
- Keep official `name`, `description`, `grade` and `hidden` values exactly as they are in `app/data/trophies.json`.
- Never invent a location, collectible spot or mission name; cite the source inline or mark the step "after the
  story".

## Check before committing

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node ../gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit ../gta6-trophy-guide-01-kit --repo .
```

## Build notes

A static field guide under `app/`: `index.html`, `style.css`, `app.js` and `data/trophies.json`. The page has three
views, Checklist, Roadmap and Tracker, with a detail panel beside the checklist. All 55 trophies carry an
original guide of 120 to 180 words, two to four steps, one to three sources and, for the eleven missables, a
`missableNote`. Progress lives in `localStorage` under `leonida-field-guide:v1` as `{v, earned, guard}`, and the
hash holds the view (`#trophy=`, `#view=`, plus `kind`, `grade`, `stage`, `spoilers`). The spoiler guard masks every
unearned story trophy. `main.ts` validates the data and then writes the dossier; `serve.ts` is a loopback static
server. Screenshots are 1280x800 JPEG renders of the running app, listed in `shots.json`.
