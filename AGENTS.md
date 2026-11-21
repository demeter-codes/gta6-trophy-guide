# Leonida Field Guide

## Project shape

This repository builds one offline trophy guide. The browser app lives entirely in `app/`. `main.ts` validates the
data and assembles the handoff directory. `serve.ts` is a loopback-only static server for local preview.

## Working rules

- Never load a font, image, script, stylesheet or API from another origin.
- Preserve the 55 official trophy names, descriptions, grades and hidden flags.
- Keep the count, grade and missable totals matching PlayStation's published list.
- Write original guidance. Cite sources beside a claim and avoid unverified missions or locations.
- When the available sources do not establish a step, say the official description is the only basis and keep it
  as an after-story or general cleanup task.
- Keep `vendor/makefun-frontend.ts` and `LICENSE` byte-for-byte untouched.
- Do not use network-fetching build tools in the app.

## Validation

Run the build and kit check from the repository root:

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
node /Users/kq/makefun-work/gta6/gta6-trophy-guide-01-kit/cli/makefun.mjs check --kit /Users/kq/makefun-work/gta6/gta6-trophy-guide-01-kit --repo .
```
