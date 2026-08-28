import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {JSDOM} from 'jsdom';

const root=resolve(import.meta.dirname,'..');
const html=await readFile(resolve(root,'index.html'),'utf8');
const scripts=['questions.js','question-expander.js','ax-question-extension.js','learning-os-data.js','atlas-content.js','curriculum-data.js','developer-guide-data.js','learning-visuals.js','subjective-questions.js','app.js','learning-os.js'];
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

async function boot(url='https://runtime.local/learn/#home',beforeScripts=()=>{}){
  const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});
  dom.window.scrollTo=()=>{};
  dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  beforeScripts(dom.window);
  const sources=await Promise.all(scripts.map(file=>readFile(resolve(root,file),'utf8')));
  for(const source of sources)dom.window.eval(source);
  await new Promise(resolvePromise=>setTimeout(resolvePromise,0));
  return dom;
}

async function bootWithDelayedSearchModule(url){
  const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});
  dom.window.scrollTo=()=>{};
  dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  const coreScripts=scripts.filter(file=>file!=='learning-os.js');
  const sources=await Promise.all(coreScripts.map(file=>readFile(resolve(root,file),'utf8')));
  for(const source of sources)dom.window.eval(source);
  await new Promise(resolvePromise=>setTimeout(resolvePromise,0));
  dom.window.eval(await readFile(resolve(root,'learning-os.js'),'utf8'));
  await new Promise(resolvePromise=>setTimeout(resolvePromise,0));
  return dom;
}

async function bootWithoutCurriculum(url='https://runtime.local/learn/#home'){
  const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});
  dom.window.scrollTo=()=>{};
  dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  const incompleteScripts=scripts.filter(file=>file!=='curriculum-data.js');
  const sources=await Promise.all(incompleteScripts.map(file=>readFile(resolve(root,file),'utf8')));
  for(const source of sources)dom.window.eval(source);
  await new Promise(resolvePromise=>setTimeout(resolvePromise,0));
  return dom;
}

const dom=await boot('https://runtime.local/learn/#search/B-Tree',window=>{
  window.localStorage.setItem('interviewDeck','{broken');
  window.localStorage.setItem('backendAtlasLearningState','{broken');
});
const {document,localStorage}=dom.window;

assert(!localStorage.getItem('interviewDeck'),'corrupt quiz storage must be removed without blocking boot');
assert(!localStorage.getItem('backendAtlasLearningState'),'corrupt learning storage must be removed without blocking boot');
assert(document.getElementById('knowledgeView').classList.contains('active'),'search deep link must restore the search view');
assert(document.getElementById('knowledgeSearchInput').value==='B-Tree','search deep link must restore its query');
const bTreeTitle=document.querySelector('.encyclopedia-card h2')?.textContent;
assert(bTreeTitle==='B-Tree',`B-Tree must resolve to the canonical concept (received: ${bTreeTitle||'none'})`);
assert(document.querySelector('.encyclopedia-definition')?.textContent.includes('균형'),'B-Tree search must show its verified structure');
assert(document.querySelector('.content-status-badge--reviewed')?.textContent.includes('검수 완료'),'reviewed search content must expose its provenance');
assert(!document.querySelector('.encyclopedia-card')?.textContent.includes('snapshot·WAL·lock의 순서'),'B-Tree must not inherit database-wide template claims');

const delayedSearchDom=await bootWithDelayedSearchModule('https://runtime.local/learn/#search/Servlet%EA%B3%BC%20Container');
assert(delayedSearchDom.window.document.querySelector('.encyclopedia-card h2')?.textContent==='Servlet과 Container','search deep links must recover even when the search module loads after the route timer');

