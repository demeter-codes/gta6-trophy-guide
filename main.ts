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
  description?: string;
  grade?: string;
  hidden?: boolean;
  guide?: unknown;
  steps?: unknown[];
  missable?: boolean;
  missableNote?: unknown;
  kind?: string;
  chapter?: unknown;
  roadmapStage?: number;
  hours?: number;
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
      if (words < 50 || words > 180) problems.push(`${who}: guide has ${words} words; expected 50 to 180`);
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
    if (cited.length > 3) problems.push(`${who}: expected no more than three sources`);
    if (!GRADES.includes(t.grade as string)) problems.push(`${who}: unknown grade "${t.grade}"`);
    if (typeof t.description !== 'string' || !t.description.trim()) problems.push(`${who}: missing official description`);
    if (typeof t.hidden !== 'boolean') problems.push(`${who}: missing hidden flag`);
    if (typeof t.kind !== 'string' || !t.kind.trim()) problems.push(`${who}: missing kind`);
    if (typeof t.chapter !== 'string' || !t.chapter.trim()) problems.push(`${who}: missing chapter`);
    if (!Number.isInteger(t.roadmapStage) || (t.roadmapStage as number) < 1 || (t.roadmapStage as number) > 9) {
      problems.push(`${who}: roadmapStage must be from 1 to 9`);
    }
  }
  const gradeCounts = GRADES.map((grade) => list.filter((t) => t.grade === grade).length);
  if (gradeCounts.join('/') !== '1/2/6/46') {
    problems.push(`official grade counts changed: ${gradeCounts.join('/')}; expected 1/2/6/46`);
  }
  const hiddenCount = list.filter((t) => t.hidden === true).length;
  if (hiddenCount !== 28) problems.push(`official hidden count changed: ${hiddenCount}; expected 28`);
  const missableCount = list.filter((t) => t.missable === true).length;
  if (missableCount !== 11) problems.push(`missable count changed: ${missableCount}; expected 11`);
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
