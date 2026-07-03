import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {JSDOM} from 'jsdom';

const root=resolve(import.meta.dirname,'..');
const dom=new JSDOM('<!doctype html>',{url:'https://audit.local',runScripts:'outside-only'});
for(const file of ['questions.js','question-expander.js','ax-question-extension.js','learning-os-data.js','atlas-content.js','curriculum-data.js'])dom.window.eval(await readFile(resolve(root,file),'utf8'));
const questions=dom.window.QUESTION_BANK||[],curriculum=dom.window.ATLAS_CURRICULUM||{};
const concepts=Object.entries(curriculum).flatMap(([category,c])=>c.sections.flatMap(section=>section.concepts.map(x=>({category,section:section.title,...x}))));
const issues=[];const add=(severity,type,id,message)=>issues.push({severity,type,id,message});
const seenQ=new Map(),seenTitle=new Map(),answerLengths=[];
for(const c of concepts){
  const key=c.title.trim().toLowerCase();if(seenTitle.has(key))add('warning','duplicate-concept',c.title,`also in ${seenTitle.get(key)}`);else seenTitle.set(key,c.category);
  if((c.summary||'').length<35)add('warning','short-content',c.title,'summary is shorter than 35 characters');
  if((c.internals||'').length<30)add('error','missing-internals',c.title,'internal operation is missing or too short');
  if(!c.sources?.length)add('error','missing-source',c.title,'source metadata is absent');
  for(const source of c.sources||[])try{new URL(source.url);}catch{add('error','broken-url',c.title,source.url);}
  if(c.comparison&&c.comparison.rows.some(row=>row.length!==c.comparison.headers.length))add('error','comparison-shape',c.title,'header/row column count differs');
  const token=[c.title,c.summary,c.internals].join(' ').match(/\S{55,}/g);if(token)add('warning','mobile-overflow-token',c.title,token[0]);
}
for(const q of questions){
  const normalized=String(q.q||q.question||'').replace(/\s+/g,' ').trim().toLowerCase();if(seenQ.has(normalized))add('error','duplicate-question',q.id,`same as ${seenQ.get(normalized)}`);else seenQ.set(normalized,q.id);
  if(new Set(q.options||[]).size!==(q.options||[]).length)add('error','duplicate-option',q.id,'option text repeats');
  const lengths=(q.options||[]).map(x=>x.length),max=Math.max(...lengths);answerLengths.push(lengths[q.answer]===max);
  if(!(q.tags||[]).length)add('warning','missing-tags',q.id,'no tags');
  if((q.optionReasons||[]).length!==4)add('error','missing-distractor-reason',q.id,'four option reasons required');
}
const longestRate=answerLengths.filter(Boolean).length/Math.max(answerLengths.length,1);if(longestRate>.55)add('warning','answer-length-bias','question-bank',`correct answer is longest in ${(longestRate*100).toFixed(1)}%`);
const report={generatedAt:new Date().toISOString(),counts:{questions:questions.length,concepts:concepts.length,errors:issues.filter(x=>x.severity==='error').length,warnings:issues.filter(x=>x.severity==='warning').length},checks:['template repetition','short concepts','internal operation','source metadata','URL syntax','duplicate questions/options','answer length bias','distractor reasons','category tags','comparison shape','mobile overflow tokens'],issues};
await mkdir(resolve(root,'reports'),{recursive:true});await writeFile(resolve(root,'reports/content-quality-report.json'),JSON.stringify(report,null,2));
await writeFile(resolve(root,'reports/content-quality-report.md'),`# Backend Atlas content quality report\n\nGenerated: ${report.generatedAt}\n\n- Questions: ${report.counts.questions}\n- Concepts: ${report.counts.concepts}\n- Errors: ${report.counts.errors}\n- Warnings: ${report.counts.warnings}\n\n## Findings\n\n${issues.slice(0,200).map(x=>`- **${x.severity} / ${x.type}** \`${x.id}\`: ${x.message}`).join('\n')||'- No findings'}\n`);
console.log(`Quality audit: ${report.counts.questions} questions, ${report.counts.concepts} concepts, ${report.counts.errors} errors, ${report.counts.warnings} warnings`);
