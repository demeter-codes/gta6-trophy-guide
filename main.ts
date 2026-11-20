// Build entry for the Leonida field guide (Node 22, standard library only).
//
// The guide is the static app/ folder: index.html, style.css, app.js and data/trophies.json, no build step. This
// program checks the trophy data, copies app/ and screenshots/ into the output directory and writes dossier.json
// there with the vendored make.fun library. Leave vendor/makefun-frontend.ts alone; the scorer expects dossier.json
// to be what its own copy writes.
//
//   node serve.ts                                     serve app/ on http://localhost:8080
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// MAKEFUN_OUTPUT_DIR stands in for the grader's /output outside its container.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const EXPECTED = 55;

type Source = { label?: unknown; url?: unknown };
type Trophy = {
  id?: number;
  name?: string;
  grade?: string;
  guide?: unknown;
  steps?: unknown[];
  missable?: boolean;
  missableNote?: unknown;
  sources?: Source[];
};

function readTrophies(): Trophy[] {
  const parsed = JSON.parse(readFileSync(join(root, 'app', 'data', 'trophies.json'), 'utf8'));
  return Array.isArray(parsed) ? parsed : parsed.trophies;
}

// Returns every problem found, so one run reports them all.
function validate(list: Trophy[]): string[] {
  const problems: string[] = [];
  if (!Array.isArray(list) || list.length !== EXPECTED) {
    problems.push(`expected ${EXPECTED} trophies, found ${Array.isArray(list) ? list.length : 'none'}`);
    return problems;
  }
  const seen = new Set<number>();
  for (const t of list) {
    const who = `#${t.id} "${t.name}"`;
    if (seen.has(t.id as number)) problems.push(`${who}: duplicate id`);
    seen.add(t.id as number);
    if (typeof t.guide !== 'string' || !t.guide.trim()) {
      problems.push(`${who}: blank guide`);
    } else {
      const words = t.guide.trim().split(/\s+/).length;
      if (words < 120 || words > 180) problems.push(`${who}: guide has ${words} words; expected 120 to 180`);
    }
    const steps = Array.isArray(t.steps) ? t.steps : [];
    if (steps.length < 2 || steps.length > 4 || steps.some((step) => typeof step !== 'string' || !step.trim())) {
      problems.push(`${who}: expected two to four non-empty steps`);
    }
    if (t.missable && (typeof t.missableNote !== 'string' || !t.missableNote.trim())) {
      problems.push(`${who}: missable trophy has no missableNote`);
    }
    const cited = (t.sources ?? []).filter(
      (s) => typeof s.label === 'string' && s.label.trim() && typeof s.url === 'string' && s.url.startsWith('https://'),
    );
    if (cited.length === 0) problems.push(`${who}: no source with a label and an https link`);
    if (!GRADES.includes(t.grade as string)) problems.push(`${who}: unknown grade "${t.grade}"`);
  }
  return problems;
}

const trophies = readTrophies();
const problems = validate(trophies);
if (!existsSync(join(root, 'vendor', 'makefun-frontend.ts'))) problems.push('vendor/makefun-frontend.ts is missing');
if (problems.length) {
  throw new Error(`Trophy data failed validation (${problems.length}):\n  - ${problems.join('\n  - ')}`);
}
console.log(`Validated ${trophies.length} trophies: guides, sources and grades are all in order.`);

mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Caps follow the scorer's gate: at most 4 screenshots of 256 KiB, 993 entries and 48 MiB in app/, and a text budget
// that bounds how much source the dossier carries.
const limits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, limits));
