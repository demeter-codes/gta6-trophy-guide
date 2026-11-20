# gta6-trophy-guide

The entry for make.fun's bounty **"Build the best GTA 6 trophy guide"** (`gta6-trophy-guide-01`): an offline field guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI.

## State

- The make.fun account is connected and the CLI's stored key works. **Never run `makefun login`.**
- The entry is already built: `app/index.html`, `app/app.js`, `app/style.css`, `app/data/trophies.json` (55 trophies with guides, sources, missable flags), `main.ts`, `screenshots/` (four renders), `README.md` and the kit's `vendor/makefun-frontend.ts`.
- The kit is at `../gta6-trophy-guide-01-kit`; `RULES.txt` there is the authoritative spec.
- A recording of this session is running. Do not create another repository, do not rewrite history, do not run `makefun submit`.

## This pass

The entry was refused because too little of the code was written inside the recording that was entered. Fix that with real work, not by retyping: every file below must carry an improvement of yours from this session, and the improvement must be visible in the finished app or in how it is checked.

1. `app/app.js` — add a "next unearned" jump bound to `n`, a keyboard shortcut for search bound to `/`, and per-stage collapse that survives a reload. Improve the detail panel transitions.
2. `app/style.css` — write the print stylesheet (a checklist that prints one row per trophy with its grade and earned box), tune the focus ring, and tighten the narrow-viewport layout at 900px.
3. `app/index.html` — add the aria labels, the skip link and the visible keyboard hints for the two shortcuts above.
4. `app/data/trophies.json` — review ten guides you think are weakest and rewrite them in place, keeping every name and description official and every claim cited.
5. `main.ts` — add a summary line to the pre-flight check (how many trophies, how many missable, how many sources) and a check that `vendor/makefun-frontend.ts` is present, so the build fails loudly and clearly.
6. `README.md` and `AGENTS.md` — bring both up to date with this pass.
7. `.gitignore`, `shots.json`, `serve.ts` — a real improvement each: keep `out/` ignored, keep `shots.json` describing the four screenshots you actually take, and make `serve.ts` print the URL it is serving and refuse a missing `app/index.html` with a clear message.

Then re-take the four screenshots if the UI moved (1280x800, JPEG quality 80, under 256 KiB, the first with the spoiler switch off), run `node ../gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit ../gta6-trophy-guide-01-kit --repo .`, `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`, confirm `out/dossier.json` builds with a small Totals line, commit and push to `origin main` (https://github.com/demeter-codes/gta6-trophy-guide).

Keep the app offline and self-contained: no absolute URL in any `src`, `href`, `@import`, `url()` or `import`; nothing over the gate's size caps; `vendor/makefun-frontend.ts` byte for byte unchanged; no Rockstar logo or game art; every guide in your own words with its sources named.
