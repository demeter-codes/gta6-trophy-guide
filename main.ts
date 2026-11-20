// A working gta6-trophy-guide-01 entry (Node 22, standard library only): the guide is this directory's app/ folder,
// plain static files a browser opens at app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json. The program hands it in: it copies app/
// and screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the judge reads (your
// screenshots, the first load's files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Only the plumbing, not a winner: a plain checklist of the 55 trophies with a one-line hint each. Write a real guide
// for every trophy in your own words, a roadmap to the platinum, filters and a spoiler setting in app/, put 3 or 4 PNG
// or JPEG screenshots of it in screenshots/ (the first by name is the cover; shots.json says which views this
// starter's were taken of), and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const trophyData = JSON.parse(readFileSync(join(here, 'app/data/trophies.json'), 'utf8'));
const grades = new Set(['platinum', 'gold', 'silver', 'bronze']);
const kinds = new Set(['story', 'collectibles', 'activities', 'combat', 'exploration', 'online']);
const trophies = trophyData.trophies;

if (!Array.isArray(trophies) || trophies.length !== 55) {
  throw new Error('app/data/trophies.json must contain exactly 55 trophies.');
}
const ids = new Set();
for (const trophy of trophies) {
  if (ids.has(trophy.id)) throw new Error(`Duplicate trophy id: ${trophy.id}`);
  ids.add(trophy.id);
  if (!trophy.name?.trim() || !trophy.description?.trim() || !trophy.guide?.trim()) {
    throw new Error(`Trophy ${trophy.name || trophy.id} has a blank name, description, or guide.`);
  }
  if (!grades.has(trophy.grade)) throw new Error(`${trophy.name} has an unknown grade: ${trophy.grade}`);
  if (!kinds.has(trophy.kind)) throw new Error(`${trophy.name} has an unknown kind: ${trophy.kind}`);
  if (!Array.isArray(trophy.sources) || trophy.sources.length === 0) {
    throw new Error(`${trophy.name} has no cited source.`);
  }
  if (trophy.missable) {
    if (!trophy.missableNote?.trim() || !Number.isInteger(trophy.missableStage) ||
        trophy.missableStage < 1 || trophy.missableStage > 9) {
      throw new Error(`${trophy.name} is missable without a valid note and loss stage.`);
    }
  } else if (trophy.missableNote !== null || trophy.missableStage !== null) {
    throw new Error(`${trophy.name} has missable details but is not marked missable.`);
  }
  if (!Number.isInteger(trophy.roadmapStage) || trophy.roadmapStage < 1 || trophy.roadmapStage > 9) {
    throw new Error(`${trophy.name} has an invalid roadmap stage.`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