const emptySearchDom=await boot('https://runtime.local/learn/#search');
const emptySearchSummary=emptySearchDom.window.document.getElementById('knowledgeSummary');
assert(emptySearchSummary.querySelector('.encyclopedia-card h2')?.textContent==='백엔드 지식 백과','empty search must render a neutral search guide');
assert(emptySearchSummary.querySelector('.content-status-badge')?.textContent==='검색 안내','empty search must not claim reviewed provenance');
assert(!emptySearchSummary.textContent.includes('RAG 파이프라인'),'empty search must not borrow the first reviewed question as an encyclopedia summary');
assert(!emptySearchDom.window.document.getElementById('learningPath').textContent.trim(),'empty search must not fabricate a learning path from the first result');

const directSearchBackDom=await boot('https://runtime.local/learn/#search/B-Tree');
directSearchBackDom.window.document.getElementById('knowledgeBackBtn').click();
assert(directSearchBackDom.window.document.getElementById('homeView').classList.contains('active'),'direct search back must fall back to home when there is no previous SPA route');
assert(directSearchBackDom.window.location.hash==='#home','direct search back fallback must restore the canonical home URL');

const subjectiveDom=await boot('https://runtime.local/learn/#home');
const subjectiveDocument=subjectiveDom.window.document;
subjectiveDocument.getElementById('navInterviewBtn').click();
assert(subjectiveDocument.getElementById('subjectiveView').classList.contains('active'),'subjective navigation must open the anonymous writing practice');
assert(subjectiveDocument.getElementById('subjectiveQuestion').textContent.trim().length>10,'subjective practice must render a reviewed question');
subjectiveDocument.getElementById('subjectiveAnswer').value='핵심 원리와 선택 기준, 실패 조건을 순서대로 설명합니다.';
subjectiveDocument.getElementById('subjectiveRevealBtn').click();
assert(!subjectiveDocument.getElementById('subjectiveGuide').hidden,'subjective guide must require and then reveal after an original response');
assert(subjectiveDocument.querySelectorAll('#subjectiveOutline li').length>=2,'subjective guide must provide a useful answer outline');

const directArchitectureBackDom=await boot('https://runtime.local/learn/#architecture');
directArchitectureBackDom.window.document.getElementById('architectureBackBtn').click();
assert(directArchitectureBackDom.window.document.getElementById('homeView').classList.contains('active'),'direct architecture back must fall back to home when there is no previous SPA route');

const directStudyBackDom=await boot('https://runtime.local/learn/#study-category/Database');
directStudyBackDom.window.document.getElementById('studyBackBtn').click();
assert(directStudyBackDom.window.document.getElementById('homeView').classList.contains('active'),'direct study back must fall back to home when there is no previous SPA route');

const brandHomeDom=await boot('https://runtime.local/learn/#search/B-Tree');
brandHomeDom.window.document.querySelector('.brand').click();
assert(brandHomeDom.window.document.getElementById('homeView').classList.contains('active'),'brand control must navigate to the home view from search');
assert(brandHomeDom.window.location.hash==='#home','brand control must use the canonical home route');

for(const invalidUrl of [
  'https://runtime.local/learn/#concept/Database/999/999',
  'https://runtime.local/learn/#concept/Removed%20Category/0/0',
  'https://runtime.local/learn/#concept/Database//0',
  'https://runtime.local/learn/#view/finalScore',
  'https://runtime.local/learn/#concept/Database/%E0%A4%A/0'
]){
  const invalidRouteDom=await boot(invalidUrl);
  assert(invalidRouteDom.window.document.getElementById('homeView').classList.contains('active'),`invalid concept route must fall back to home (${invalidUrl})`);
  assert(invalidRouteDom.window.location.hash==='#home',`invalid concept route must be replaced with a canonical home URL (${invalidUrl})`);
}

const invalidHistoryDom=await boot('https://runtime.local/learn/#home',window=>{
  window.localStorage.setItem('backendAtlasQuizHistory',JSON.stringify({not:'an array'}));
});
assert(!invalidHistoryDom.window.localStorage.getItem('backendAtlasQuizHistory'),'quiz history with the wrong root schema must be discarded');

