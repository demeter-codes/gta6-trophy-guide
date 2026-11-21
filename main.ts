// Leonida Field Guide build entry.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root=fileURLToPath(new URL('.',import.meta.url));
const target=process.env.MAKEFUN_OUTPUT_DIR??'/output';
const medals=['platinum','gold','silver','bronze'];
type Trophy={id?:unknown,name?:unknown,description?:unknown,grade?:unknown,hidden?:unknown,kind?:unknown,chapter?:unknown,roadmapStage?:unknown,missable?:unknown,missableNote?:unknown,guide?:unknown,steps?:unknown,sources?:{label?:unknown,url?:unknown}[]};
function readTrophies():Trophy[]{const document=JSON.parse(readFileSync(join(root,'app','data','trophies.json'),'utf8'));return Array.isArray(document)?document:document.trophies}
function audit(items:Trophy[]):string[]{
 const problems:string[]=[];
 if(!Array.isArray(items)||items.length!==55)return [`Expected 55 trophy records; found ${Array.isArray(items)?items.length:0}.`];
 const seen=new Set<number>();
 for(const trophy of items){
  const caption=`#${String(trophy.id)} ${String(trophy.name)}`;
  if(!Number.isInteger(trophy.id)||seen.has(trophy.id as number))problems.push(`${caption}: id is missing or repeated.`);else seen.add(trophy.id as number);
  for(const key of ['name','description','grade','hidden','kind','chapter'] as const)if(trophy[key]===undefined||trophy[key]===null)problems.push(`${caption}: missing ${key}.`);
  if(typeof trophy.guide!== 'string')problems.push(`${caption}: guide is missing.`);
  else{const words=trophy.guide.trim().split(/\s+/).filter(Boolean).length;if(words<120||words>180)problems.push(`${caption}: guide has ${words} words; allowed range is 120–180.`)}
  if(!Array.isArray(trophy.steps)||trophy.steps.length<2||trophy.steps.length>4||trophy.steps.some(step=>typeof step!=='string'||!step.trim()))problems.push(`${caption}: expected two to four practical steps.`);
  if(trophy.missable===true&&(typeof trophy.missableNote!=='string'||!trophy.missableNote.trim()))problems.push(`${caption}: missable warning is missing.`);
  if(!Number.isInteger(trophy.roadmapStage)||(trophy.roadmapStage as number)<1||(trophy.roadmapStage as number)>9)problems.push(`${caption}: roadmap stage must be 1–9.`);
  if(!medals.includes(String(trophy.grade)))problems.push(`${caption}: unrecognized grade.`);
  const references=Array.isArray(trophy.sources)?trophy.sources:[];
  const usable=references.filter(source=>typeof source.label==='string'&&source.label.trim().length>0&&typeof source.url==='string'&&source.url.startsWith('https://'));
  if(usable.length<1)problems.push(`${caption}: expected at least one HTTPS source.`);
  if(usable.length>3)problems.push(`${caption}: more than three sources are not allowed.`);
 }
 const split=medals.map(medal=>items.filter(t=>t.grade===medal).length).join('/');
 if(split!=='1/2/6/46')problems.push(`Grade split is ${split}; expected 1/2/6/46.`);
 if(items.filter(t=>t.hidden===true).length!==28)problems.push('Hidden trophy count changed; expected 28.');
 if(items.filter(t=>t.missable===true).length!==11)problems.push('Missable trophy count changed; expected 11.');
 return problems;
}
const trophies=readTrophies();const errors=audit(trophies);
if(!existsSync(join(root,'vendor','makefun-frontend.ts')))errors.push('vendor/makefun-frontend.ts is missing.');
if(errors.length)throw new Error(`Guide validation failed:\n- ${errors.join('\n- ')}`);
console.log(`Validated ${trophies.length} trophies and the complete guide contract.`);
mkdirSync(target,{recursive:true});mkdirSync(join(target,'screenshots'),{recursive:true});
cpSync(join(root,'app'),join(target,'app'),{recursive:true});
if(existsSync(join(root,'screenshots')))cpSync(join(root,'screenshots'),join(target,'screenshots'),{recursive:true});
writeFileSync(join(target,'dossier.json'),buildDossier(target,{text_max_bytes:163840,screenshots:{max:4,max_bytes:262144},app_max_files:993,app_max_bytes:50331648}));
