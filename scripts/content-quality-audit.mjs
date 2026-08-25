import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {JSDOM} from 'jsdom';

const root=resolve(import.meta.dirname,'..');
const dom=new JSDOM('<!doctype html>',{url:'https://audit.local',runScripts:'outside-only'});
for(const file of ['questions.js','question-expander.js','ax-question-extension.js','learning-os-data.js','atlas-content.js','curriculum-data.js']) dom.window.eval(await readFile(resolve(root,file),'utf8'));

const questions=dom.window.QUESTION_BANK||[];
const contract=dom.window.QUESTION_BANK_QUALITY_CONTRACT||{};
const curriculum=dom.window.ATLAS_CURRICULUM||{};
const concepts=Object.entries(curriculum).flatMap(([category,chapter])=>chapter.sections.flatMap(section=>section.concepts.map(concept=>({category,section:section.title,...concept}))));
const issues=[];
const add=(severity,type,id,message)=>issues.push({severity,type,id,message});
const seenQuestions=new Map();
const seenTitles=new Map();
const answerPositions=[0,0,0,0];
const validReviewStatuses=new Set(['draft','reviewed']);
const hasDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''));

for(const concept of concepts){
  const key=concept.title.trim().toLowerCase();
  if(seenTitles.has(key)) add('warning','duplicate-concept',concept.title,`also in ${seenTitles.get(key)}`);
  else seenTitles.set(key,concept.category);

  if(!validReviewStatuses.has(concept.reviewStatus)) add('error','invalid-review-status',concept.title,'reviewStatus must be draft or reviewed');
  if((concept.summary||'').length<35) add('warning','short-content',concept.title,'summary is shorter than 35 characters');
  if((concept.internals||'').length<30) add(concept.reviewStatus==='reviewed'?'error':'warning','missing-internals',concept.title,'internal operation is missing or too short');

  if(concept.reviewStatus==='reviewed'){
    if(!hasDate(concept.reviewedAt)) add('error','missing-reviewed-at',concept.title,'reviewed content requires reviewedAt');
    if(!concept.reviewerId) add('error','missing-reviewer',concept.title,'reviewed content requires a stable reviewerId');
    if(!concept.sources?.length) add('error','missing-direct-source',concept.title,'reviewed content requires a direct primary source');
    if(!Array.isArray(concept.tailAnswers)||concept.tailAnswers.length!==concept.tails?.length) add('error','tail-answer-mismatch',concept.title,'every follow-up requires a specific answer');
  }else if(!concept.sources?.length){
    add('warning','draft-without-source',concept.title,'draft remains excluded from verified learning until direct review');
  }

  for(const source of concept.sources||[]){
    try{const url=new URL(source.url);if(url.protocol!=='https:') throw new Error('HTTPS required');}
    catch{add('error','broken-url',concept.title,source.url||'missing URL');}
    if(concept.reviewStatus==='reviewed'&&source.sourceScope!=='direct') add('error','non-direct-source',concept.title,'reviewed concept sourceScope must be direct');
    if(concept.reviewStatus==='reviewed'&&!hasDate(source.checkedAt)) add('error','missing-source-check-date',concept.title,source.title||source.url);
  }

  if(concept.comparison&&concept.comparison.rows.some(row=>row.length!==concept.comparison.headers.length)) add('error','comparison-shape',concept.title,'header/row column count differs');
  const token=[concept.title,concept.summary,concept.internals].join(' ').match(/\S{55,}/g);
  if(token) add('warning','mobile-overflow-token',concept.title,token[0]);
}