const wrongSchemaDom=await boot('https://runtime.local/learn/#home',window=>{
  window.localStorage.setItem('interviewDeck',JSON.stringify({wrong:{bad:true},categoryStats:[]}));
});
let wrongSchemaResults;
try{wrongSchemaResults=wrongSchemaDom.window.searchKnowledge('B-Tree');}
catch(error){throw new Error(`valid JSON with malformed wrong/categoryStats fields must not break search: ${error.message}`);}
assert(wrongSchemaResults.length>0,'search must remain usable after malformed stored learning fields are normalized');

const inflatedStatsDom=await boot('https://runtime.local/learn/#home',window=>{
  window.localStorage.setItem('interviewDeck',JSON.stringify({solved:1,correct:999,wrong:['not-a-real-question'],categoryStats:{Injected:{solved:3,correct:999},Database:{solved:3,correct:999}}}));
});
assert(inflatedStatsDom.window.document.getElementById('rateStat').textContent==='100%','overall correct count must be clamped to solved count');
assert(!inflatedStatsDom.window.document.getElementById('weakArea').textContent.includes('Injected'),'unknown stored categories must never appear as a learning weakness');
assert(!inflatedStatsDom.window.document.getElementById('recommendation').textContent.includes('33300%'),'stored category accuracy must never exceed 100%');
assert(inflatedStatsDom.window.searchKnowledge('',{category:'',difficulty:'',tag:'',scenario:false,wrong:true}).length===0,'unknown stored question IDs must be removed from wrong-answer filtering');

const missingCurriculumDom=await bootWithoutCurriculum();
assert(missingCurriculumDom.window.EDUCATION_RELEASE_VALID===false,'missing curriculum contract must fail closed');
assert(missingCurriculumDom.window.QUESTION_BANK.length===0,'generated source questions must not remain public when the reviewed contract is missing');
assert(!missingCurriculumDom.window.document.getElementById('educationContractError').hidden,'missing curriculum contract must render a visible recovery state');
assert(missingCurriculumDom.window.document.getElementById('bulkBtn').disabled,'missing curriculum contract must disable quiz entry actions');
assert(!missingCurriculumDom.window.document.getElementById('quizView').classList.contains('active'),'missing curriculum contract must not open a generated quiz');

const unreadableStorageDom=await boot();
Object.getPrototypeOf(unreadableStorageDom.window.localStorage).getItem=function(){
  throw new unreadableStorageDom.window.DOMException('storage unavailable','SecurityError');
};
Object.getPrototypeOf(unreadableStorageDom.window.localStorage).removeItem=function(){
  throw new unreadableStorageDom.window.DOMException('storage unavailable','SecurityError');
};
let unreadableStorageResults;
try{unreadableStorageResults=unreadableStorageDom.window.searchKnowledge('B-Tree');}
catch(error){throw new Error(`storage read failure must not break search: ${error.message}`);}
assert(unreadableStorageResults.length>0,'search must remain usable when browser storage access is denied');

const storedXss='<img id="stored-xss" src="x" onerror="globalThis.__storedXss=true">';
const storageBoundaryDom=await boot('https://runtime.local/learn/#home',window=>{
  window.localStorage.setItem('interviewDeck',JSON.stringify({
    solved:'not-a-number',correct:99,wrong:{bad:true},daily:[],categoryStats:'bad'
  }));
  window.localStorage.setItem('backendAtlasLearningState',JSON.stringify({saved:{bad:true},review:'bad',completed:[],ui:[]}));
  window.localStorage.setItem('backendAtlasQuizHistory',JSON.stringify([{
    quizSessionId:'stored-xss-probe',quizMode:storedXss,questionIds:[],archivedAt:'2026-08-25T00:00:00.000Z'
  }]));
});
assert(storageBoundaryDom.window.document.getElementById('solvedStat').textContent==='0','invalid stored counters must normalize to zero');
assert(!storageBoundaryDom.window.document.getElementById('stored-xss'),'stored quiz labels must never become executable markup');
assert(storageBoundaryDom.window.document.getElementById('recentLearningList').textContent.includes(storedXss),'stored labels may render only as text after escaping');
assert(storageBoundaryDom.window.__storedXss!==true,'stored event handlers must never execute');

