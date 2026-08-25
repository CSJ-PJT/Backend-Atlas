import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';

const root=resolve(import.meta.dirname,'..');
const assert=(condition,message)=>{if(!condition) throw new Error(message)};
const source=await readFile(resolve(root,'curriculum-data.js'),'utf8');
const html=await readFile(resolve(root,'index.html'),'utf8');
const dom=new JSDOM(html,{url:'https://backend-atlas.local/learn/',runScripts:'outside-only'});

for(const file of ['questions.js','question-expander.js','ax-question-extension.js','learning-os-data.js','atlas-content.js']){
  dom.window.eval(await readFile(resolve(root,file),'utf8'));
}
const generatedQuestionCount=dom.window.QUESTION_BANK.length;
dom.window.eval(source);

const bank=dom.window.QUESTION_BANK;
const curriculum=dom.window.ATLAS_CURRICULUM;
const contract=dom.window.QUESTION_BANK_QUALITY_CONTRACT;
const reviewManifest=dom.window.EDUCATION_REVIEW_MANIFEST;
const concepts=Object.values(curriculum).flatMap(chapter=>chapter.sections).flatMap(section=>section.concepts);
const byTitle=title=>concepts.find(concept=>concept.title===title);
const bTree=byTitle('B-Tree');
const servlet=byTitle('Servlet과 Container');
const arrayList=byTitle('ArrayList vs LinkedList');
const webStorage=byTitle('Web Storage API');
const publicText=JSON.stringify({bank,curriculum});
const normalize=value=>String(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}+#]+/gu,' ').trim();
const stable=value=>{
  if(Array.isArray(value)) return value.map(stable);
  if(value&&typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
  return value;
};
const sha256=value=>createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const questionReviewPayload=question=>({
  id:question.id,category:question.category,difficulty:question.difficulty,type:question.type,
  question:question.question,options:question.options,answer:question.answer,explanation:question.explanation,
  optionReasons:question.optionReasons,whyExplanation:question.whyExplanation,
  practicalScenario:question.practicalScenario,interviewPoint:question.interviewPoint,
  tags:question.tags||[],relatedTopics:question.relatedTopics||[],
  followUpQuestions:question.followUpQuestions,followUpAnswers:question.followUpAnswers,sources:question.sources
});
const conceptReviewPayload=concept=>({
  title:concept.title,summary:concept.summary,definition:concept.definition,why:concept.why,
  internals:concept.internals,pros:concept.pros,cons:concept.cons,practice:concept.practice,
  incident:concept.incident,interview:concept.interview,related:concept.related||[],aliases:concept.aliases||[],
  comparison:concept.comparison,tails:concept.tails,tailAnswers:concept.tailAnswers,sources:concept.sources
});

assert(generatedQuestionCount>=1000,'검수 전 생성 문항 수가 비정상적으로 작습니다.');
assert(contract?.mode==='reviewed-only','공개 문항은 reviewed-only 계약이어야 합니다.');
assert(contract.sourceQuestionCount===generatedQuestionCount,'검수 전 문항 수 provenance가 일치해야 합니다.');
assert(contract.publicQuestionCount===bank.length,'공개 문항 수 contract가 실제 bank와 일치해야 합니다.');
assert(contract.excludedUnreviewedCount===generatedQuestionCount-bank.length,'미검수 제외 수가 정확해야 합니다.');
assert(bank.length>=15&&bank.length<generatedQuestionCount/10,'공개 bank는 최소 검수 세트를 유지하며 생성 bank보다 충분히 작아야 합니다.');
assert(bank.every(question=>String(question.id).startsWith('quality-')),'공개 bank에는 명시적 검수 ID만 허용합니다.');
assert(bank.every(question=>question.reviewStatus==='reviewed'&&question.reviewedAt==='2026-08-25'),'모든 공개 문항에 검수 상태와 날짜가 필요합니다.');
assert(bank.every(question=>question.metadata?.source==='direct-source-reviewed'&&question.metadata?.reviewStatus==='reviewed'),'모든 공개 문항 metadata는 직접 출처 대조 provenance를 가져야 합니다.');
assert(bank.every(question=>question.reviewerId==='atlas-source-review'&&question.metadata?.reviewerId===question.reviewerId),'모든 공개 문항은 안정적인 출처 대조 검수 ID를 가져야 합니다.');
assert(!publicText.includes('expert-reviewed'),'인간 전문가 검수로 오해할 수 있는 provenance 문구를 사용하면 안 됩니다.');
assert(bank.every(question=>question.sources?.length&&question.sources.every(source=>source.sourceScope==='direct'&&source.checkedAt==='2026-08-25'&&source.url.startsWith('https://'))),'모든 공개 문항은 확인일이 있는 직접 HTTPS 출처를 가져야 합니다.');
assert(bank.every(question=>Array.isArray(question.options)&&question.options.length===4&&Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4),'모든 공개 문항은 유효한 4지선다와 정답 index를 가져야 합니다.');
assert(bank.every(question=>Array.isArray(question.optionReasons)&&question.optionReasons.length===4),'모든 공개 문항은 선택지별 feedback을 가져야 합니다.');
assert(bank.every(question=>question.optionReasons[question.answer].startsWith('정답')),'정답 이동 시 option feedback도 같은 위치로 이동해야 합니다.');
assert(bank.every(question=>question.optionReasons.every(reason=>reason.length>=18&&!reason.includes('핵심 조건과 원리를 가장 정확하게'))),'generic option feedback은 공개할 수 없습니다.');
assert(bank.every(question=>question.objectiveId&&question.conceptId&&question.itemFamilyId),'문항은 objective·concept·item family 추적 ID를 가져야 합니다.');
assert(bank.every(question=>question.q===question.question&&question.whyExplanation&&question.practicalScenario&&question.interviewPoint),'평가·해설·실무·면접 canonical feedback 계약이 완전해야 합니다.');
assert(bank.every(question=>question.practicalUse===question.practicalScenario&&question.interviewAnswer===question.interviewPoint),'legacy feedback alias는 canonical 값과 달라지면 안 됩니다.');
assert(bank.every(question=>Array.isArray(question.followUpQuestions)&&question.followUpQuestions.length>0),'모든 공개 문항은 후속 학습 질문을 가져야 합니다.');
assert(bank.every(question=>Array.isArray(question.followUpAnswers)&&question.followUpAnswers.length===question.followUpQuestions.length&&question.followUpAnswers.every(answer=>answer.length>=18)),'모든 후속 질문은 구체적인 비교 답안을 가져야 합니다.');
assert(bank.every(question=>question.followUpQuestions.length>=2&&question.followUpQuestions.length<=3),'모든 공개 문항은 서로 다른 관점을 묻는 2~3개의 꼬리질문을 가져야 합니다.');
assert(!bank.some(question=>question.followUpQuestions.some(item=>item.includes('관점에서 같은 선택을 다시 평가하면 무엇이 달라지는가'))),'관련 topic 이름만 끼운 자동 꼬리질문 template은 공개할 수 없습니다.');
assert(bank.every(question=>new Set(question.followUpQuestions.map(normalize)).size===question.followUpQuestions.length),'한 문항 안에서 꼬리질문이 반복되면 안 됩니다.');
assert(bank.every(question=>new Set(question.followUpAnswers.map(normalize)).size===question.followUpAnswers.length),'한 문항 안에서 꼬리질문 답안이 반복되면 안 됩니다.');
assert(bank.every(question=>!('company' in question.metadata)&&!('interviewFrequency' in question.metadata)&&!('importance' in question.metadata)),'회사·빈도·중요도 가짜 metadata를 공개 문항에 주입하면 안 됩니다.');
assert(new Set(bank.map(question=>normalize(question.question))).size===bank.length,'공개 문항 stem은 의미상 중복 없이 고유해야 합니다.');
const answerPositions=[0,1,2,3].map(index=>bank.filter(question=>question.answer===index).length);
assert(Math.max(...answerPositions)/bank.length<=0.4,`정답 위치 편향을 허용할 수 없습니다: ${answerPositions.join('/')}`);
assert(!bank.some(question=>/^(los-|curriculum-|ax-|scenario-)/.test(question.id)||/-v\d+$/.test(question.id)),'자동 확장 문항 ID는 공개 bank에 들어갈 수 없습니다.');
assert(!bank.some(question=>question.type==='code'&&!question.code),'code 문항에는 실행 또는 분석할 code가 필요합니다.');
assert(!bank.some(question=>question.type==='interview'&&!question.rubric),'interview 문항에는 평가 rubric이 필요합니다.');

const expectedCategories=['AI & Design','AX Scenario','Database','DevOps','Java & Spring','OS & Network','Web & React'];
assert(JSON.stringify([...new Set(bank.map(question=>question.category))].sort())===JSON.stringify(expectedCategories),'7개 학습 category마다 검수 문항이 있어야 합니다.');
assert(!/은\(는\)|을\(를\)|이\(가\)/.test(publicText),'조사 placeholder를 사용자에게 노출하면 안 됩니다.');
assert(!source.includes('domainDepth'),'category template로 개념별 depth를 덮어쓰면 안 됩니다.');
assert(!source.includes("['기초','면접','실무'][index%3]"),'순번 기반 난이도 생성은 금지합니다.');
assert(!source.includes('estimatedMinutes=concept.estimatedMinutes||8'),'모든 개념을 8분으로 자동 지정하면 안 됩니다.');
assert(!source.includes("importance=concept.importance||'높음'"),'모든 개념을 중요도 높음으로 자동 지정하면 안 됩니다.');
assert(concepts.filter(concept=>Object.hasOwn(concept,'estimatedMinutes')).length===2,'학습 시간은 근거가 있는 curated 개념에만 명시해야 합니다.');
assert(concepts.filter(concept=>Object.hasOwn(concept,'importance')).length===2,'중요도는 근거가 있는 curated 개념에만 명시해야 합니다.');
assert(concepts.every(concept=>['draft','reviewed'].includes(concept.reviewStatus)),'모든 개념은 draft 또는 reviewed 상태를 명시해야 합니다.');
assert(concepts.filter(concept=>concept.reviewStatus==='reviewed').length===4,'직접 출처 검수를 마친 네 개념만 reviewed여야 합니다.');
assert(concepts.filter(concept=>concept.reviewStatus==='draft').length===concepts.length-4,'나머지 개념은 명시적 draft여야 합니다.');
assert(JSON.stringify(concepts.filter(concept=>concept.reviewStatus==='reviewed').map(concept=>concept.title).sort())===JSON.stringify(['ArrayList vs LinkedList','B-Tree','Servlet과 Container','Web Storage API'].sort()),'reviewed allowlist가 의도치 않게 확장되면 안 됩니다.');
assert(concepts.filter(concept=>concept.reviewStatus==='reviewed').every(concept=>concept.reviewerId&&concept.sources?.length&&concept.sources.every(source=>source.sourceScope==='direct'&&source.url.startsWith('https://'))),'reviewed 개념은 검수자와 직접 HTTPS 출처가 필요합니다.');
assert(concepts.filter(concept=>concept.reviewStatus==='reviewed').every(concept=>concept.reviewerId==='atlas-source-review'&&concept.reviewRevision&&concept.claimScope),'reviewed 개념은 명시적 출처 대조 revision과 claim scope가 필요합니다.');
const genericReviewedFragments=['구현 선택의 비용과 실패 조건을 예측하고','문제에 맞게 적용하면 코드의 의도와 운영 기준이 명확해집니다','제약을 확인하지 않고 적용하면 복잡성과 유지 비용이 증가합니다','정의보다 해결하는 문제, 내부 원리'];
assert(concepts.filter(concept=>concept.reviewStatus==='reviewed').every(concept=>genericReviewedFragments.every(fragment=>!JSON.stringify(concept).includes(fragment))),'reviewed 개념은 자동 생성된 generic 설명을 포함하면 안 됩니다.');
assert(arrayList?.comparison?.headers?.includes('LinkedList')&&arrayList.internals.includes('상각 상수 시간')&&arrayList.cons.includes('외부 동기화'),'ArrayList 검수 개념은 공식 API의 구현·복잡도·동시성 계약을 구체적으로 설명해야 합니다.');
assert(webStorage?.comparison?.headers?.includes('sessionStorage')&&webStorage.internals.includes('QuotaExceededError')&&webStorage.cons.includes('locking'),'Web Storage 검수 개념은 local/session 범위와 quota·동시성 경계를 구체적으로 설명해야 합니다.');

const reviewedConcepts=concepts.filter(concept=>concept.reviewStatus==='reviewed');
assert(reviewManifest?.algorithm==='sha256'&&reviewManifest.canonicalization==='stable-json-v1'&&reviewManifest.schemaVersion===1,'교육 검수 manifest는 stable JSON SHA-256 schema v1이어야 합니다.');
assert(JSON.stringify(Object.keys(reviewManifest.questions).sort())===JSON.stringify(bank.map(question=>question.id).sort()),'문항 검수 manifest allowlist와 공개 bank가 정확히 일치해야 합니다.');
assert(JSON.stringify(Object.keys(reviewManifest.concepts).sort())===JSON.stringify(reviewedConcepts.map(concept=>concept.title).sort()),'개념 검수 manifest allowlist와 reviewed 개념이 정확히 일치해야 합니다.');
for(const question of bank){
  const evidence=reviewManifest.questions[question.id];
  assert(evidence.reviewedAt===question.reviewedAt&&evidence.reviewerId===question.reviewerId&&evidence.reviewRevision===question.reviewRevision&&evidence.claimScope===question.claimScope,`${question.id} 검수 metadata와 manifest가 일치해야 합니다.`);
  assert(/^[a-f0-9]{64}$/.test(evidence.contentSha256),`${question.id}에는 유효한 SHA-256 content hash가 필요합니다.`);
  assert(evidence.contentSha256===sha256(questionReviewPayload(question)),`${question.id} 콘텐츠가 검수된 hash에서 변경됐습니다.`);
}
for(const concept of reviewedConcepts){
  const evidence=reviewManifest.concepts[concept.title];
  assert(evidence.reviewedAt===concept.reviewedAt&&evidence.reviewerId===concept.reviewerId&&evidence.reviewRevision===concept.reviewRevision&&evidence.claimScope===concept.claimScope,`${concept.title} 검수 metadata와 manifest가 일치해야 합니다.`);
  assert(/^[a-f0-9]{64}$/.test(evidence.contentSha256),`${concept.title}에는 유효한 SHA-256 content hash가 필요합니다.`);
  assert(evidence.contentSha256===sha256(conceptReviewPayload(concept)),`${concept.title} 콘텐츠가 검수된 hash에서 변경됐습니다.`);
}

assert(bTree?.reviewStatus==='reviewed','B-Tree 개념은 명시적으로 검수되어야 합니다.');
assert(['separator key','child downlink','leaf tuple','heap TID','page split'].every(term=>bTree.internals.includes(term)),'B-Tree 내부 동작에 page 탐색과 split 설명이 필요합니다.');
assert(bTree.definition.includes('range')&&bTree.definition.includes('ORDER BY'),'B-Tree 정의는 range와 정렬 사용 사례를 포함해야 합니다.');
assert(bTree.tails.length===3&&bTree.tailAnswers.length===bTree.tails.length,'B-Tree 꼬리질문마다 구체 답안이 필요합니다.');
assert(bTree.sources.some(item=>item.url==='https://www.postgresql.org/docs/current/btree.html'),'B-Tree는 PostgreSQL 공식 원문을 직접 인용해야 합니다.');
assert(bank.filter(question=>question.tags?.includes('B-Tree')).length>=2,'B-Tree는 원리와 운영 비용을 별도 문항으로 평가해야 합니다.');

assert(servlet?.reviewStatus==='reviewed','Servlet 개념은 명시적으로 검수되어야 합니다.');
assert(['Servlet','HttpServlet','init','service','destroy','filter chain','instance field'].every(term=>`${servlet.definition} ${servlet.internals}`.includes(term)),'Servlet 내용은 계약·생명주기·filter·동시성 경계를 포함해야 합니다.');
assert(servlet.tails.length===3&&servlet.tailAnswers.length===servlet.tails.length,'Servlet 꼬리질문마다 구체 답안이 필요합니다.');
assert(servlet.sources.some(item=>item.url.includes('jakarta.ee/specifications/servlet/6.1')),'Servlet은 Jakarta Servlet 6.1 공식 원문을 직접 인용해야 합니다.');
assert(bank.filter(question=>question.tags?.includes('Servlet')).length>=2,'Servlet은 책임 구분과 concurrent state 사고를 별도 문항으로 평가해야 합니다.');

assert(bTree.internals!==byTitle('MVCC')?.internals,'B-Tree와 MVCC가 category 공통 내부 설명을 공유하면 안 됩니다.');
assert(servlet.internals!==byTitle('DispatcherServlet')?.internals,'Servlet과 DispatcherServlet이 공통 내부 설명을 공유하면 안 됩니다.');

dom.window.eval(await readFile(resolve(root,'learning-os.js'),'utf8'));
const categoryValues=[...dom.window.document.getElementById('categoryFilter').options].map(option=>option.value).filter(Boolean).sort();
assert(JSON.stringify(categoryValues)===JSON.stringify(expectedCategories),'분야 필터에는 공개 bank의 7개 category가 실제 option으로 생성되어야 합니다.');
assert(dom.window.searchKnowledge('',{category:'',difficulty:'',tag:'',scenario:true,wrong:false}).length===bank.length,'canonical practicalScenario가 있는 모든 문항은 실무 시나리오 필터에서 검색되어야 합니다.');
for(const question of bank){
  const whyHost=dom.window.document.createElement('div');
  whyHost.innerHTML=dom.window.renderAtlasWhy(question);
  assert([...whyHost.querySelectorAll('.study-detail > p')].slice(0,6).every(node=>node.textContent.trim().length>0),`${question.id} Why 6개 축은 빈 설명을 만들면 안 됩니다.`);
}

dom.window.renderKnowledgeSearch('RAG');
const rag=byTitle('RAG');
assert(dom.window.document.querySelector('#knowledgeSummary .content-status-badge--draft')?.textContent.includes('초안'),'기존 draft 개념은 관련 reviewed 문항이 있어도 draft여야 합니다.');
assert(dom.window.document.querySelector('#knowledgeSummary .encyclopedia-definition')?.textContent.includes(rag.definition.slice(0,50)),'검색 백과는 draft 개념 자신의 정의를 유지해야 합니다.');
assert(dom.window.document.querySelector('#knowledgeResults [data-question-id="quality-ai-rag"]'),'reviewed RAG 문항은 별도 관련 학습 자료로 남아야 합니다.');
assert(dom.window.document.getElementById('interviewSection').textContent.trim()==='','draft 개념에 reviewed 문항의 답변을 검수 답안처럼 섞으면 안 됩니다.');
assert(dom.window.document.getElementById('learningPath').textContent.trim()==='','draft 개념에 검수 학습 경로를 붙이면 안 됩니다.');

const malformedDom=new JSDOM(html,{url:'https://backend-atlas.local/learn/#search/%E0%A4%A',runScripts:'outside-only'});
for(const file of ['questions.js','question-expander.js','ax-question-extension.js','learning-os-data.js','atlas-content.js','curriculum-data.js','learning-os.js']){
  malformedDom.window.eval(await readFile(resolve(root,file),'utf8'));
}
assert(malformedDom.window.document.getElementById('knowledgeView'),'malformed search hash에서도 학습 UI가 부팅되어야 합니다.');

console.log(`Education quality contract passed: ${bank.length} reviewed questions from ${generatedQuestionCount}; B-Tree and Servlet curated.`);
