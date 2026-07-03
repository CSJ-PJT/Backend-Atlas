const $ = id => document.getElementById(id);
const bank = window.QUESTION_BANK;
const state = { session: [], index: 0, score: 0, answers: [], mode: 'all', count: 10 };
const saved = Object.assign({solved:0,correct:0,wrong:[],last:'',streak:0,daily:{},categoryStats:{},reviewSchedule:{}}, JSON.parse(localStorage.getItem('interviewDeck') || '{}'));
const icons = {'OS & Network':'⌘','Database':'▦','Java & Spring':'◆','Web & React':'◌','DevOps':'△','AI & Design':'✦','AX Scenario':'◎'};

function save(){ localStorage.setItem('interviewDeck', JSON.stringify(saved)); renderStats(); }
function renderStats(){
  $('totalStat').textContent = bank.length;
  $('solvedStat').textContent = saved.solved;
  $('rateStat').textContent = saved.solved ? Math.round(saved.correct / saved.solved * 100) + '%' : '0%';
  $('streak').textContent = `연속 ${saved.streak || 0}일`;
  const today = new Date().toISOString().slice(0,10);
  const todayCount = saved.daily?.[today] || 0;
  $('todayGoal').textContent = `${Math.min(todayCount,20)} / 20`;
  $('goalBar').style.width = `${Math.min(100,todayCount/20*100)}%`;
  $('reviewDue').textContent = `${saved.wrong.length}문제`;
  const ranked = Object.entries(saved.categoryStats||{}).filter(([,v])=>v.solved).sort((a,b)=>(a[1].correct/a[1].solved)-(b[1].correct/b[1].solved));
  $('weakArea').textContent = ranked[0]?.[0] || '학습 시작';
  $('recommendation').textContent = ranked[0] ? `정답률 ${Math.round(ranked[0][1].correct/ranked[0][1].solved*100)}% · 오답부터 복습` : '첫 진단을 시작하세요';
}
function categoryDesc(c){
  return {'OS & Network':'동시성, TCP/IP, HTTP','Database':'SQL, JPA, PostgreSQL','Java & Spring':'JVM, AOP, 트랜잭션','Web & React':'상태, 브라우저, 모바일','DevOps':'Docker, 관측성, 배포','AI & Design':'RAG, Agent, Workflow','AX Scenario':'장애 분석, 복구, 운영 판단'}[c] || '';
}
function explainPoint(text, q){
  return q.pointDetails?.[text] || q.explanations?.[text] || `${text}는 ${q.category}에서 실제 설계와 운영 판단의 기준이 됩니다. ${q.whyExplanation}`;
}
function shuffle(a){ return [...a].sort(() => Math.random() - 0.5); }
function show(name){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(name).classList.add('active');
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const navMap = { homeView:'navHomeBtn', studyView:'navStudyBtn', quizView:'navQuizBtn', knowledgeView:'navSearchBtn' };
  const navId = navMap[name];
  if (navId && $(navId)) $(navId).classList.add('active');
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
  document.querySelectorAll('.category-card').forEach(b => b.onclick = () => start(b.dataset.category));
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

function updateStreak(){
  const today = new Date().toISOString().slice(0,10);
  if (saved.last === today) return;
  const prev = new Date(Date.now() - 86400000).toISOString().slice(0,10);
  saved.streak = saved.last === prev ? (saved.streak || 0) + 1 : 1;
  saved.last = today;
}

function start(category, onlyWrong = false, count = 10){
  let pool = onlyWrong ? bank.filter(q => saved.wrong.includes(q.id)) : category ? bank.filter(q => q.category === category) : bank;
  if (!pool.length) { alert('복습할 오답이 없습니다.'); return; }
  state.count = count;
  state.session = shuffle(pool).slice(0, count);
  state.index = 0;
  state.score = 0;
  state.answers = [];
  state.mode = category || 'all';
  show('quizView');
  renderQuestion();
}

function renderQuestion(){
  const q = state.session[state.index];
  $('counter').textContent = `${state.index + 1} / ${state.session.length}`;
  $('progressBar').style.width = `${state.index / state.session.length * 100}%`;
  $('questionCategory').textContent = q.category;
  $('questionLevel').textContent = q.level;
  $('questionText').textContent = q.q;
  $('questionHint').textContent = q.hint;
  $('options').innerHTML = q.options.map((o,i) => `<button class="option" data-index="${i}"><b>${String.fromCharCode(65+i)}.</b> ${o}</button>`).join('');
  $('answerPanel').hidden = true;
  $('whyPanel').hidden = true;
  $('whyPanel').innerHTML = '';
  $('whyBtn').textContent = 'Why? 더 깊게 보기';
  $('nextBtn').hidden = true;
  $('keyPoints').innerHTML = (q.points || []).map(p => `<li><button type="button" class="detail-pill" data-detail="${p}">${p}</button><div class="detail-body" data-detail-body="${p}" hidden>${explainPoint(p, q)}</div></li>`).join('');
  $('followUp').innerHTML = (q.followUpQuestions || []).map((f,i) => `<button type="button" class="followup-pill" data-follow="${i}">${f}</button><div class="detail-body" data-follow-body="${i}" hidden>${f}는 ${q.interviewPoint || q.whyExplanation}</div>`).join('');
  document.querySelectorAll('.option').forEach(b => b.onclick = () => answer(Number(b.dataset.index)));
}

function answer(selected){
  const q = state.session[state.index];
  window.currentQuestion = q;
  const correct = selected === q.answer;
  state.answers.push({ q, correct });
  if (correct) state.score++;
  saved.solved++;
  const today = new Date().toISOString().slice(0,10);
  saved.daily[today] = (saved.daily[today] || 0) + 1;
  saved.categoryStats[q.category] = saved.categoryStats[q.category] || {solved:0,correct:0};
  saved.categoryStats[q.category].solved++;
  if (correct) {
    saved.correct++;
    saved.categoryStats[q.category].correct++;
    saved.wrong = saved.wrong.filter(id => id !== q.id);
  } else if (!saved.wrong.includes(q.id)) {
    saved.wrong.push(q.id);
  }
  updateStreak();
  save();
  document.querySelectorAll('.option').forEach((b,i) => {
    b.disabled = true;
    if (i === q.answer) b.classList.add('correct');
    if (i === selected && !correct) b.classList.add('wrong');
  });
  $('resultLabel').textContent = correct ? '정답입니다.' : '아쉽습니다. 답변 구조를 확인하세요.';
  $('resultLabel').className = 'result-label ' + (correct ? 'good' : 'bad');
  $('explanation').textContent = q.explanation;
  $('keyPoints').innerHTML = (q.points || []).map(p => `<li><button type="button" class="detail-pill" data-detail="${p}">${p}</button><div class="detail-body" data-detail-body="${p}" hidden>${explainPoint(p, q)}</div></li>`).join('');
  $('followUp').innerHTML = (q.followUpQuestions || []).map((f,i) => `<button type="button" class="followup-pill" data-follow="${i}">${f}</button><div class="detail-body" data-follow-body="${i}" hidden>${f}는 ${q.interviewPoint || q.whyExplanation}</div>`).join('');
  $('answerPanel').hidden = false;
  $('nextBtn').hidden = false;
  $('nextBtn').textContent = state.index === state.session.length - 1 ? '결과 보기' : '다음 문제';
  setTimeout(() => $('answerPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
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
    });
  }, 0);
}