for(const question of questions){
  const id=question.id||'unknown-question';
  const normalized=String(question.q||question.question||'').replace(/\s+/g,' ').trim().toLowerCase();
  if(seenQuestions.has(normalized)) add('error','duplicate-question',id,`same as ${seenQuestions.get(normalized)}`);
  else seenQuestions.set(normalized,id);

  if(question.reviewStatus!=='reviewed'||question.metadata?.reviewStatus!=='reviewed') add('error','unreviewed-public-question',id,'public bank accepts reviewed items only');
  if(!hasDate(question.reviewedAt)||!question.reviewerId||question.metadata?.reviewerId!==question.reviewerId) add('error','missing-question-provenance',id,'review date and stable reviewer must match metadata');
  if(!question.sources?.length) add('error','missing-question-source',id,'reviewed public question requires at least one direct source');
  for(const source of question.sources||[]){
    try{const url=new URL(source.url);if(url.protocol!=='https:') throw new Error('HTTPS required');}
    catch{add('error','broken-question-url',id,source.url||'missing URL');}
    if(source.sourceScope!=='direct'||!hasDate(source.checkedAt)) add('error','invalid-question-source',id,'source must be direct and include checkedAt');
  }

  if(!Array.isArray(question.options)||question.options.length!==4) add('error','invalid-option-count',id,'four options required');
  if(new Set(question.options||[]).size!==(question.options||[]).length) add('error','duplicate-option',id,'option text repeats');
  if(!Number.isInteger(question.answer)||question.answer<0||question.answer>=4) add('error','invalid-answer-index',id,'answer must point to one of four options');
  else answerPositions[question.answer]+=1;
  if(!(question.tags||[]).length) add('warning','missing-tags',id,'no tags');
  if((question.optionReasons||[]).length!==4) add('error','missing-distractor-reason',id,'four option reasons required');
  if((question.optionReasons||[]).some(reason=>String(reason).length<18||String(reason).includes('핵심 조건과 원리를 가장 정확하게'))) add('error','generic-distractor-reason',id,'every option needs concrete feedback');
  if(!Array.isArray(question.followUpAnswers)||question.followUpAnswers.length!==question.followUpQuestions?.length||question.followUpAnswers.some(answer=>String(answer).length<18)) add('error','missing-follow-up-answer',id,'every follow-up question needs a specific comparison answer');
  if(!question.objectiveId||!question.conceptId||!question.itemFamilyId) add('error','missing-assessment-trace',id,'objective, concept and item family IDs are required');
}

if(contract.mode!=='reviewed-only'||contract.publicQuestionCount!==questions.length) add('error','invalid-public-bank-contract','question-bank','reviewed-only contract must match the public bank');
if(!hasDate(contract.version)) add('error','invalid-quality-contract-version','question-bank','quality contract version must be a stable YYYY-MM-DD date');
if(questions.length&&Math.max(...answerPositions)/questions.length>.4) add('error','answer-position-bias','question-bank',`answer positions ${answerPositions.join('/')}`);
if(/[은을이]\((?:는|를|가)\)/.test(JSON.stringify({questions,curriculum}))) add('error','korean-particle-placeholder','public-content','Korean particle placeholders must be resolved before publication');

const errors=issues.filter(issue=>issue.severity==='error').length;
const warnings=issues.filter(issue=>issue.severity==='warning').length;
const generatedAt=hasDate(contract.version)?`${contract.version}T00:00:00.000Z`:'1970-01-01T00:00:00.000Z';
const report={
  generatedAt,
  counts:{questions:questions.length,concepts:concepts.length,reviewedConcepts:concepts.filter(concept=>concept.reviewStatus==='reviewed').length,draftConcepts:concepts.filter(concept=>concept.reviewStatus==='draft').length,errors,warnings},
  answerPositions,
  checks:['review status and provenance','direct primary sources','reviewed-only public bank','answer position balance','follow-up answer parity','template repetition','internal operation','URL syntax','duplicate questions/options','distractor reasons','assessment trace IDs','comparison shape','mobile overflow tokens'],
  issues
};

await mkdir(resolve(root,'reports'),{recursive:true});
await writeFile(resolve(root,'reports/content-quality-report.json'),`${JSON.stringify(report,null,2)}\n`);
await writeFile(resolve(root,'reports/content-quality-report.md'),`# Backend Atlas content quality report\n\nGenerated: ${report.generatedAt}\n\n- Questions: ${report.counts.questions}\n- Concepts: ${report.counts.concepts}\n- Reviewed concepts: ${report.counts.reviewedConcepts}\n- Draft concepts: ${report.counts.draftConcepts}\n- Answer positions: ${report.answerPositions.join(' / ')}\n- Errors: ${errors}\n- Warnings: ${warnings}\n\n## Findings\n\n${issues.slice(0,250).map(issue=>`- **${issue.severity} / ${issue.type}** \`${issue.id}\`: ${issue.message}`).join('\n')||'- No findings'}\n`);
console.log(`Quality audit: ${questions.length} questions, ${concepts.length} concepts, ${errors} errors, ${warnings} warnings`);
if(errors) process.exitCode=1;
