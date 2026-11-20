// Leonida Field Guide — the submission program for make.fun's gta6-trophy-guide-01 bounty.
// Node 22, standard library only. The guide itself is this directory's app/ folder: plain static
// files a browser opens at app/index.html (ES modules, CSS, no build step), working with the
// network off, its trophy list in app/data/trophies.json. This program hands it in: it checks the
// guide data, copies app/ and screenshots/ to /output, and writes /output/dossier.json with the
// vendored make.fun library. Leave vendor/makefun-frontend.ts as it is: the scorer requires
// dossier.json to be byte for byte what its own copy writes.
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

// The guide is only worth handing in if every trophy carries real writing, so check the data
// before anything is copied: a missing guide is a bug in the build, not something to ship.
const EXPECTED_GRADES = { platinum: 1, gold: 2, silver: 6, bronze: 46 };

function readGuide() {
  const path = join(here, 'app', 'data', 'trophies.json');
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  const trophies = Array.isArray(parsed) ? parsed : parsed.trophies;
  if (!Array.isArray(trophies)) throw new Error(`${path} holds no trophies array`);
  return trophies;
}

// Every trophy needs a guide of at least 90 words and at least one named source, one trophy
// needs to be flagged missable, and the grades have to add up to the official list.
function checkGuide(trophies) {
  const problems = [];
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };

  for (const trophy of trophies) {
    const label = trophy.name ? `"${trophy.name}"` : `trophy ${trophy.id}`;
    counts[trophy.grade] = (counts[trophy.grade] ?? 0) + 1;
    const words = String(trophy.guide ?? '').trim().split(/\s+/).filter(Boolean).length;
    if (words < 90) problems.push(`${label}: guide is ${words} words, needs at least 90`);
    if (!Array.isArray(trophy.sources) || trophy.sources.length === 0) problems.push(`${label}: no sources listed`);
    for (const source of trophy.sources ?? []) {
      if (!source || typeof source.url !== 'string' || !source.url.startsWith('https://')) {
        problems.push(`${label}: source without an https link`);
      }
    }
  }

  if (trophies.length !== 55) problems.push(`the list holds ${trophies.length} trophies, not 55`);
  for (const [grade, expected] of Object.entries(EXPECTED_GRADES)) {
    if ((counts[grade] ?? 0) !== expected) problems.push(`${grade}: ${counts[grade] ?? 0} trophies, expected ${expected}`);
  }
  if (!trophies.some((trophy) => trophy.missable)) problems.push('no trophy is flagged missable');

  if (problems.length > 0) {
    throw new Error(`the guide data is not ready to hand in:\n  ${problems.join('\n  ')}`);
  }
}

const trophies = readGuide();
checkGuide(trophies);

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

console.log(`handed in ${trophies.length} trophies, ${trophies.filter((t) => t.guide).length} with guides, to ${out}`);