function next(){ if (++state.index < state.session.length) renderQuestion(); else results(); }

function results(){
  show('resultView');
  $('finalScore').textContent = state.score;
  $('resultMessage').textContent = state.score >= 8 ? '핵심 개념이 안정적입니다. 꼬리질문 답변을 소리 내어 연습하세요.' : state.score >= 5 ? '기본기는 좋습니다. 오답의 핵심 문장을 다시 설명해보세요.' : '오답 복습부터 시작해 답변 구조를 짧게 만드는 것이 좋습니다.';
  const cats = [...new Set(state.answers.map(a => a.q.category))];
  $('resultBreakdown').innerHTML = cats.map(c => {
    const rows = state.answers.filter(a => a.q.category === c);
    return `<div class="breakdown-row"><span>${c}</span><strong>${rows.filter(a => a.correct).length} / ${rows.length}</strong></div>`;
  }).join('');
  $('retryWrongBtn').disabled = !state.answers.some(a => !a.correct);
}

function openStudy(query){
  show('knowledgeView');
  $('knowledgeSearchInput').value = query;
  if (typeof window.renderKnowledgeSearch === 'function') {
    window.renderKnowledgeSearch(query);
  }
}

$('startBtn').onclick = () => start();
$('bulkBtn').onclick = () => start(null, false, 30);
$('allBtn').onclick = () => start();
$('wrongBtn').onclick = () => start(null, true);
$('quitBtn').onclick = () => show('homeView');
$('nextBtn').onclick = next;
$('homeBtn').onclick = () => show('homeView');
$('studyOpenBtn').onclick = () => { show('studyView'); renderAtlasStudy(); };
$('studyBackBtn').onclick = () => show('homeView');
$('knowledgeBackBtn').onclick = () => show('homeView');
$('navHomeBtn').onclick = () => show('homeView');
$('navStudyBtn').onclick = () => { show('studyView'); renderAtlasStudy(); };
$('navQuizBtn').onclick = () => show('quizView');
$('navSearchBtn').onclick = () => show('knowledgeView');
$('retryWrongBtn').onclick = () => {
  const wrong = state.answers.filter(a => !a.correct).map(a => a.q);
  if (!wrong.length) return;
  state.session = shuffle(wrong);
  state.index = 0;
  state.score = 0;
  state.answers = [];
  show('quizView');
  renderQuestion();
};
$('resetBtn').onclick = () => {
  if (confirm('학습 기록과 오답을 모두 초기화할까요?')) {
    Object.assign(saved, { solved: 0, correct: 0, wrong: [], last: '', streak: 0 });
    save();
  }
};

renderCategories();
renderChapterPreview();
renderStats();
if (typeof window.renderStudyOverview === 'function') renderStudy();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