const unavailableStorageDom=await boot();
Object.getPrototypeOf(unavailableStorageDom.window.localStorage).setItem=function(){
  throw new unavailableStorageDom.window.DOMException('storage unavailable','QuotaExceededError');
};
const storageQuestion=unavailableStorageDom.window.QUESTION_BANK[0];
try{unavailableStorageDom.window.startBackendAtlasQuestion(storageQuestion.id);}
catch(error){throw new Error(`storage write failure must not block starting a quiz: ${error.message}`);}
assert(unavailableStorageDom.window.document.getElementById('quizView').classList.contains('active'),'quiz view must remain active when persistence is unavailable');
assert(unavailableStorageDom.window.document.getElementById('questionText').textContent===storageQuestion.question,'question must render when persistence is unavailable');
unavailableStorageDom.window.document.querySelector(`.option[data-index="${storageQuestion.answer}"]`).click();
assert(!unavailableStorageDom.window.document.getElementById('answerPanel').hidden,'answer feedback must render when persistence is unavailable');
assert(unavailableStorageDom.window.document.getElementById('appStatus').textContent.includes('저장할 수 없습니다'),'storage failure must be announced through the live status region');

const stalePopStateDom=await boot();
stalePopStateDom.window.dispatchEvent(new stalePopStateDom.window.PopStateEvent('popstate',{state:{route:'concept',category:'Database',sectionIndex:99,conceptIndex:99}}));
assert(stalePopStateDom.window.document.getElementById('homeView').classList.contains('active'),'stale concept history state must fall back to home');
assert(stalePopStateDom.window.location.hash==='#home','stale concept history state must replace the URL with home');
stalePopStateDom.window.dispatchEvent(new stalePopStateDom.window.PopStateEvent('popstate',{state:{route:'project',project:'removed-project'}}));
assert(stalePopStateDom.window.document.getElementById('homeView').classList.contains('active'),'stale project history state must fall back to home');

document.getElementById('knowledgeSearchInput').value='검증되지않은가상용어';
document.getElementById('knowledgeSearchForm').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
assert(document.querySelector('.no-verified-entry'),'unknown terms must render an honest no-content state');
assert(!document.querySelector('.encyclopedia-card'),'unknown terms must not receive a fabricated encyclopedia card');

const draftSearchDom=await boot('https://runtime.local/learn/#search/ClassLoader');
assert(draftSearchDom.window.document.querySelector('.content-status-badge--draft')?.textContent.includes('초안'),'draft search content must be labelled as draft');
assert(draftSearchDom.window.document.querySelector('.draft-content-notice'),'draft search content must explain its evidence limit');
assert(!draftSearchDom.window.document.getElementById('interviewSection').textContent.includes('모범 답안'),'draft search content must not present a model answer');

const draftDetailDom=await boot('https://runtime.local/learn/#concept/Java%20%26%20Spring/0/0');
assert(draftDetailDom.window.document.querySelector('.concept-detail .content-status-badge--draft'),'draft concept detail must show a visible status badge');
assert(draftDetailDom.window.document.querySelector('.concept-detail .draft-content-notice'),'draft concept detail must show a prominent notice');
assert(draftDetailDom.window.document.getElementById('reviewConcept').disabled,'draft concepts must not be recorded as reviewed learning');
assert(!draftDetailDom.window.document.querySelector('[data-recall-grade]'),'draft concepts must not offer spaced-review grading against an unverified answer');
assert(draftDetailDom.window.document.getElementById('conceptQuiz').disabled,'concepts with no reviewed assessment must not expose a dead-end quiz action');
assert(draftDetailDom.window.document.getElementById('conceptQuiz').textContent.includes('준비 중'),'unavailable concept assessment must explain that it is still being prepared');
draftDetailDom.window.document.getElementById('recallAnswer').value='초안인 동안에도 내 설명을 먼저 적고 비교문을 확인하는 연습은 할 수 있습니다.';
draftDetailDom.window.document.getElementById('revealRecall').click();
assert(!draftDetailDom.window.document.getElementById('recallReference').hidden,'draft recall must still reveal the explicitly labelled comparison text after an attempt');
assert(draftDetailDom.window.document.getElementById('recallStatus').textContent.includes('기록하지 않습니다'),'draft recall must explain that completion and review intervals are not recorded');
assert(!draftDetailDom.window.document.getElementById('recallStatus').textContent.includes('복습 간격을 선택하세요'),'draft recall must not direct the learner to a removed grading control');
assert(!draftDetailDom.window.localStorage.getItem('backendAtlasLearningState'),'revealing a draft comparison must not persist a completion record');

