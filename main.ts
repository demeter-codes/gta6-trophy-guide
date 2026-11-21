// Assembly script for the Leonida Field Guide handoff.
// Node 22 only: standard library plus the supplied make.fun dossier builder.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repository = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const expectedGrades = ['platinum', 'gold', 'silver', 'bronze'];

type Source = { label?: unknown; url?: unknown };
type Trophy = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  grade?: unknown;
  hidden?: unknown;
  kind?: unknown;
  count?: unknown;
  chapter?: unknown;
  roadmapStage?: unknown;
  hours?: unknown;
  missable?: unknown;
  missableNote?: unknown;
  guide?: unknown;
  steps?: unknown;
  sources?: Source[];
};

function loadTrophies(): Trophy[] {
  const document = JSON.parse(readFileSync(join(repository, 'app', 'data', 'trophies.json'), 'utf8'));
  return Array.isArray(document) ? document : document.trophies;
}

function validate(items: Trophy[]): string[] {
  const faults: string[] = [];

  if (!Array.isArray(items) || items.length !== 55) {
    faults.push(`Expected 55 trophies; received ${Array.isArray(items) ? items.length : 0}.`);
    return faults;
  }

  const ids = new Set<number>();
  for (const item of items) {
    const label = `#${String(item.id)} "${String(item.name)}"`;

    if (!Number.isInteger(item.id) || ids.has(item.id as number)) {
      faults.push(`${label}: id is missing or duplicated.`);
    } else {
      ids.add(item.id as number);
    }

    for (const field of ['name', 'description', 'grade', 'hidden', 'kind', 'chapter'] as const) {
      if (typeof item[field] === 'undefined' || item[field] === null) {
        faults.push(`${label}: missing ${field}.`);
      }
    }

    if (typeof item.guide !== 'string') {
      faults.push(`${label}: guide is not text.`);
    } else {
      const words = item.guide.trim().split(/\s+/).filter(Boolean).length;
      if (words < 120 || words > 180) {
        faults.push(`${label}: guide is ${words} words; expected 120–180.`);
      }
    }

    if (!Array.isArray(item.steps) || item.steps.length < 2 || item.steps.length > 4 ||
        item.steps.some((step) => typeof step !== 'string' || !step.trim())) {
      faults.push(`${label}: steps must contain two to four instructions.`);
    }

    if (item.missable === true &&
        (typeof item.missableNote !== 'string' || !item.missableNote.trim())) {
      faults.push(`${label}: missable has no warning.`);
    }

    if (typeof item.roadmapStage !== 'number' ||
        item.roadmapStage < 1 || item.roadmapStage > 9) {
      faults.push(`${label}: roadmapStage must be 1–9.`);
    }

    if (!expectedGrades.includes(String(item.grade))) {
      faults.push(`${label}: unknown grade ${String(item.grade)}.`);
    }

    const sources = Array.isArray(item.sources) ? item.sources : [];
    const validSources = sources.filter((source) =>
      typeof source.label === 'string' && source.label.trim() &&
      typeof source.url === 'string' && source.url.startsWith('https://'));
    if (validSources.length < 1) {
      faults.push(`${label}: at least one HTTPS source is required.`);
    }
    if (validSources.length > 3) {
      faults.push(`${label}: no more than three sources are allowed.`);
    }
  }

  const gradeCounts = expectedGrades.map((grade) =>
    items.filter((item) => item.grade === grade).length);
  if (gradeCounts.join('/') !== '1/2/6/46') {
    faults.push(`Grade totals changed: ${gradeCounts.join('/')}; expected 1/2/6/46.`);
  }
  if (items.filter((item) => item.hidden === true).length !== 28) {
    faults.push('Hidden total changed; expected 28.');
  }
  if (items.filter((item) => item.missable === true).length !== 11) {
    faults.push('Missable total changed; expected 11.');
  }

  return faults;
}

const trophies = loadTrophies();
const errors = validate(trophies);
if (!existsSync(join(repository, 'vendor', 'makefun-frontend.ts'))) {
  errors.push('vendor/makefun-frontend.ts is missing.');
}
if (errors.length) {
  throw new Error(`Trophy guide validation failed:\n- ${errors.join('\n- ')}`);
}

console.log(`Validated ${trophies.length} trophies, including official totals and guide lengths.`);

mkdirSync(output, { recursive: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
cpSync(join(repository, 'app'), join(output, 'app'), { recursive: true });
if (existsSync(join(repository, 'screenshots'))) {
  cpSync(join(repository, 'screenshots'), join(output, 'screenshots'), { recursive: true });
}

const limits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

writeFileSync(join(output, 'dossier.json'), buildDossier(output, limits));
