# Leonida Field Guide

## Repository role

This is a static, local-first trophy reference for GTA VI. The hand-built interface and JSON live in `app/`; Node
files assemble and preview the entry. No framework, remote asset, or network API belongs in the browser bundle.

## Content contract

- Keep all 55 official names, descriptions, platinum/gold/silver/bronze grades, and hidden markers unchanged.
- Maintain 55 records, the 1/2/6/46 grade split, 28 hidden trophies, and 11 missables.
- Give each record 120–180 words of original guide text, two to four practical steps, and no more than three sources.
- Base every claim on the supplied official or community pages. Never add an invented mission or location.
- If a source does not identify a mission or place, call that step a general cleanup or after-story task and use the
  official description as the basis.

## Protected files

Do not edit `vendor/makefun-frontend.ts` or `LICENSE`. They are supplied entry assets. Keep all app rendering and
data access in `app/`, and keep `out/` generated rather than hand-maintained.

## Verification

From the repository root, build and run the competition check:

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
node /Users/kq/makefun-work/gta6/gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit /Users/kq/makefun-work/gta6/gta6-trophy-guide-01-kit --repo .
```

The entry is ready only when the kit reports `4 passed, 0 failed`, all app files are present, and the worktree is clean.