document.getElementById('navStudyBtn').click();
const databaseCard=[...document.querySelectorAll('[data-curriculum]')].find(node=>node.dataset.curriculum==='Database');
databaseCard.click();
const databaseConcepts=dom.window.ATLAS_CURRICULUM.Database.sections.flatMap(section=>section.concepts);
const databaseReviewedCount=databaseConcepts.filter(concept=>concept.reviewStatus==='reviewed').length;
const databaseDraftCount=databaseConcepts.length-databaseReviewedCount;
const reviewSummary=document.querySelector('.curriculum-review-summary');
assert(reviewSummary?.textContent.includes(`검수 완료 ${databaseReviewedCount}`),'category header must expose its reviewed concept count before selection');
assert(reviewSummary?.textContent.includes(`초안 ${databaseDraftCount}`),'category header must expose its draft concept count before selection');
const databaseDifficultyCounts=Object.fromEntries(['easy','medium','hard'].map(level=>[level,dom.window.QUESTION_BANK.filter(question=>question.category==='Database'&&(question.difficulty||question.level)===level).length]));
for(const [level,count] of Object.entries(databaseDifficultyCounts)){
  const button=document.querySelector(`[data-level="${level}"]`);
  assert(Boolean(button?.disabled)===!count,`${level} difficulty availability must match its reviewed question count`);
  assert(button?.getAttribute('aria-disabled')===String(!count),`${level} difficulty must expose its availability to assistive technology`);
  assert(button?.textContent.includes(count?`${count}문제`:'준비 중'),`${level} difficulty must display an honest reviewed question count`);
}
const chapterButtons=[...document.querySelectorAll('[data-chapter-quiz]')];
const databaseSections=dom.window.ATLAS_CURRICULUM.Database.sections;
const expectedChapterCounts=databaseSections.map(section=>{
  const targets=new Set(section.concepts.flatMap(concept=>[concept.title,...(concept.related||[])]).map(value=>String(value).toLowerCase()));
  return dom.window.QUESTION_BANK.filter(question=>question.category==='Database'&&[...(question.tags||[]),...(question.relatedTopics||[])].some(value=>targets.has(String(value).toLowerCase()))).length;
});
chapterButtons.forEach((button,index)=>{
  const count=expectedChapterCounts[index];
  assert(Boolean(button.disabled)===!count,`chapter ${index} availability must match its reviewed question count`);
  assert(button.getAttribute('aria-disabled')===String(!count),`chapter ${index} must expose its availability to assistive technology`);
  assert(button.textContent.includes(count?`${count}문제`:'준비 중'),`chapter ${index} must display an honest reviewed question count`);
});
const bTreeButton=[...document.querySelectorAll('.concept-row')].find(node=>node.textContent.includes('B-Tree'));
const transactionButton=[...document.querySelectorAll('.concept-row')].find(node=>node.querySelector('strong')?.textContent==='Transaction');
assert(bTreeButton?.dataset.reviewStatus==='reviewed'&&bTreeButton.textContent.includes('검수 완료'),'reviewed concept rows must expose a visible and machine-readable status');
assert(transactionButton?.dataset.reviewStatus==='draft'&&transactionButton.textContent.includes('초안'),'draft concept rows must expose a visible and machine-readable status');
bTreeButton.click();
const bTreeQuizCount=dom.window.QUESTION_BANK.filter(question=>question.category==='Database'&&(question.tags||[]).some(tag=>String(tag).toLowerCase()==='b-tree')).length;
assert(!document.getElementById('conceptQuiz').disabled,'a concept with reviewed assessments must keep its quiz action enabled');
assert(document.getElementById('conceptQuiz').textContent.includes(`${bTreeQuizCount}문제`),'concept quiz action must show its reviewed assessment count');
assert(document.querySelector('[role="tablist"]'),'concept sections must expose tab semantics');
assert(document.querySelectorAll('[role="tab"]').length===5,'all concept tabs must expose tab roles');
assert(document.getElementById('recallCheck'),'concept learning must include active recall');
assert(document.getElementById('recallReference').hidden,'reference answer must be hidden before an attempt');
document.getElementById('recallAnswer').value='짧음';
document.getElementById('revealRecall').click();
assert(document.getElementById('recallReference').hidden,'short responses must not unlock the reference answer');
document.getElementById('recallAnswer').value='정렬된 separator key를 따라 leaf까지 내려가고 key와 row reference를 확인합니다.';
document.getElementById('revealRecall').click();
assert(!document.getElementById('recallReference').hidden,'a substantive recall attempt must reveal comparison criteria');
document.querySelector('[data-recall-grade="good"]').click();
const learning=JSON.parse(localStorage.getItem('backendAtlasLearningState'));
const completion=Object.values(learning.completed)[0];
assert(completion?.grade==='good'&&completion?.attempts===1,'recall grade and attempt count must persist');
const intervalDays=(new Date(completion.reviewAt)-new Date(completion.lastReviewedAt))/86400000;
assert(intervalDays===7,'good recall must schedule a seven-day review');

