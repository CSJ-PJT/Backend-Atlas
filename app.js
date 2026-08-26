const $ = id => document.getElementById(id);
const initialBank = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];
const educationContract = window.QUESTION_BANK_QUALITY_CONTRACT;
const educationManifest = window.EDUCATION_REVIEW_MANIFEST;
const educationContractValid = Boolean(
  educationContract?.mode === 'reviewed-only' &&
  Number.isInteger(educationContract.publicQuestionCount) &&
  educationContract.publicQuestionCount === initialBank.length &&
  initialBank.length > 0 &&
  window.ATLAS_CURRICULUM && typeof window.ATLAS_CURRICULUM === 'object' &&
  educationManifest?.algorithm === 'sha256' &&
  educationManifest?.canonicalization === 'stable-json-v1' &&
  educationManifest?.schemaVersion === 1 &&
  Object.keys(educationManifest.questions || {}).length === initialBank.length &&
  initialBank.every(question =>
    question?.reviewStatus === 'reviewed' &&
    question?.metadata?.source === 'direct-source-reviewed' &&
    educationManifest.questions?.[question.id] &&
    Array.isArray(question.sources) &&
    question.sources.length > 0 &&
    question.sources.every(source => source?.sourceScope === 'direct' && /^https:\/\//.test(source.url || ''))
  )
);
if(!educationContractValid) window.QUESTION_BANK=[];
window.EDUCATION_RELEASE_VALID=educationContractValid;
const bank = window.QUESTION_BANK;
const knownQuestionIds=new Set(bank.map(question=>question.id));
const knownCategories=new Set(bank.map(question=>question.category));
const state = { session: [], index: 0, score: 0, answers: [], mode: 'all', count: 10 };
const SESSION_KEY='backendAtlasQuizSession';
const HISTORY_KEY='backendAtlasQuizHistory';
const LEARNING_KEY='backendAtlasLearningState';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const safeString=(value,fallback='',maxLength=180)=>typeof value==='string'?value.slice(0,maxLength):fallback;
const safeInteger=(value,fallback=0)=>Number.isInteger(value)&&value>=0?value:fallback;
const safeStringList=(value,maxItems=5000)=>Array.isArray(value)?[...new Set(value.filter(item=>typeof item==='string').map(item=>item.slice(0,180)))].slice(0,maxItems):[];
const safeIso=value=>typeof value==='string'&&!Number.isNaN(Date.parse(value))?value:undefined;
const isConceptId=value=>typeof value==='string'&&/^[^:]{1,80}:\d+:\d+$/.test(value);
function discardStoredValue(key){try{localStorage.removeItem(key);}catch{}}
function reportStorageFailure(){
  const status=$('appStatus');
  if(status)status.textContent='이 브라우저에서 학습 기록을 저장할 수 없습니다. 현재 학습은 계속할 수 있지만 새로고침하면 기록이 사라질 수 있습니다.';
}
function writeStoredJson(key,value){
  try{
    localStorage.setItem(key,JSON.stringify(value));
    return true;
  }catch{
    reportStorageFailure();
    return false;
  }
}
function readStoredJson(key,fallback){
  const copy=()=>typeof structuredClone==='function'?structuredClone(fallback):JSON.parse(JSON.stringify(fallback));
  try{
    const raw=localStorage.getItem(key);
    if(!raw) return copy();
    const parsed=JSON.parse(raw);
    return parsed&&typeof parsed==='object'?parsed:copy();
  }catch{
    discardStoredValue(key);
    return copy();
  }
}
function normalizeSaved(value){
  const source=isRecord(value)?value:{};
  const daily={};
  if(isRecord(source.daily))for(const [day,count] of Object.entries(source.daily))if(/^\d{4}-\d{2}-\d{2}$/.test(day))daily[day]=safeInteger(count);
  const categoryStats={};
  if(isRecord(source.categoryStats))for(const [category,entry] of Object.entries(source.categoryStats))if(knownCategories.has(category)&&isRecord(entry)){
    const solved=safeInteger(entry.solved);
    categoryStats[category]={solved,correct:Math.min(solved,safeInteger(entry.correct))};
  }
  const solved=safeInteger(source.solved);
  return {solved,correct:Math.min(solved,safeInteger(source.correct)),wrong:safeStringList(source.wrong).filter(id=>knownQuestionIds.has(id)),last:/^\d{4}-\d{2}-\d{2}$/.test(source.last||'')?source.last:'',streak:safeInteger(source.streak),daily,categoryStats,reviewSchedule:isRecord(source.reviewSchedule)?source.reviewSchedule:{}};
}
function normalizeLearning(value){
  const source=isRecord(value)?value:{};
  const completed={};
  if(isRecord(source.completed))for(const [id,entry] of Object.entries(source.completed)){
    if(!isConceptId(id)||!isRecord(entry))continue;
    completed[id]={
      ...(safeIso(entry.completedAt)?{completedAt:safeIso(entry.completedAt)}:{}),
      ...(safeIso(entry.lastReviewedAt)?{lastReviewedAt:safeIso(entry.lastReviewedAt)}:{}),
      ...(safeIso(entry.reviewAt)?{reviewAt:safeIso(entry.reviewAt)}:{}),
      ...(['again','hard','good','easy'].includes(entry.grade)?{grade:entry.grade}:{}),
      attempts:safeInteger(entry.attempts),responseLength:safeInteger(entry.responseLength)
    };
  }
  const ui={};
  if(isRecord(source.ui))for(const [id,entry] of Object.entries(source.ui))if(isConceptId(id)&&isRecord(entry)&&['summary','principle','compare','practice','interview'].includes(entry.tab))ui[id]={tab:entry.tab};
  return {schemaVersion:2,saved:safeStringList(source.saved).filter(isConceptId),review:safeStringList(source.review).filter(isConceptId),completed,ui};
}
function kstDateKey(value=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);
  const part=type=>parts.find(item=>item.type===type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
const saved=normalizeSaved(readStoredJson('interviewDeck',{}));
const learning=normalizeLearning(readStoredJson(LEARNING_KEY,{}));
const icons = {'OS & Network':'⌘','Database':'▦','Java & Spring':'◆','Web & React':'◌','DevOps':'△','AI & Design':'✦','AX Scenario':'◎'};
const learningLanes=[
  {label:'Backend 기본',category:'OS & Network',desc:'OS, Network, HTTP, 동시성'},
  {label:'Spring / JPA',category:'Java & Spring',desc:'Spring, JPA, Transaction'},
  {label:'DB / Transactions',category:'Database',desc:'SQL, MVCC, Lock, Index'},
  {label:'System Design',category:'AI & Design',desc:'RAG, Agent, workflow 설계'},
  {label:'운영 / 장애',category:'DevOps',desc:'배포, 관측성, 장애 대응'},
  {label:'AI / AX Backend',category:'AX Scenario',desc:'AX 운영 시나리오와 보안'}
];
const axTopics=['LLM API','RAG','Vector DB','Agent','자동화','보안 / 운영'];

function save(){ writeStoredJson('interviewDeck',saved); renderStats(); }
function renderStats(){
  $('totalStat').textContent = bank.length;
  const curriculumConcepts=Object.values(window.ATLAS_CURRICULUM||{}).flatMap(chapter=>chapter.sections||[]).flatMap(section=>section.concepts||[]);
  const reviewedConceptCount=curriculumConcepts.filter(concept=>concept.reviewStatus==='reviewed').length;
  $('bulkBtn').textContent=`전체 검수 세트 · ${bank.length}문제`;
  $('reviewedSetNote').textContent=`현재 공개 범위: 직접 출처 대조 검수 문항 ${bank.length}개 · ${new Set(bank.map(question=>question.category)).size}개 분야. 개념 ${curriculumConcepts.length}개 중 ${reviewedConceptCount}개는 출처 대조 검수 완료, 나머지는 초안으로 구분합니다.`;
  $('solvedStat').textContent = saved.solved;
  $('rateStat').textContent = saved.solved ? Math.round(saved.correct / saved.solved * 100) + '%' : '0%';
  $('streak').textContent = `연속 ${saved.streak || 0}일`;
  const today = kstDateKey();
  const todayCount = saved.daily?.[today] || 0;
  $('todayGoal').textContent = `${Math.min(todayCount,20)} / 20`;
  $('todaySolvedStat').textContent = `${todayCount}문제`;
  $('goalBar').style.width = `${Math.min(100,todayCount/20*100)}%`;
  const dueConceptCount=Object.values(learning.completed||{}).filter(item=>item?.reviewAt&&new Date(item.reviewAt)<=new Date()).length;
  $('reviewDue').textContent = `${saved.wrong.length+dueConceptCount}문제`;
  const ranked = Object.entries(saved.categoryStats||{}).filter(([,v])=>v.solved>=3).sort((a,b)=>(a[1].correct/a[1].solved)-(b[1].correct/b[1].solved));
  const attempts=Object.values(saved.categoryStats||{}).reduce((sum,item)=>sum+(item.solved||0),0);
  $('weakArea').textContent = ranked[0]?.[0] || (attempts?'진단 진행 중':'학습 시작');
  $('recommendation').textContent = ranked[0] ? `3문제 이상 근거 · 정답률 ${Math.round(ranked[0][1].correct/ranked[0][1].solved*100)}% · 오답부터 복습` : attempts?'분야별 3문제 이상 풀면 약점을 제안합니다':'첫 진단을 시작하세요';
  renderHomeLearningWidgets(ranked);
}
function categoryDesc(c){
  return {'OS & Network':'동시성, TCP/IP, HTTP','Database':'SQL, JPA, PostgreSQL','Java & Spring':'JVM, AOP, 트랜잭션','Web & React':'상태, 브라우저, 모바일','DevOps':'Docker, 관측성, 배포','AI & Design':'RAG, Agent, Workflow','AX Scenario':'장애 분석, 복구, 운영 판단'}[c] || '';
}
function questionTitle(q){return q.question||q.q||'질문 준비 중';}
function questionDifficulty(q){return q.difficulty||q.level||'기본';}
function categoryCorrectRate(category){
  const stat=saved.categoryStats?.[category];
  return stat?.solved?Math.round(stat.correct/stat.solved*100):null;
}
function conceptById(id){
  const [category,sectionIndex,conceptIndex]=String(id).split(':');
  return getConceptLocation(category,Number(sectionIndex),Number(conceptIndex))?.concept;
}
function getConceptLocation(category,sectionIndex,conceptIndex){
  if(typeof category!=='string'||!Number.isInteger(sectionIndex)||sectionIndex<0||!Number.isInteger(conceptIndex)||conceptIndex<0)return null;
  const curriculum=window.ATLAS_CURRICULUM?.[category];
  const section=curriculum?.sections?.[sectionIndex];
  const concept=section?.concepts?.[conceptIndex];
  return curriculum&&section&&concept?{curriculum,section,concept}:null;
}
function normalizeQuizRecord(value){
  if(!isRecord(value))return null;
  const questionIds=safeStringList(value.questionIds,100);
  const selectedAnswers={},answerResults={};
  if(isRecord(value.selectedAnswers))for(const id of questionIds)if(Number.isInteger(value.selectedAnswers[id])&&value.selectedAnswers[id]>=0&&value.selectedAnswers[id]<=3)selectedAnswers[id]=value.selectedAnswers[id];
  if(isRecord(value.answerResults))for(const id of questionIds)if(typeof value.answerResults[id]==='boolean')answerResults[id]=value.answerResults[id];
  return {
    quizSessionId:safeString(value.quizSessionId,'',120),quizMode:safeString(value.quizMode,'',80),category:safeString(value.category,'',80),difficulty:safeString(value.difficulty,'',40),
    questionIds,currentQuestionIndex:Math.min(safeInteger(value.currentQuestionIndex),Math.max(0,questionIds.length-1)),selectedAnswers,answerResults,
    startedAt:safeIso(value.startedAt),lastSavedAt:safeIso(value.lastSavedAt),elapsedMs:safeInteger(value.elapsedMs),completed:value.completed===true,
    reason:safeString(value.reason,'',80),archivedAt:safeIso(value.archivedAt)
  };
}
function readQuizHistory(){
  const stored=readStoredJson(HISTORY_KEY,[]);
  if(!Array.isArray(stored)){discardStoredValue(HISTORY_KEY);return [];}
  return stored.map(normalizeQuizRecord).filter(Boolean).slice(0,50);
}
function weakCategory(){
  return Object.entries(saved.categoryStats||{}).filter(([,v])=>v.solved>=3).sort((a,b)=>(a[1].correct/a[1].solved)-(b[1].correct/b[1].solved))[0]?.[0]||'';
}
function renderConceptFromId(id){
  const [category,sectionIndex,conceptIndex]=String(id).split(':');
  return renderConceptDetail(category,Number(sectionIndex),Number(conceptIndex));
}
function renderHomeLearningWidgets(){
  const wrongQuestions=(saved.wrong||[]).map(id=>bank.find(q=>q.id===id)).filter(Boolean);
  const weakTopics=[...new Set(wrongQuestions.flatMap(q=>[...(q.relatedTopics||[]),...(q.tags||[])]))].slice(0,8);
  const dueConcepts=Object.entries(learning.completed||{}).filter(([,v])=>v.reviewAt&&new Date(v.reviewAt)<=new Date()).map(([id])=>conceptById(id)?.title).filter(Boolean);
  const reviewCount=wrongQuestions.length+dueConcepts.length+(learning.review||[]).length;
  $('reviewTodayCount').textContent=reviewCount;
  $('weakTopicCount').textContent=weakTopics.length;

  $('learningLanes').innerHTML=learningLanes.map(lane=>`<button class="lane-card" type="button" data-lane-category="${lane.category}"><strong>${lane.label}</strong><span>${lane.desc}</span><em>${bank.filter(q=>q.category===lane.category).length}문제</em></button>`).join('');
  document.querySelectorAll('[data-lane-category]').forEach(btn=>btn.onclick=()=>renderStudyCategory(btn.dataset.laneCategory));

  $('axTopicList').innerHTML=axTopics.map(topic=>`<button type="button" data-ax-topic="${topic}">${topic}</button>`).join('');
  document.querySelectorAll('[data-ax-topic]').forEach(btn=>btn.onclick=()=>openStudy(btn.dataset.axTopic));

  const history=[...new Map(readQuizHistory().map(item=>[item.quizSessionId||`${item.startedAt}:${item.quizMode}`,item])).values()].slice(0,4).map(item=>({title:item.quizMode==='interview'?'면접 모드':item.category||item.quizMode||'랜덤 문제',meta:`${item.questionIds?.length||0}문제 · ${new Date(item.archivedAt||item.lastSavedAt).toLocaleDateString('ko-KR')}`}));
  const completed=Object.entries(learning.completed||{}).slice(-4).reverse().map(([id,v])=>({title:conceptById(id)?.title||'개념 학습',meta:`복습 예정 ${new Date(v.reviewAt).toLocaleDateString('ko-KR')}`}));
  const logs=[...history,...completed].slice(0,5);
  $('recentLearningList').innerHTML=logs.length?logs.map(item=>`<button class="learning-log" type="button" data-recent-topic="${escapeHtml(item.title)}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.meta)}</span></button>`).join(''):'<p class="empty-state">아직 기록이 없습니다. 오늘의 퀴즈를 시작하면 여기에 쌓입니다.</p>';
  document.querySelectorAll('[data-recent-topic]').forEach(btn=>btn.onclick=()=>openStudy(btn.dataset.recentTopic));

  $('weakTopicList').innerHTML=weakTopics.length?weakTopics.map(topic=>`<button type="button" data-weak-topic="${topic}">${topic}</button>`).join(''):'<p class="empty-state">오답이 쌓이면 약점 토픽을 자동으로 보여줍니다.</p>';
  document.querySelectorAll('[data-weak-topic]').forEach(btn=>btn.onclick=()=>openStudy(btn.dataset.weakTopic));

  const samples=bank.filter(q=>q.interviewAnswer||q.interviewPoint||(q.followUpQuestions||[]).length).slice(0,2);
  $('interviewPreview').innerHTML=samples.map(q=>`<button type="button" data-preview-question="${q.id}"><strong>${questionTitle(q)}</strong><span>${(q.points||q.tags||[]).slice(0,3).join(' · ')}</span></button>`).join('');
  document.querySelectorAll('[data-preview-question]').forEach(btn=>btn.onclick=()=>startSpecificQuestion(btn.dataset.previewQuestion));
}
function explainPoint(text, q){
  return q.pointDetails?.[text] || q.explanations?.[text] || `${text}는 ${q.category}에서 실제 설계와 운영 판단의 기준이 됩니다. ${q.whyExplanation}`;
}
function followUpAnswer(q,index){
  return q.followUpAnswers?.[index]||[q.whyExplanation,q.interviewAnswer,q.practicalUse||q.practicalScenario][index]||q.interviewAnswer||q.explanation;
}
function shuffle(a){ return [...a].sort(() => Math.random() - 0.5); }
function persistLearning(){return writeStoredJson(LEARNING_KEY,learning);}
function currentSnapshot(){return {scrollY:window.scrollY||0,tab:document.querySelector('.concept-tab[aria-selected="true"]')?.dataset.tab||'',accordion:document.querySelector('details[open]')?.dataset.panel||'',search:$('knowledgeSearchInput')?.value||'',categoryFilter:$('categoryFilter')?.value||'',difficultyFilter:$('difficultyFilter')?.value||'',tagFilter:$('tagFilter')?.value||''};}
function replaceCurrentSnapshot(){if(history.state)history.replaceState({...history.state,ui:currentSnapshot()},'',location.href);}
function stateHash(state){
  if(state.route==='view') return state.name==='homeView'?'#home':`#view/${encodeURIComponent(state.name||'homeView')}`;
  if(state.route==='study-category') return `#study-category/${encodeURIComponent(state.category)}`;
  if(state.route==='concept') return `#concept/${encodeURIComponent(state.category)}/${state.sectionIndex}/${state.conceptIndex}`;
  if(state.route==='search') return `#search/${encodeURIComponent(state.query||'')}`;
  if(state.route==='project') return `#project/${encodeURIComponent(state.project)}`;
  return `#${state.route||'home'}`;
}
function fallbackToHome(){
  const initial={route:'view',name:'homeView',atlasDepth:0};
  history.replaceState(initial,'',stateHash(initial));
  show('homeView',false);
}
function navigationDepth(state=history.state){return Number.isInteger(state?.atlasDepth)&&state.atlasDepth>=0?state.atlasDepth:0;}
function pushNavigation(state){replaceCurrentSnapshot();const next={...state,atlasDepth:navigationDepth()+1};history.pushState(next,'',stateHash(next));}
function restoreUi(ui={}){(window.requestAnimationFrame||setTimeout)(()=>{if(ui.tab)document.querySelector(`[data-tab="${ui.tab}"]`)?.click();if(ui.accordion)document.querySelector(`details[data-panel="${ui.accordion}"]`)?.setAttribute('open','');if($('categoryFilter'))$('categoryFilter').value=ui.categoryFilter||'';if($('difficultyFilter'))$('difficultyFilter').value=ui.difficultyFilter||'';if($('tagFilter'))$('tagFilter').value=ui.tagFilter||'';window.scrollTo(0,ui.scrollY||0);});}
function safeBack(fallback){replaceCurrentSnapshot();if(navigationDepth()>0)history.back();else fallback();}
window.safeAtlasBack=()=>safeBack(fallbackToHome);
function show(name, record=true){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(name).classList.add('active');
  document.querySelectorAll('.bottom-nav-item').forEach(b => {b.classList.remove('active');b.removeAttribute('aria-current');});
  const navMap = { homeView:'navHomeBtn', studyView:'navStudyBtn', quizView:'navQuizBtn', knowledgeView:'navSearchBtn', architectureView:'navArchitectureBtn' };
  const navId = navMap[name];
  if (navId && $(navId)){ $(navId).classList.add('active');$(navId).setAttribute('aria-current','page'); }
  if(record) pushNavigation({route:'view',name});
  scrollTo(0,0);
}

function renderCategories(){
  const cats = [...new Set(bank.map(q => q.category))];
  $('categoryGrid').innerHTML = cats.map(c => `
    <button class="category-card" data-category="${c}">
      <span class="icon">${icons[c] || '•'}</span>
      <span>${bank.filter(q => q.category === c).length}문제</span>
      <h3>${c}</h3>
      <p>${categoryDesc(c)}</p>
    </button>`).join('');
  document.querySelectorAll('.category-card').forEach(b => b.onclick = () => renderStudyCategory(b.dataset.category));
}

function renderChapterPreview(){
  const cats = [...new Set(bank.map(q => q.category))];
  $('chapterPreview').innerHTML = cats.map(c => {
    const items = bank.filter(q => q.category === c);
    const sample = items.slice(0, 3);
    const topics = [...new Set(items.flatMap(q => q.relatedTopics || []).filter(Boolean))].slice(0, 6);
    return `
      <article class="chapter-card">
        <div class="chapter-topline"><span>${c}</span><strong>${items.length}문제</strong></div>
        <h3>${categoryDesc(c)}</h3>
        <p>${sample[0]?.whyExplanation || '이 챕터의 핵심 개념을 정리하고, 서술형 답변으로 연결하는 흐름을 제공합니다.'}</p>
        <div class="mini-labels">
          ${topics.map(t => `<button class="mini-chip" data-topic="${t}">${t}</button>`).join('')}
        </div>
      </article>`;
  }).join('');
  document.querySelectorAll('#chapterPreview [data-topic]').forEach(btn => btn.onclick = () => openStudy(btn.dataset.topic));
}

function renderStudy(){
  const cats = [...new Set(bank.map(q => q.category))];
  $('studyShortcuts').innerHTML = cats.map(c => `<button class="mini-chip" data-study="${c}">${c}</button>`).join('');
  $('studyOverview').innerHTML = cats.map(c => {
    const items = bank.filter(q => q.category === c);
    const concepts = [...new Set(items.flatMap(q => q.relatedTopics || []))].slice(0, 8);
    const writing = items.slice(0, 4);
    const scenarios = items.filter(q => q.practicalScenario).slice(0, 3);
    return `
      <section class="study-card" id="study-${c.replace(/\s+/g,'-')}">
        <div class="section-title">
          <div>
            <p class="eyebrow">${c}</p>
            <h2>${categoryDesc(c)}</h2>
          </div>
          <button class="text-btn" data-open-category="${c}">문제 풀기</button>
        </div>
        <p class="study-summary">${window.CHAPTER_GUIDES?.[c]?.summary || '핵심 개념, 서술형 포인트, 실무 시나리오를 함께 정리합니다.'}</p>
        <div class="study-grid">
          <div>
            <h3>외우기</h3>
            <ul>${concepts.map(x => `<li><button class="study-link" data-topic="${x}">${x}</button></li>`).join('')}</ul>
          </div>
          <div>
            <h3>서술형 포인트</h3>
            <div class="accordion-list">
              ${writing.map(q => `<details class="study-detail"><summary>${q.question}</summary><p>${q.interviewPoint || q.whyExplanation}</p></details>`).join('')}
            </div>
          </div>
          <div>
            <h3>실무 시나리오</h3>
            <div class="accordion-list">
              ${scenarios.map(q => `<details class="study-detail"><summary>${q.question}</summary><p>${q.practicalScenario}</p></details>`).join('') || '<p>실무 시나리오 데이터가 없습니다.</p>'}
            </div>
          </div>
        </div>
      </section>`;
  }).join('');
  document.querySelectorAll('#studyShortcuts [data-study]').forEach(btn => btn.onclick = () => document.getElementById(`study-${btn.dataset.study.replace(/\s+/g,'-')}`).scrollIntoView({behavior:'smooth', block:'start'}));
  document.querySelectorAll('[data-open-category]').forEach(btn => btn.onclick = () => start(btn.dataset.openCategory));
  document.querySelectorAll('#studyOverview [data-topic]').forEach(btn => btn.onclick = () => openStudy(btn.dataset.topic));
}

function renderAtlasStudy(){
  renderStudyHome();
  return;
  const chapters=window.ATLAS_CHAPTERS||{};
  const cats=Object.keys(chapters);
  $('studyShortcuts').innerHTML=cats.map(c=>`<button class="mini-chip" data-study="${c}">${c}</button>`).join('');
  $('studyOverview').innerHTML=cats.map(c=>{
    const g=chapters[c];
    const sections=[['핵심 정의',g.definition],['왜 필요한가',g.need],['내부 동작 원리',g.internals],['장점',g.advantages],['단점',g.disadvantages],['Trade-off',g.tradeoff],['실무 적용 사례',g.practice],['장애 사례',g.incident],['면접 답변 예시',g.answer],['자주 하는 실수',g.mistakes.join(' · ')],['관련 기술 연결',g.links.join(' → ')]];
    return `<section class="study-card" id="atlas-${c.replace(/\s+/g,'-')}"><div class="section-title"><div><p class="eyebrow">${c}</p><h2>${g.title}</h2></div><button class="text-btn" data-open-category="${c}">문제 풀기</button></div><p class="study-summary">${g.summary}</p><div class="concept-flow">${g.flow.map((x,i)=>`<button class="study-link" data-topic="${x}">${x}</button>${i<g.flow.length-1?'<span>→</span>':''}`).join('')}</div><div class="deep-study-grid">${sections.map(([h,p])=>`<details class="study-detail" ${h==='핵심 정의'?'open':''}><summary>${h}</summary><p>${p}</p></details>`).join('')}</div><div class="interview-top20"><h3>면접 질문 TOP 20</h3>${g.interviews.map((x,i)=>`<details class="study-detail"><summary>${i+1}. ${x.question}</summary><dl><dt>좋은 답변</dt><dd>${x.goodAnswer}</dd><dt>모범 답변</dt><dd>${x.modelAnswer}</dd><dt>실무 사례</dt><dd>${x.practical}</dd><dt>추가 질문</dt><dd>${x.followUp}</dd><dt>꼬리 질문</dt><dd>${x.tailQuestion}</dd><dt>답변 팁</dt><dd>${x.tip}</dd></dl></details>`).join('')}</div></section>`;
  }).join('');
  document.querySelectorAll('#studyShortcuts [data-study]').forEach(btn=>btn.onclick=()=>document.getElementById(`atlas-${btn.dataset.study.replace(/\s+/g,'-')}`).scrollIntoView({behavior:'smooth'}));
  document.querySelectorAll('#studyOverview [data-open-category]').forEach(btn=>btn.onclick=()=>start(btn.dataset.openCategory));
  document.querySelectorAll('#studyOverview [data-topic]').forEach(btn=>btn.onclick=()=>openStudy(btn.dataset.topic));
}

function conceptTable(data){
  if(!data) return '';
  return `<div class="comparison-table-wrap"><table class="comparison-table"><thead><tr>${data.headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${data.rows.map(row=>`<tr>${row.map((x,i)=>`<td data-label="${data.headers[i]||''}">${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function renderStudyHome(){
  const curriculum=window.ATLAS_CURRICULUM||{};
  $('studyShortcuts').innerHTML=Object.entries(curriculum).map(([name,c])=>`<button class="mini-chip" data-curriculum="${name}">${c.icon} ${name}</button>`).join('');
  $('studyOverview').innerHTML=`<div class="curriculum-grid">${Object.entries(curriculum).map(([name,c])=>`<button class="curriculum-card" data-curriculum="${name}" style="--chapter:${c.color}"><span class="curriculum-icon">${c.icon}</span><span><strong>${name}</strong><small>${c.summary}</small><em>${c.sections.length}개 챕터 · ${c.sections.reduce((n,s)=>n+s.concepts.length,0)}개 핵심 개념</em></span><b>›</b></button>`).join('')}</div>`;
  document.querySelectorAll('[data-curriculum]').forEach(btn=>btn.onclick=()=>renderStudyCategory(btn.dataset.curriculum));
}

function renderStudyCategory(category,record=true){
  show('studyView',false);
  if(record) pushNavigation({route:'study-category',category});
  const c=window.ATLAS_CURRICULUM?.[category]; if(!c) return renderStudyHome();
  const categoryConcepts=c.sections.flatMap(section=>section.concepts);
  const reviewedConceptCount=categoryConcepts.filter(concept=>concept.reviewStatus==='reviewed').length;
  const draftConceptCount=categoryConcepts.length-reviewedConceptCount;
  const difficultyChoices=[['easy','기초'],['medium','면접'],['hard','실무·심화']].map(([value,label])=>({value,label,count:bank.filter(question=>question.category===category&&questionDifficulty(question)===value).length}));
  const sectionQuizCounts=c.sections.map(section=>conceptQuestionPool(category,section.concepts).length);
  $('studyShortcuts').innerHTML=`<button class="mini-chip" data-study-home>← 전체 분야</button><span class="study-current">${c.icon} ${category}</span>`;
  $('studyOverview').innerHTML=`<section class="category-study-head" style="--chapter:${c.color}"><span class="curriculum-icon">${c.icon}</span><div><p class="eyebrow">LEARNING MAP</p><h2>${category}</h2><p>${c.summary}</p><p class="curriculum-review-summary" aria-label="콘텐츠 검수 상태"><span class="review-count review-count--reviewed">검수 완료 ${reviewedConceptCount}</span><span class="review-count review-count--draft">초안 ${draftConceptCount}</span></p></div></section><div class="difficulty-row">${difficultyChoices.map(item=>`<button data-level="${item.value}" ${item.count?'aria-disabled="false"':'disabled aria-disabled="true"'}><span>${item.label}</span><small>${item.count?`${item.count}문제`:'준비 중'}</small></button>`).join('')}</div><div class="section-card-list">${c.sections.map((section,index)=>{const quizCount=sectionQuizCounts[index];return `<article class="section-card"><button class="section-card-head" data-toggle-section="${index}" aria-expanded="${index===0}"><span><small>CHAPTER ${String(index+1).padStart(2,'0')}</small><strong>${section.title}</strong><em>${section.summary}</em></span><b>${section.concepts.length}</b></button><div class="concept-list" data-section="${index}" ${index?'hidden':''}>${section.concepts.map((concept,ci)=>`<button class="concept-row" data-concept="${index}:${ci}" data-review-status="${concept.reviewStatus}"><span><strong>${concept.title}</strong><small>${concept.summary}</small><small class="concept-row-status concept-row-status--${concept.reviewStatus}">${concept.reviewStatus==='reviewed'?'검수 완료':'초안'}</small></span><b aria-hidden="true">›</b></button>`).join('')}<button class="chapter-quiz" data-chapter-quiz="${index}" ${quizCount?'aria-disabled="false"':'disabled aria-disabled="true"'}>${quizCount?`이 챕터 검수 문제 · ${quizCount}문제`:'이 챕터 검수 문제 준비 중'}</button></div></article>`;}).join('')}</div>`;
  document.querySelector('[data-study-home]')?.addEventListener('click',renderStudyHome);
  document.querySelectorAll('[data-toggle-section]').forEach(btn=>btn.onclick=()=>{const body=document.querySelector(`[data-section="${btn.dataset.toggleSection}"]`);body.hidden=!body.hidden;btn.setAttribute('aria-expanded',String(!body.hidden));});
  document.querySelectorAll('[data-concept]').forEach(btn=>{const [si,ci]=btn.dataset.concept.split(':').map(Number);btn.onclick=()=>renderConceptDetail(category,si,ci);});
  document.querySelectorAll('[data-chapter-quiz]').forEach(btn=>btn.onclick=()=>{if(btn.disabled||btn.getAttribute('aria-disabled')==='true')return;startChapterQuiz(category,Number(btn.dataset.chapterQuiz));});
  document.querySelectorAll('[data-level]').forEach(btn=>btn.onclick=()=>{if(btn.disabled||btn.getAttribute('aria-disabled')==='true')return;start(category,false,10,btn.dataset.level);});
}

function conceptQuestionPool(category,concepts){
  const targets=new Set(concepts.flatMap(concept=>[concept.title,...(concept.related||[])]).map(value=>String(value).toLowerCase()));
  return bank.filter(question=>question.category===category&&[...(question.tags||[]),...(question.relatedTopics||[])].some(value=>targets.has(String(value).toLowerCase())));
}

function reviewedConceptQuestionPool(category,concept){
  const exact=bank.filter(question=>question.category===category&&(question.tags||[]).some(tag=>String(tag).toLowerCase()===concept.title.toLowerCase()));
  return exact.length?exact:conceptQuestionPool(category,[concept]);
}

function startChapterQuiz(category,sectionIndex){
  return offerResume(()=>{
    const section=window.ATLAS_CURRICULUM?.[category]?.sections?.[sectionIndex];
    const pool=section?conceptQuestionPool(category,section.concepts):[];
    if(!pool.length){alert('이 챕터의 검증 문제를 준비 중입니다.');return;}
    startQuestionSet(shuffle(pool),{mode:'chapter',category,difficulty:'',count:Math.min(10,pool.length)});
  });
}

function startConceptQuiz(category,concept){
  return offerResume(()=>{
    const pool=reviewedConceptQuestionPool(category,concept);
    if(!pool.length){alert('이 개념의 검증 문제를 준비 중입니다.');return;}
    startQuestionSet(shuffle(pool),{mode:'concept',category,difficulty:concept.difficulty||'',count:Math.min(5,pool.length)});
  });
}

function renderConceptDetail(category,sectionIndex,conceptIndex,record=true){
  const location=getConceptLocation(category,sectionIndex,conceptIndex);
  if(!location)return false;
  show('studyView',false);
  if(record) pushNavigation({route:'concept',category,sectionIndex,conceptIndex});
  const {curriculum:c,section,concept:x}=location;
  $('studyShortcuts').innerHTML=`<button class="mini-chip" id="conceptBack">← ${section.title}</button><span class="study-current">${category}</span>`;
  const references=[...(x.sources||[])].filter((item,index,all)=>item?.url&&all.findIndex(other=>other.url===item.url)===index);
  const isReviewed=x.reviewStatus==='reviewed';
  const id=`${category}:${sectionIndex}:${conceptIndex}`,next=section.concepts[conceptIndex+1]||c.sections[sectionIndex+1]?.concepts[0];
  const completed=learning.completed[id];
  const conceptQuizCount=reviewedConceptQuestionPool(category,x).length;
  const due=completed?.reviewAt?new Date(completed.reviewAt).toLocaleDateString('ko-KR'):'회상 결과에 따라 1~14일 뒤';
  const tailAnswers=x.tailAnswers||[x.why,`${x.pros} ${x.cons}`,`${x.practice} ${x.incident}`];
  const objective=x.learningObjective||`${x.title}의 책임, 동작 원리, 선택 기준을 실제 상황에 적용해 설명한다.`;
  const misconceptions=x.misconceptions||[x.cons];
  const panels={
    summary:`<section class="summary-card"><p class="eyebrow">LEARNING OBJECTIVE</p><h3>이번 학습에서 할 수 있어야 하는 것</h3><p>${objective}</p><h4>핵심 개념</h4><ul>${[x.definition,x.internals,x.practice].map(v=>`<li>${v}</li>`).join('')}</ul><div class="summary-note"><strong>먼저 버릴 오개념</strong>${misconceptions.map(item=>`<span>${item}</span>`).join('')}</div><small>다음 복습: ${due}</small></section>`,
    principle:`${window.renderLearningVisual?.(x.title,category)||''}${[['왜 필요한가',x.why],['내부 동작',x.internals],['장점과 단점',`${x.pros} ${x.cons}`]].map(([h,p],i)=>`<details class="concept-accordion" data-panel="principle-${i}"><summary>${h}<span aria-hidden="true">＋</span></summary><p>${p}</p></details>`).join('')}`,
    compare:`<section class="concept-comparison"><h3>비교표</h3>${conceptTable(x.comparison)}</section>`,
    practice:`${[['구체적 사용 예',x.practice],['장애·오용 사례',x.incident]].map(([h,p],i)=>`<details class="concept-accordion" data-panel="practice-${i}"><summary>${h}<span aria-hidden="true">＋</span></summary><p>${p}</p></details>`).join('')}`,
    interview:`<section class="summary-card"><h3>${isReviewed?'30초 답변':'검토 중인 답변 초안'}</h3><p>${x.interview}</p></section><section class="tail-card"><h3>꼬리 질문</h3><p>먼저 소리 내어 답한 뒤 ${isReviewed?'검수 답안':'초안 비교문'}을 펼쳐 비교하세요.</p>${x.tails.map((question,index)=>`<details class="study-detail"><summary>${question}</summary><p><strong>${isReviewed?'검수 답안':'초안 비교문'}</strong> · ${tailAnswers[index]||x.interview}</p></details>`).join('')}</section><details class="concept-accordion sources-card" data-panel="sources"><summary>출처와 검토 기준<span aria-hidden="true">＋</span></summary>${references.length?references.map(r=>`<a href="${r.url}" target="_blank" rel="noreferrer">${r.title}${r.version?` · ${r.version}`:''}${r.checkedAt?` · 확인 ${r.checkedAt}`:''} ↗</a>`).join(''):'<p>이 개념의 직접 출처를 검토 중입니다.</p>'}</details>`
  };
  const reviewLabel=isReviewed?'직접 출처 대조 검수 완료':'검토 중 · 초안';
  const reviewClass=isReviewed?'content-status-badge--reviewed':'content-status-badge--draft';
  const meta=[x.difficulty,x.estimatedMinutes?`${x.estimatedMinutes}분`:null,x.importance?`중요도 ${x.importance}`:null].filter(Boolean);
  const draftNotice=isReviewed?'':`<aside class="draft-content-notice" role="note"><strong>검토 중인 커리큘럼 초안</strong><p>직접 출처 검수가 끝나기 전입니다. 이 설명은 면접 답안이나 완료 학습 기준으로 사용하지 마세요.</p></aside>`;
  $('studyOverview').innerHTML=`<article class="concept-detail"><header style="--chapter:${c.color}"><p class="eyebrow">${section.title}</p><h2>${x.title}</h2><span class="content-status-badge ${reviewClass}">${reviewLabel}</span><p class="concept-definition">${x.definition}</p><p>${x.summary}</p>${meta.length?`<div class="concept-meta">${meta.map(item=>`<span>${item}</span>`).join('')}</div>`:''}</header>${draftNotice}<div class="concept-keywords">${x.related.map(t=>`<button data-topic="${t}">${t}</button>`).join('')}</div><div class="concept-tabs" role="tablist" aria-label="학습 섹션">${[['summary','요약'],['principle','원리'],['compare','비교'],['practice','실무'],['interview','면접']].map(([key,label],i)=>`<button class="concept-tab" id="conceptTab-${key}" role="tab" data-tab="${key}" aria-controls="conceptPanel" aria-selected="${i===0}" tabindex="${i===0?'0':'-1'}">${label}</button>`).join('')}</div><div id="conceptPanel" class="concept-panel" role="tabpanel" aria-labelledby="conceptTab-summary">${panels.summary}</div><section class="recall-check" id="recallCheck" aria-labelledby="recallTitle"><p class="eyebrow">ACTIVE RECALL</p><h3 id="recallTitle">보지 않고 설명해 보세요</h3><p>${objective}</p><label for="recallAnswer">내 설명</label><textarea id="recallAnswer" rows="4" minlength="20" placeholder="정의, 내부 동작, 선택 기준을 2~4문장으로 적으세요."></textarea><button class="primary" id="revealRecall" type="button">기준 답안과 비교</button><div class="recall-reference" id="recallReference" hidden tabindex="-1"><h4>${isReviewed?'기준 답안':'초안 비교문'}</h4><p>${x.interview}</p><p><strong>${isReviewed?'확인할 근거':'검토 중인 설명'}</strong> · ${x.internals}</p><fieldset><legend>비교한 뒤 다음 복습 간격을 고르세요.</legend><button type="button" data-recall-grade="again">다시 · 1일</button><button type="button" data-recall-grade="hard">어려움 · 3일</button><button type="button" data-recall-grade="good">좋음 · 7일</button><button type="button" data-recall-grade="easy">쉬움 · 14일</button></fieldset></div><p id="recallStatus" role="status" aria-live="polite">${completed?`마지막 회상 기록이 있습니다. 다음 복습 ${due}`:'아직 회상 기록이 없습니다.'}</p></section><div class="summary-actions"><button class="secondary" id="saveConcept">${learning.saved.includes(id)?'저장됨':'저장'}</button><button class="secondary" id="reviewConcept">${learning.review.includes(id)?'복습 등록됨':'복습 추가'}</button><button class="secondary" id="copySummary">복사</button><button class="primary" id="focusRecall">회상 점검</button></div><div class="concept-actions"><button class="secondary" id="relatedSearch">관련 자료 보기</button><button class="primary" id="conceptQuiz" ${conceptQuizCount?'aria-disabled="false"':'disabled aria-disabled="true"'}>${conceptQuizCount?`이 개념 검수 문제 · ${conceptQuizCount}문제`:'검수 문제 준비 중'}</button>${next?'<button class="secondary" id="nextConcept">다음 개념</button>':''}</div></article>`;
  if(!isReviewed){
    $('recallReference').querySelector('fieldset')?.replaceWith(Object.assign(document.createElement('p'),{className:'draft-recall-note',textContent:'직접 출처 검수가 끝난 뒤에만 완료와 복습 간격을 기록합니다.'}));
    $('recallStatus').textContent='자기 설명은 연습할 수 있지만 초안은 완료 학습으로 기록하지 않습니다.';
    $('reviewConcept').disabled=true;
    $('reviewConcept').textContent='검수 후 복습 가능';
  }
  const tabs=[...document.querySelectorAll('.concept-tab')];
  const activateTab=btn=>{tabs.forEach(item=>{const selected=item===btn;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;});$('conceptPanel').setAttribute('aria-labelledby',btn.id);$('conceptPanel').innerHTML=panels[btn.dataset.tab];bindSingleAccordion();learning.ui[id]={tab:btn.dataset.tab};persistLearning();};
  tabs.forEach((btn,index)=>{btn.onclick=()=>activateTab(btn);btn.onkeydown=event=>{const direction={ArrowRight:1,ArrowLeft:-1}[event.key];if(direction){event.preventDefault();const target=tabs[(index+direction+tabs.length)%tabs.length];activateTab(target);target.focus();}else if(event.key==='Home'||event.key==='End'){event.preventDefault();const target=event.key==='Home'?tabs[0]:tabs.at(-1);activateTab(target);target.focus();}};});
  function bindSingleAccordion(){document.querySelectorAll('#conceptPanel details').forEach(d=>d.ontoggle=()=>{const icon=d.querySelector('summary span');if(icon)icon.textContent=d.open?'−':'＋';if(d.open)document.querySelectorAll('#conceptPanel details[open]').forEach(other=>{if(other!==d)other.open=false;});});}bindSingleAccordion();
  $('conceptBack').onclick=()=>safeBack(()=>renderStudyCategory(category)); $('relatedSearch').onclick=()=>openStudy(x.title); $('conceptQuiz').onclick=()=>{if($('conceptQuiz').disabled||$('conceptQuiz').getAttribute('aria-disabled')==='true')return;startConceptQuiz(category,x);};
  $('saveConcept').onclick=()=>{if(!learning.saved.includes(id))learning.saved.push(id);persistLearning();$('saveConcept').textContent='저장됨';$('appStatus').textContent=`${x.title} 저장됨`;};
  $('reviewConcept').onclick=()=>{if(!learning.review.includes(id))learning.review.push(id);persistLearning();$('reviewConcept').textContent='복습 등록됨';$('appStatus').textContent=`${x.title} 복습 등록됨`;};
  $('copySummary').onclick=async()=>{try{if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');await navigator.clipboard.writeText(`${x.title}\n${x.summary}\n${x.interview}`);$('copySummary').textContent='복사됨';$('appStatus').textContent='학습 요약을 복사했습니다.';}catch{$('copySummary').textContent='복사 실패';$('appStatus').textContent='복사하지 못했습니다. 브라우저 권한을 확인하세요.';}};
  $('focusRecall').onclick=()=>{$('recallCheck').scrollIntoView({behavior:'smooth',block:'center'});$('recallAnswer').focus();};
  $('revealRecall').onclick=()=>{const answer=$('recallAnswer').value.trim();if(answer.length<20){$('recallStatus').textContent='먼저 20자 이상으로 자신의 설명을 적어 주세요.';$('recallAnswer').focus();return;}$('recallReference').hidden=false;$('recallReference').focus();$('recallStatus').textContent=isReviewed?'기준 답안과 비교한 뒤 복습 간격을 선택하세요.':'초안 비교문을 열었습니다. 직접 출처 검수가 끝나기 전에는 완료나 복습 간격을 기록하지 않습니다.';};
  document.querySelectorAll('[data-recall-grade]').forEach(btn=>btn.onclick=()=>{if($('recallReference').hidden)return;const grade=btn.dataset.recallGrade,previous=learning.completed[id],attempts=(previous?.attempts||0)+1,base={again:1,hard:3,good:7,easy:14}[grade],days=grade==='easy'&&attempts>1?Math.min(30,base*2):base,now=new Date(),reviewAt=new Date(now.getTime()+days*86400000);learning.completed[id]={completedAt:previous?.completedAt||now.toISOString(),lastReviewedAt:now.toISOString(),reviewAt:reviewAt.toISOString(),grade,attempts,responseLength:$('recallAnswer').value.trim().length};if(grade==='again'||grade==='hard'){if(!learning.review.includes(id))learning.review.push(id);}else learning.review=learning.review.filter(item=>item!==id);persistLearning();$('recallStatus').textContent=`회상 기록 완료 · ${days}일 뒤 다시 확인합니다.`;$('appStatus').textContent=`${x.title} 회상 기록 완료`;});
  if(next)$('nextConcept').onclick=()=>{const loc=c.sections.flatMap((s,si)=>s.concepts.map((v,ci)=>({v,si,ci}))).find(v=>v.v===next);renderConceptDetail(category,loc.si,loc.ci);};
  if(learning.ui[id]?.tab)document.querySelector(`[data-tab="${learning.ui[id].tab}"]`)?.click();
  document.querySelectorAll('#studyOverview [data-topic]').forEach(btn=>btn.onclick=()=>openStudy(btn.dataset.topic));
  return true;
}

function renderArchitectureHome(record=false){
  show('architectureView',false); if(record) pushNavigation({route:'architecture'});
  $('architectureContent').innerHTML=`<div class="project-guide-grid">${Object.entries(window.ATLAS_PROJECTS||{}).map(([name,p])=>`<button class="project-guide-card" data-project="${name}"><small>${p.badge}</small><strong>${name}</strong><span>${p.purpose}</span><em>${p.stack.slice(0,4).join(' · ')}</em><b>구조 살펴보기 →</b></button>`).join('')}</div>`;
  document.querySelectorAll('[data-project]').forEach(btn=>btn.onclick=()=>renderProjectGuide(btn.dataset.project));
}

function guideFlow(items,label){return `<section class="guide-diagram"><h3>${label}</h3><div class="guide-flow">${items.map((item,i)=>`<button class="guide-node" data-node="${label}:${i}"><small>STEP ${i+1}</small><strong>${typeof item==='string'?item:item.name}</strong><span>${typeof item==='string'?'역할·입출력 보기':item.role}</span></button>`).join('')}</div><aside class="node-detail" data-node-detail hidden></aside></section>`;}
function renderProjectGuide(name,record=true){
  show('architectureView',false); if(record) pushNavigation({route:'project',project:name});
  const p=window.ATLAS_PROJECTS[name];
  $('architectureContent').innerHTML=`<article class="project-guide-detail"><button class="text-btn" id="projectsBack">← 프로젝트 목록</button><header><small>${p.badge}</small><h2>${name}</h2><p>${p.purpose}</p><div class="project-header-actions"><a class="primary" href="${p.github||'#'}" target="_blank" rel="noreferrer">GitHub 저장소</a><button class="secondary" data-tech="${p.technologies[0]}">관련 기술 학습</button></div></header><section class="guide-stack"><h3>핵심 기술 스택</h3><div class="guide-techs">${p.technologies.map(t=>`<button data-tech="${t}">${t}</button>`).join('')}</div></section>${guideFlow(p.diagram,'시스템 구성도')}${guideFlow(p.sequence,'요청 · 이벤트 시퀀스')}<details class="guide-section" open><summary>주요 디렉터리와 구현</summary><div class="directory-list">${p.directories.map(([path,role])=>`<div><code>${path}</code><span>${role}</span></div>`).join('')}</div></details><div class="guide-facts"><section><h3>실제 구현 방법</h3><p>${p.api}</p></section><section><h3>설계 의사결정</h3><ul>${p.design.map(x=>`<li>${x}</li>`).join('')}</ul></section></div>${[['데이터·이벤트 흐름',p.flow.join(' → ')],['검색 / RAG',`${p.search} ${p.rag}`],['문제·데이터 생성',p.generation],['관측·배포',p.observability||`${p.stack.includes('Prometheus')?'Prometheus와 Grafana로 지표를 관측한다. ':''}Docker 기반으로 동일 실행 환경을 구성한다.`],['Android / Capacitor 연계',p.android],['UI 구조',p.ui],['Git 전략',p.git],['장애·한계',p.limitations||'운영 환경별 인증·권한·성능 기준은 배포 전 별도 검증이 필요하다.']].map(([h,v],i)=>`<details class="guide-section" data-panel="guide-${i}"><summary>${h}</summary><p>${v}</p></details>`).join('')}<section class="guide-roadmap"><h3>다음 버전 계획</h3>${p.roadmap.map(x=>`<span>${x}</span>`).join('')}</section></article>`;
  $('projectsBack').onclick=()=>safeBack(()=>renderArchitectureHome(false)); document.querySelectorAll('[data-tech]').forEach(btn=>btn.onclick=()=>openStudy(btn.dataset.tech));
  document.querySelectorAll('.guide-node').forEach(btn=>btn.onclick=()=>{const group=btn.closest('.guide-diagram'),index=Number(btn.dataset.node.split(':').pop()),source=btn.dataset.node.startsWith('시스템')?p.diagram:p.sequence,item=source[index],detail=group.querySelector('[data-node-detail]');detail.hidden=false;detail.innerHTML=`<strong>${typeof item==='string'?item:item.name}</strong><p>${typeof item==='string'?`${item} 단계의 입력을 검증하고 다음 단계가 사용할 출력 또는 상태를 만든다.`:item.role}</p><dl><dt>입력</dt><dd>${item.input||'이전 단계의 요청·상태'}</dd><dt>출력</dt><dd>${item.output||'검증된 결과·이벤트'}</dd><dt>관련 구현</dt><dd>${item.files?.join(', ')||p.directories[Math.min(index,p.directories.length-1)]?.[0]||'프로젝트 문서 참조'}</dd></dl>`;});
}

window.addEventListener('popstate',event=>{
  persistQuizSession();
  const state=event.state||{route:'view',name:'homeView'};
  if(state.route==='study-category'){
    if(window.ATLAS_CURRICULUM?.[state.category]){renderStudyCategory(state.category,false);return restoreUi(state.ui);}
    return fallbackToHome();
  }
  if(state.route==='concept'){
    if(renderConceptDetail(state.category,state.sectionIndex,state.conceptIndex,false))return restoreUi(state.ui);
    return fallbackToHome();
  }
  if(state.route==='architecture'){renderArchitectureHome(false);return restoreUi(state.ui);}
  if(state.route==='project'){
    if(window.ATLAS_PROJECTS?.[state.project]){renderProjectGuide(state.project,false);return restoreUi(state.ui);}
    return fallbackToHome();
  }
  if(state.route==='search'){const query=safeString(state.query||state.ui?.search,'',180);show('knowledgeView',false);$('knowledgeSearchInput').value=query;window.renderKnowledgeSearch?.(query);return restoreUi(state.ui);}
  if(state.route!=='view'||!$(state.name)?.classList.contains('view'))return fallbackToHome();
  show(state.name,false);
  if(state.name==='studyView') renderStudyHome();
  if(state.name==='architectureView') renderArchitectureHome(false);
});

function sessionPayload(completed=false){return {quizSessionId:state.quizSessionId||crypto.randomUUID?.()||`quiz-${Date.now()}`,quizMode:state.mode,category:state.category||'',difficulty:state.difficulty||'',questionIds:state.session.map(q=>q.id),currentQuestionIndex:state.index,selectedAnswers:state.selectedAnswers||{},answerResults:state.answerResults||{},startedAt:state.startedAt||new Date().toISOString(),lastSavedAt:new Date().toISOString(),elapsedMs:(state.elapsedMs||0)+(state.startedTick?Date.now()-state.startedTick:0),completed};}
function persistQuizSession(completed=false){if(!state.session.length)return false;const payload=sessionPayload(completed);state.quizSessionId=payload.quizSessionId;return writeStoredJson(SESSION_KEY,payload);}
function archiveQuizSession(reason='interrupted'){
  const session=normalizeQuizRecord(readStoredJson(SESSION_KEY,null));
  if(!session){discardStoredValue(SESSION_KEY);return;}
  const list=readQuizHistory();
  list.unshift({...session,reason:safeString(reason,'interrupted',80),archivedAt:new Date().toISOString()});
  writeStoredJson(HISTORY_KEY,list.slice(0,50));
  discardStoredValue(SESSION_KEY);
}
function resumeQuizSession(session){const questions=session.questionIds.map(id=>bank.find(q=>q.id===id)).filter(Boolean);if(!questions.length)return false;const answers=questions.filter(q=>session.answerResults?.[q.id]!==undefined).map(q=>({q,correct:session.answerResults[q.id]}));Object.assign(state,{session:questions,index:Math.min(session.currentQuestionIndex,questions.length-1),score:answers.filter(a=>a.correct).length,answers,mode:session.quizMode,category:session.category,difficulty:session.difficulty,selectedAnswers:session.selectedAnswers||{},answerResults:session.answerResults||{},quizSessionId:session.quizSessionId,startedAt:session.startedAt,elapsedMs:session.elapsedMs||0,startedTick:Date.now()});show('quizView');renderQuestion();return true;}
function pendingQuiz(){
  const session=normalizeQuizRecord(readStoredJson(SESSION_KEY,null));
  if(!session||session.completed){discardStoredValue(SESSION_KEY);return null;}
  const knownIds=session.questionIds.filter(id=>bank.some(question=>question.id===id));
  if(!knownIds.length){discardStoredValue(SESSION_KEY);return null;}
  session.questionIds=knownIds;
  session.currentQuestionIndex=Math.min(session.currentQuestionIndex,knownIds.length-1);
  session.selectedAnswers=Object.fromEntries(Object.entries(session.selectedAnswers).filter(([id])=>knownIds.includes(id)));
  session.answerResults=Object.fromEntries(Object.entries(session.answerResults).filter(([id])=>knownIds.includes(id)));
  return session;
}
function offerResume(onFresh){const pending=pendingQuiz();if(!pending)return onFresh();const modal=document.createElement('div');modal.className='resume-overlay';modal.innerHTML=`<section class="resume-dialog" role="dialog" aria-modal="true"><small>중단된 학습</small><h2>이전에 풀던 문제 ${pending.currentQuestionIndex+1}/${pending.questionIds.length}이 있습니다.</h2><p>답안과 순서, 풀이 시간은 이 기기에 저장되어 있습니다.</p><button class="primary" data-resume>이어 풀기</button><button class="secondary" data-restart>처음부터</button><button class="text-btn" data-archive>기록만 저장하고 종료</button></section>`;document.body.append(modal);modal.querySelector('[data-resume]').onclick=()=>{modal.remove();if(!resumeQuizSession(pending)){discardStoredValue(SESSION_KEY);onFresh();}};modal.querySelector('[data-restart]').onclick=()=>{if(confirm('기존 미완료 기록을 보관하고 새로 시작할까요?')){archiveQuizSession('restarted');modal.remove();onFresh();}};modal.querySelector('[data-archive]').onclick=()=>{archiveQuizSession('user-exit');modal.remove();show('homeView');};}

function updateStreak(){
  const today = kstDateKey();
  if (saved.last === today) return;
  const prev = kstDateKey(new Date(Date.now() - 86400000));
  saved.streak = saved.last === prev ? (saved.streak || 0) + 1 : 1;
  saved.last = today;
}

function start(category, onlyWrong = false, count = 10, difficulty = ''){
  return offerResume(()=>startFresh(category,onlyWrong,count,difficulty));
}
function startQuestionSet(questions,{mode='all',category='',difficulty='',count=questions.length}={}){
  if(!questions.length){ alert('시작할 문제가 없습니다.'); return; }
  state.count = count;
  state.session = questions.slice(0,count);
  state.index = 0;
  state.score = 0;
  state.answers = [];
  state.mode = mode;
  Object.assign(state,{category,difficulty,selectedAnswers:{},answerResults:{},quizSessionId:crypto.randomUUID?.()||`quiz-${Date.now()}`,startedAt:new Date().toISOString(),startedTick:Date.now(),elapsedMs:0});
  show('quizView');
  persistQuizSession();
  renderQuestion();
}
function startFresh(category, onlyWrong = false, count = 10, difficulty = ''){
  let pool = onlyWrong ? bank.filter(q => saved.wrong.includes(q.id)) : category ? bank.filter(q => q.category === category) : bank;
  if(difficulty) pool=pool.filter(q=>q.difficulty===difficulty||q.level===difficulty);
  if (!pool.length) { alert('복습할 오답이 없습니다.'); return; }
  const featured=shuffle(pool.filter(q=>String(q.id).startsWith('quality-')||String(q.id).startsWith('curriculum-')));
  const regular=shuffle(pool.filter(q=>!String(q.id).startsWith('quality-')&&!String(q.id).startsWith('curriculum-')));
  const featuredCount=Math.min(featured.length,regular.length?Math.max(1,Math.ceil(count*.8)):count);
  const selected=[...featured.slice(0,featuredCount),...regular.slice(0,Math.max(0,count-featuredCount))];
  if(selected.length<count)selected.push(...featured.slice(featuredCount,featuredCount+(count-selected.length)));
  startQuestionSet(shuffle(selected),{mode:category||'all',category:category||'',difficulty,count:Math.min(count,selected.length)});
}
function startSpecificQuestion(questionId){
  return offerResume(()=>{
    const question=bank.find(q=>q.id===questionId);
    if(!question){ alert('문제를 찾을 수 없습니다.'); return; }
    startQuestionSet([question],{mode:'single-question',category:question.category,difficulty:questionDifficulty(question),count:1});
  });
}
function startInterviewMode(){
  return offerResume(()=>{
    const pool=bank.filter(q=>q.interviewAnswer||q.interviewPoint||(q.followUpQuestions||[]).length||q.follow);
    startQuestionSet(shuffle(pool),{mode:'interview',category:'면접 모드',difficulty:'',count:10});
  });
}
function startWeakReview(){
  const category=weakCategory();
  if(category) return start(category,false,10);
  if((saved.wrong||[]).length) return start(null,true,Math.min(10,saved.wrong.length));
  return start(null,false,10);
}
function startTodayReview(){
  if((saved.wrong||[]).length) return start(null,true,Math.min(10,saved.wrong.length));
  const now=new Date();
  const reviewId=(learning.review||[])[0]||Object.entries(learning.completed||{}).find(([,v])=>v.reviewAt&&new Date(v.reviewAt)<=now)?.[0];
  if(reviewId&&renderConceptFromId(reviewId)) return;
  start();
}
function openAxMode(){
  show('studyView');
  renderStudyCategory(window.ATLAS_CURRICULUM?.['AI & Design']?'AI & Design':'AX Scenario');
}
window.startBackendAtlasQuestion=startSpecificQuestion;

function renderQuestion(){
  const q = state.session[state.index];
  $('counter').textContent = `${state.index + 1} / ${state.session.length}`;
  $('progressBar').style.width = `${state.index / state.session.length * 100}%`;
  $('questionCategory').textContent = q.category;
  $('questionLevel').textContent = `${questionDifficulty(q)} · ${q.type||'concept'}`;
  $('questionText').textContent = questionTitle(q);
  $('questionHint').textContent = q.hint || '답변 구조와 trade-off를 먼저 떠올려보세요.';
  $('options').innerHTML = q.options.map((o,i) => `<button class="option" data-index="${i}"><b>${String.fromCharCode(65+i)}.</b> ${o}</button>`).join('');
  $('answerPanel').hidden = true;
  $('whyPanel').hidden = true;
  $('whyPanel').innerHTML = '';
  $('whyBtn').textContent = 'Why? 더 깊게 보기';
  $('nextBtn').hidden = true;
  $('keyPoints').innerHTML = (q.points || []).map(p => `<li><button type="button" class="detail-pill" data-detail="${p}">${p}</button><div class="detail-body" data-detail-body="${p}" hidden>${explainPoint(p, q)}</div></li>`).join('');
  $('followUp').innerHTML = (q.followUpQuestions || []).map((f,i) => `<button type="button" class="followup-pill" data-follow="${i}" aria-expanded="false">${f}</button><div class="detail-body" data-follow-body="${i}" hidden><strong>먼저 답한 뒤 비교:</strong> ${followUpAnswer(q,i)}</div>`).join('');
  document.querySelectorAll('.option').forEach(b => b.onclick = () => answer(Number(b.dataset.index)));
  const prior=state.selectedAnswers?.[q.id];if(Number.isInteger(prior))answer(prior,true);
}

function answer(selected,restoring=false){
  const q = state.session[state.index];
  if(state.selectedAnswers?.[q.id]!==undefined&&!restoring)return;
  window.currentQuestion = q;
  const correct = selected === q.answer;
  if(!restoring)state.answers.push({ q, correct });
  state.selectedAnswers=state.selectedAnswers||{};state.answerResults=state.answerResults||{};state.selectedAnswers[q.id]=selected;state.answerResults[q.id]=correct;
  if (correct&&!restoring) state.score++;
  if(!restoring)saved.solved++;
  const today = kstDateKey();
  if(!restoring)saved.daily[today] = (saved.daily[today] || 0) + 1;
  saved.categoryStats[q.category] = saved.categoryStats[q.category] || {solved:0,correct:0};
  if(!restoring)saved.categoryStats[q.category].solved++;
  if (correct) {
    if(!restoring){saved.correct++;saved.categoryStats[q.category].correct++;}
    saved.wrong = saved.wrong.filter(id => id !== q.id);
  } else if (!saved.wrong.includes(q.id)) {
    saved.wrong.push(q.id);
  }
  if(!restoring){updateStreak();save();persistQuizSession();}
  document.querySelectorAll('.option').forEach((b,i) => {
    b.disabled = true;
    if (i === q.answer) b.classList.add('correct');
    if (i === selected && !correct) b.classList.add('wrong');
  });
  $('resultLabel').textContent = correct ? '정답입니다.' : '아쉽습니다. 답변 구조를 확인하세요.';
  $('resultLabel').className = 'result-label ' + (correct ? 'good' : 'bad');
  $('explanation').textContent = q.explanation;
  $('correctAnswer').textContent = `${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}`;
  $('optionReasons').innerHTML = q.optionReasons.map((reason,i)=>`<div class="option-reason ${i===q.answer?'is-correct':''}"><b>${String.fromCharCode(65+i)}</b><span>${reason}</span></div>`).join('');
  $('practicalUse').textContent = q.practicalUse;
  $('interviewAnswer').textContent = q.interviewAnswer;
  $('similarQuestions').innerHTML = bank.filter(x=>x.id!==q.id&&x.category===q.category&&(x.tags||[]).some(t=>(q.tags||[]).includes(t))).slice(0,3).map(x=>`<button data-similar="${x.id}">${x.question}</button>`).join('') || '<span>관련 문제를 준비 중입니다.</span>';
  $('keyPoints').innerHTML = (q.points || []).map(p => `<li><button type="button" class="detail-pill" data-detail="${p}">${p}</button><div class="detail-body" data-detail-body="${p}" hidden>${explainPoint(p, q)}</div></li>`).join('');
  $('followUp').innerHTML = (q.followUpQuestions || []).map((f,i) => `<button type="button" class="followup-pill" data-follow="${i}" aria-expanded="false">${f}</button><div class="detail-body" data-follow-body="${i}" hidden><strong>먼저 답한 뒤 비교:</strong> ${followUpAnswer(q,i)}</div>`).join('');
  $('answerPanel').hidden = false;
  $('nextBtn').hidden = false;
  $('nextBtn').textContent = state.index === state.session.length - 1 ? '결과 보기' : '다음 문제';
  setTimeout(() => {$('answerPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });$('resultLabel').tabIndex=-1;$('resultLabel').focus({preventScroll:true});}, 80);
  setTimeout(() => {
    document.querySelectorAll('[data-detail]').forEach(btn => btn.onclick = () => {
      const body = document.querySelector(`[data-detail-body="${CSS.escape(btn.dataset.detail)}"]`);
      if (!body) return;
      body.hidden = !body.hidden;
    });
    document.querySelectorAll('[data-follow]').forEach(btn => btn.onclick = () => {
      const body = document.querySelector(`[data-follow-body="${CSS.escape(btn.dataset.follow)}"]`);
      if (!body) return;
      body.hidden = !body.hidden;
      btn.setAttribute('aria-expanded',String(!body.hidden));
    });
    document.querySelectorAll('[data-similar]').forEach(btn=>btn.onclick=()=>{
      const target=bank.find(x=>x.id===btn.dataset.similar); if(!target) return;
      state.session=[target];state.index=0;state.score=0;state.answers=[];renderQuestion();
    });
  }, 0);
}

function next(){ if (++state.index < state.session.length){persistQuizSession();renderQuestion();} else results(); }

function results(){
  persistQuizSession(true);archiveQuizSession('completed');
  show('resultView');
  const total=state.session.length;
  const scoreRate=total?state.score/total:0;
  $('finalScore').textContent = state.score;
  $('finalTotal').textContent = `/ ${total}`;
  $('resultMessage').textContent = scoreRate >= .8 ? '핵심 개념이 안정적입니다. 꼬리질문 답변을 소리 내어 연습하세요.' : scoreRate >= .5 ? '기본기는 좋습니다. 오답의 핵심 문장을 다시 설명해보세요.' : '오답 복습부터 시작해 답변 구조를 짧게 만드는 것이 좋습니다.';
  const cats = [...new Set(state.answers.map(a => a.q.category))];
  $('resultBreakdown').innerHTML = cats.map(c => {
    const rows = state.answers.filter(a => a.q.category === c);
    return `<div class="breakdown-row"><span>${c}</span><strong>${rows.filter(a => a.correct).length} / ${rows.length}</strong></div>`;
  }).join('');
  $('retryWrongBtn').disabled = !state.answers.some(a => !a.correct);
}

function openStudy(query,record=true){
  show('knowledgeView',false);
  if(record) pushNavigation({route:'search',query});
  $('knowledgeSearchInput').value = query;
  if (typeof window.renderKnowledgeSearch === 'function') {
    window.renderKnowledgeSearch(query);
  }
}
window.openAtlasSearch=openStudy;

$('startBtn').onclick = () => start();
$('bulkBtn').onclick = () => start(null, false, bank.length);
$('allBtn').onclick = () => start();
$('wrongBtn').onclick = () => start(null, true);
$('reviewTodayBtn').onclick = startTodayReview;
$('weakTopicBtn').onclick = startWeakReview;
$('interviewModeBtn').onclick = () => window.openInterviewLab?.();
$('backendStudyBtn').onclick = () => { location.href = './backend-study/'; };
$('axModeBtn').onclick = openAxMode;
$('quitBtn').onclick = () => {persistQuizSession();safeBack(()=>show('homeView'));};
$('nextBtn').onclick = next;
$('homeBtn').onclick = () => show('homeView');
$('resetBtn').closest('header').querySelector('.brand').onclick = event => {event.preventDefault();show('homeView');};
$('studyOpenBtn').onclick = () => { show('studyView'); renderAtlasStudy(); };
$('studyBackBtn').onclick = window.safeAtlasBack;
$('knowledgeBackBtn').onclick = window.safeAtlasBack;
$('navHomeBtn').onclick = () => show('homeView');
$('navStudyBtn').onclick = () => { show('studyView'); renderAtlasStudy(); };
$('navQuizBtn').onclick = () => start();
$('navInterviewBtn').onclick = () => window.openInterviewLab?.();
$('navSearchBtn').onclick = () => show('knowledgeView');
$('navArchitectureBtn').onclick = () => { show('architectureView'); renderArchitectureHome(false); };
$('architectureBackBtn').onclick = window.safeAtlasBack;
$('retryWrongBtn').onclick = () => {
  const wrong = state.answers.filter(a => !a.correct).map(a => a.q);
  if (!wrong.length) return;
  startQuestionSet(shuffle(wrong),{mode:'retry-wrong',category:'오답 재시도',count:wrong.length});
};
$('resetBtn').onclick = () => {
  if (confirm('학습 기록과 오답을 모두 초기화할까요?')) {
    Object.assign(saved, { solved: 0, correct: 0, wrong: [], last: '', streak: 0,daily:{},categoryStats:{},reviewSchedule:{} });
    Object.assign(learning,{schemaVersion:2,saved:[],review:[],completed:{},ui:{}});
    discardStoredValue(SESSION_KEY);
    discardStoredValue(HISTORY_KEY);
    persistLearning();
    save();
    $('appStatus').textContent='이 기기의 학습 기록을 모두 초기화했습니다.';
  }
};

renderCategories();
renderChapterPreview();
renderStats();
if (typeof window.renderStudyOverview === 'function') renderStudy();
function restoreInitialRoute(){
  const raw=location.hash.replace(/^#/,'');
  let route,parts;
  try{
    [route,...parts]=raw.split('/').map(part=>decodeURIComponent(part||''));
  }catch{
    fallbackToHome();
    return;
  }
  if(route==='study-category'&&parts[0]&&window.ATLAS_CURRICULUM?.[parts[0]]){const initial={route,category:parts[0],atlasDepth:0};history.replaceState(initial,'',stateHash(initial));renderStudyCategory(parts[0],false);return;}
  if(route==='concept'&&parts[0]&&/^\d+$/.test(parts[1]||'')&&/^\d+$/.test(parts[2]||'')){
    const sectionIndex=Number(parts[1]),conceptIndex=Number(parts[2]);
    if(getConceptLocation(parts[0],sectionIndex,conceptIndex)){
      const initial={route,category:parts[0],sectionIndex,conceptIndex,atlasDepth:0};
      history.replaceState(initial,'',stateHash(initial));
      renderConceptDetail(initial.category,initial.sectionIndex,initial.conceptIndex,false);
      return;
    }
  }
  if(route==='search'){const query=parts.join('/');const initial={route,query,atlasDepth:0};history.replaceState(initial,'',stateHash(initial));show('knowledgeView',false);$('knowledgeSearchInput').value=query;setTimeout(()=>window.renderKnowledgeSearch?.(query),0);return;}
  if(route==='architecture'){const initial={route,atlasDepth:0};history.replaceState(initial,'',stateHash(initial));show('architectureView',false);renderArchitectureHome(false);return;}
  if(route==='project'&&parts[0]&&window.ATLAS_PROJECTS?.[parts[0]]){const initial={route,project:parts[0],atlasDepth:0};history.replaceState(initial,'',stateHash(initial));renderProjectGuide(parts[0],false);return;}
  if(route==='view'&&$(parts[0])?.classList.contains('view')){const initial={route,name:parts[0],atlasDepth:0};history.replaceState(initial,'',stateHash(initial));show(initial.name,false);return;}
  fallbackToHome();
}
restoreInitialRoute();
if(!educationContractValid){
  document.querySelectorAll('.view').forEach(view=>view.classList.remove('active'));
  $('educationContractError').hidden=false;
  document.querySelectorAll('main button:not([data-education-retry]), .bottom-nav button, header button').forEach(button=>{button.disabled=true;button.setAttribute('aria-disabled','true');});
  document.querySelector('[data-education-retry]').onclick=()=>location.reload();
  $('appStatus').textContent='검수된 학습 자료를 불러오지 못해 문제와 해설을 차단했습니다.';
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)persistQuizSession();});
window.addEventListener('beforeunload',()=>{persistQuizSession();replaceCurrentSnapshot();});
if(window.Capacitor?.isNativePlatform?.())window.Capacitor.Plugins?.App?.addListener('backButton',()=>{persistQuizSession();if(history.state?.route==='view'&&history.state?.name==='homeView')window.Capacitor.Plugins.App.exitApp();else safeBack(()=>show('homeView'));});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=interview-lab-v1');
