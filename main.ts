// Build and validate the Leonida Field Guide entry.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root=fileURLToPath(new URL('.',import.meta.url));
const target=process.env.MAKEFUN_OUTPUT_DIR??'/output';
type Trophy={id:number,name:string,description:string,grade:string,hidden:boolean,kind:string,missable:boolean,missableNote:string,count:number|null,chapter:string,roadmapStage:number,hours:number,guide:string,steps:string[],sources:{label:string,url:string}[]};
function readTrophies():Trophy[]{const data=JSON.parse(readFileSync(join(root,'app','data','trophies.json'),'utf8'));return Array.isArray(data)?data:data.trophies}
function audit(items:Trophy[]):string[]{const problems:string[]=[];if(items.length!==55)problems.push(`Expected 55 trophy records; found ${items.length}.`);
const medals=['platinum','gold','silver','bronze'];for(const grade of medals){const n=items.filter(r=>r.grade===grade).length;if(grade==='platinum'&&n!==1)problems.push(`Expected 1 ${grade}; found ${n}.`);if(grade==='gold'&&n!==2)problems.push(`Expected 2 ${grade}; found ${n}.`);if(grade==='silver'&&n!==6)problems.push(`Expected 6 ${grade}; found ${n}.`);if(grade==='bronze'&&n!==46)problems.push(`Expected 46 ${grade}; found ${n}.`)}
if(items.filter(r=>r.hidden).length!==28)problems.push('Hidden trophy count is not 28.');
if(items.filter(r=>r.missable).length!==11)problems.push('Missable trophy count is not 11.');
const ids=new Set<number>();for(const r of items){const caption=`#${r.id} ${r.name}`;if(!Number.isInteger(r.id)||ids.has(r.id))problems.push(`${caption}: id is missing or repeated.`);ids.add(r.id);for(const key of ['name','description','grade','hidden','kind','chapter'] as const)if(r[key]===undefined||r[key]===null)problems.push(`${caption}: missing ${key}.`);const words=r.guide.trim().split(/\s+/).filter(Boolean).length;if(words<120||words>180)problems.push(`${caption}: guide has ${words} words; allowed range is 120–180.`);if(!Array.isArray(r.steps)||r.steps.length<2||r.steps.length>4||r.steps.some(s=>typeof s!=='string'||!s.trim()))problems.push(`${caption}: expected two to four steps.`);if(r.missable&&(!r.missableNote||!r.missableNote.trim()))problems.push(`${caption}: missable warning is missing.`);if(!Number.isInteger(r.roadmapStage)||r.roadmapStage<1||r.roadmapStage>9)problems.push(`${caption}: roadmap stage must be 1–9.`);if(!Array.isArray(r.sources)||r.sources.length<1||r.sources.length>3)problems.push(`${caption}: sources must contain 1–3 pages.`);else if(r.sources.some(s=>typeof s.label!=='string'||typeof s.url!=='string'||!s.url.startsWith('https://')))problems.push(`${caption}: source data must contain labels and HTTPS URLs.`)}return problems}
const trophies=readTrophies();const errors=audit(trophies);if(!existsSync(join(root,'vendor','makefun-frontend.ts')))errors.push('vendor/makefun-frontend.ts is missing.');
if(errors.length)throw new Error(`Guide validation failed:\n- ${errors.join('\n- ')}`);
console.log(`Validated ${trophies.length} trophies and the complete guide contract.`);
mkdirSync(target,{recursive:true});mkdirSync(join(target,'screenshots'),{recursive:true});
cpSync(join(root,'app'),join(target,'app'),{recursive:true});
if(existsSync(join(root,'screenshots')))cpSync(join(root,'screenshots'),join(target,'screenshots'),{recursive:true});
writeFileSync(join(target,'dossier.json'),buildDossier(target,{text_max_bytes:163840,screenshots:{max:4,max_bytes:262144},app_max_files:993,app_max_bytes:50331648}));