document.querySelector('[data-tab="interview"]').click();
const tailAnswers=[...document.querySelectorAll('.tail-card details p')].map(node=>node.textContent.trim());
assert(tailAnswers.length===3&&new Set(tailAnswers).size===3,'each B-Tree follow-up must have a distinct answer');

const quizDom=await boot();
quizDom.window.startBackendAtlasQuestion('quality-db-btree-descent');
quizDom.window.document.querySelector('.option[data-index="1"]').click();
quizDom.window.document.getElementById('nextBtn').click();
assert(quizDom.window.document.getElementById('finalScore').textContent==='0','single-question failure must report the actual score');
assert(quizDom.window.document.getElementById('finalTotal').textContent==='/ 1','result denominator must match the actual session size');
assert(quizDom.window.document.getElementById('resultMessage').textContent.includes('오답 복습'),'zero percent must use the low-score guidance');
assert(!quizDom.window.document.getElementById('retryWrongBtn').disabled,'wrong result must enable retry');
quizDom.window.document.getElementById('retryWrongBtn').click();
assert(quizDom.window.document.getElementById('answerPanel').hidden,'retry must start with the answer hidden');
assert([...quizDom.window.document.querySelectorAll('.option')].every(option=>!option.disabled),'retry options must be enabled');

const perfectQuizDom=await boot();
const perfectQuestion=perfectQuizDom.window.QUESTION_BANK.find(question=>question.id==='quality-db-btree-descent');
perfectQuizDom.window.startBackendAtlasQuestion(perfectQuestion.id);
perfectQuizDom.window.document.querySelector(`.option[data-index="${perfectQuestion.answer}"]`).click();
perfectQuizDom.window.document.getElementById('nextBtn').click();
assert(perfectQuizDom.window.document.getElementById('finalScore').textContent==='1','single-question success must report the actual score');
assert(perfectQuizDom.window.document.getElementById('finalTotal').textContent==='/ 1','single-question success must retain the actual denominator');
assert(perfectQuizDom.window.document.getElementById('resultMessage').textContent.includes('안정적'),'an 80% or better result must use positive guidance regardless of session length');

console.log('Learning runtime PASS: schema boundaries, XSS escaping, safe deep links, active recall, dynamic scoring, follow-ups, and retry');
