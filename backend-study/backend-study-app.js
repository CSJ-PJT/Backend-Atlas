(function startBackendStudy(global) {
  'use strict';

  const root = document.getElementById('backendStudyRoot');
  const status = document.getElementById('studyStatus');
  const data = global.BACKEND_STUDY_DATA;
  const stateApi = global.BackendStudyState;
  const answerDrafts = new Map();
  let state = stateApi?.read?.();
  let examSession = null;

  const requiredCollections = ['curriculum', 'questionBank', 'practiceBank', 'sourceManifest', 'qualityContract', 'reviewManifest'];
  const validData = data && stateApi && requiredCollections.every(key => data[key])
    && data.curriculum.chapters?.length === 21
    && data.curriculum.days?.length === 32;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const list = values => `<ul>${(values || []).map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul>`;
  const dayById = id => data.curriculum.days.find(day => day.id === id);
  const chapterById = id => data.curriculum.chapters.find(chapter => chapter.id === id);
  const practiceById = id => data.practiceBank.practices.find(practice => practice.id === id);
  const questionById = id => data.questionBank.questions.find(question => question.id === id);
  const sourceById = id => data.sourceManifest.sources.find(source => source.id === id);
  const completedCount = () => Object.values(state.days).filter(day => day.completedAt).length;
  const dueItems = () => state.reviewQueue.filter(item => Date.parse(item.dueAt) <= Date.now());
  const announce = message => { status.textContent = message; };
  const persist = next => { state = stateApi.write(next); updateHeader(); };

  function updateHeader() {
    const completed = completedCount();
    document.getElementById('headerProgressText').textContent = `${completed} / 32 DAY`;
    document.getElementById('headerProgressBar').style.width = `${completed / 32 * 100}%`;
  }

  function parseRoute() {
    const query = new URLSearchParams(location.search);
    const view = ['home', 'day', 'exam', 'review', 'progress'].includes(query.get('view')) ? query.get('view') : 'home';
    const day = /^D(?:0[1-9]|[12]\d|3[0-2])$/.test(query.get('day') || '') ? query.get('day') : null;
    const sectionNames = ['learn', 'worked', 'guided', 'independent', 'verify', 'quiz', 'complete'];
    const section = sectionNames.includes(query.get('section')) ? query.get('section') : 'learn';
    return { view, day, section };
  }

  function route(next, { replace = false, focus = true } = {}) {
    const query = new URLSearchParams();
    if (next.view && next.view !== 'home') query.set('view', next.view);
    if (next.day) query.set('day', next.day);
    if (next.section && next.view === 'day' && next.section !== 'learn') query.set('section', next.section);
    const url = `${location.pathname}${query.size ? `?${query}` : ''}`;
    history[replace ? 'replaceState' : 'pushState']({}, '', url);
    render();
    if (focus) root.focus({ preventScroll: true });
  }

  function updateNavigation(active) {
    document.querySelectorAll('[data-study-route]').forEach(button => {
      button.setAttribute('aria-current', button.dataset.studyRoute === active ? 'page' : 'false');
    });
  }

  function sourceLinks(ids) {
    const sources = (ids || []).map(sourceById).filter(Boolean);
    return sources.length
      ? `<div class="source-list">${sources.map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(source.title)}</strong><br><small>${escapeHtml(source.authority)} · 확인 ${escapeHtml(source.checkedAt)}</small></a>`).join('')}</div>`
      : '<p>연결된 공식 자료가 없습니다.</p>';
  }

  function sectionHead(eyebrow, title, description = '') {
    return `<div class="section-head"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h2>${escapeHtml(title)}</h2>${description ? `<p>${escapeHtml(description)}</p>` : ''}</div></div>`;
  }

  function renderHome() {
    updateNavigation('home');
    const completed = completedCount();
    const nextDay = data.curriculum.days.find(day => !state.days[day.id]?.completedAt) || data.curriculum.days.at(-1);
    const weak = Object.entries(state.weakTopics).filter(([, weight]) => weight > 0).sort((left, right) => right[1] - left[1]).slice(0, 6);
    const due = dueItems().length;
    root.innerHTML = `
      <section class="hero-panel">
        <p class="eyebrow">BACKEND PRACTICE SYSTEM · 32 DAYS</p>
        <h1>원리를 이해하고,<br>실패를 재현하고,<br>증거로 검증하세요.</h1>
        <p>Java·Spring·Database·Batch·Messaging·분산 시스템을 개념 암기가 아닌 관찰 가능한 실무 루프로 익힙니다.</p>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-open-day="${nextDay.id}">${completed ? '이어서 학습' : 'DAY 01 시작'}</button>
          <button class="secondary-button" type="button" data-open-view="exam">진단 시험</button>
          <a class="secondary-button" href="../docs/backend-study/Backend-Atlas-백엔드-실무-학습-32일.pdf" target="_blank" rel="noreferrer">인쇄용 32일 가이드</a>
        </div>
      </section>
      <section class="metric-grid" aria-label="학습 현황">
        <article class="metric-card"><small>완료</small><strong>${completed} / 32일</strong></article>
        <article class="metric-card"><small>실습 완료</small><strong>${Object.values(state.practice).filter(item => item.completed).length}개</strong></article>
        <article class="metric-card"><small>복습 예정</small><strong>${due}문제</strong></article>
        <article class="metric-card"><small>평가 시도</small><strong>${Object.values(state.quiz).reduce((sum, item) => sum + item.attempts, 0)}회</strong></article>
      </section>
      <section class="today-grid">
        <article class="surface-card today-card">
          <p class="eyebrow">NEXT LEARNING</p>
          <h2>${escapeHtml(nextDay.id)} · ${escapeHtml(nextDay.title)}</h2>
          <p>${escapeHtml(nextDay.purpose)}</p>
          <div class="term-row">${nextDay.terms.slice(0, 6).map(term => `<span>${escapeHtml(term)}</span>`).join('')}</div>
          <div class="card-actions"><button class="primary-button" type="button" data-open-day="${nextDay.id}">학습 열기</button></div>
        </article>
        <article class="surface-card review-summary">
          <p class="eyebrow">RETRIEVAL PRACTICE</p>
          <strong>${due}</strong><span>오늘 회상할 문제</span>
          <div class="weak-list">${weak.length ? weak.map(([topic]) => `<span>${escapeHtml(topic)}</span>`).join('') : '<span>오답을 풀면 약점 지도가 생깁니다.</span>'}</div>
          <button class="secondary-button" type="button" data-open-view="review">복습 큐 열기</button>
        </article>
      </section>
      ${sectionHead('21 CHAPTERS · 32 DAYS', '전체 학습 지도', '각 DAY는 개념, 사례, 안내 실습, 독립 실습, 검증, 회상 평가로 이어집니다.')}
      <section class="chapter-list">${data.curriculum.chapters.map(chapter => `
        <article class="chapter-block">
          <header class="chapter-title"><div><small>CHAPTER ${String(chapter.order).padStart(2, '0')}</small><h3>${escapeHtml(chapter.title)}</h3></div><span>${chapter.dayIds.length} DAY</span></header>
          <div class="day-grid">${chapter.dayIds.map(id => {
            const day = dayById(id);
            const completedDay = Boolean(state.days[id]?.completedAt);
            return `<button class="day-card" type="button" data-open-day="${id}" data-complete="${completedDay}"><span><b>${id}</b><em class="status-chip">${completedDay ? '완료' : '학습'}</em></span><strong>${escapeHtml(day.title)}</strong><small>${escapeHtml(day.objectives[0])}</small></button>`;
          }).join('')}</div>
        </article>`).join('')}
      </section>`;
  }

  const sections = [
    ['learn', '개념'], ['worked', '사례'], ['guided', '안내 실습'], ['independent', '독립 실습'], ['verify', '검증'], ['quiz', '회상'], ['complete', '완료']
  ];

  function dayHeader(day, active) {
    const chapter = chapterById(day.chapterId);
    return `
      <header class="detail-header">
        <div><p class="eyebrow">CHAPTER ${String(chapter.order).padStart(2, '0')} · ${escapeHtml(chapter.title)}</p><h1>${escapeHtml(day.title)}</h1><p>${escapeHtml(day.purpose)}</p></div>
        <span class="day-number">${day.id}</span>
      </header>
      <nav class="section-tabs" aria-label="DAY 학습 단계">${sections.map(([key, label]) => `<button type="button" data-day-section="${key}" aria-selected="${key === active}">${label}</button>`).join('')}</nav>`;
  }

  function renderLearn(day) {
    const learn = day.learn;
    const cards = [
      ['정의', learn.definition], ['왜 필요한가', learn.why], ['내부 동작', learn.internals], ['선택 기준', learn.choiceCriteria]
    ];
    return `<section class="surface-card learning-section">
      <p class="eyebrow">LEARN · CONCEPT FIRST</p><h2>목표와 핵심 개념</h2>
      <h3>학습 목표</h3>${list(day.objectives)}
      <h3>사전 진단</h3>${list(day.diagnostic)}
      <div class="term-row">${day.terms.map(term => `<span>${escapeHtml(term)}</span>`).join('')}</div>
      <div class="concept-grid">${cards.map(([title, body]) => `<article class="concept-panel"><h3>${title}</h3><p>${escapeHtml(body)}</p></article>`).join('')}</div>
      <h3>비교</h3>${list(learn.comparisons)}
      <h3>Trade-off</h3>${list(learn.tradeoffs)}
      <h3>실패 조건</h3>${list(learn.failureConditions)}
      <h3>무엇을 관찰할까</h3>${list(learn.observe)}
      <h3>코드와 명령을 읽는 순서</h3>${list(learn.howToRead)}
      <h3>공식 자료</h3>${sourceLinks(day.sourceRefs)}
      <div class="card-actions"><button class="primary-button" type="button" data-next-section="worked">사례로 이동</button></div>
    </section>`;
  }

  function renderWorked(day) {
    const example = day.workedExample;
    const steps = [
      ['문제', example.problem], ['관찰', example.observations.join(' ')], ['가설', example.hypotheses.join(' ')],
      ['조치', example.action], ['검증', example.validation], ['대안', example.alternatives.join(' ')]
    ];
    return `<section class="surface-card learning-section"><p class="eyebrow">WORKED EXAMPLE</p><h2>문제에서 검증까지</h2>
      <div class="worked-flow">${steps.map(([title, body], index) => `<article class="worked-step"><small>STEP ${index + 1}</small><h3>${title}</h3><p>${escapeHtml(body)}</p></article>`).join('')}</div>
      <h3>판단의 대가</h3>${list(example.tradeoffs)}
      <div class="card-actions"><button class="primary-button" type="button" data-next-section="guided">안내 실습 시작</button></div>
    </section>`;
  }

  function renderPractice(day, mode) {
    const practice = practiceById(mode === 'guided' ? day.guidedPracticeIds[0] : day.independentPracticeIds[0]);
    const steps = mode === 'guided' ? practice.guidedSteps : practice.independentSteps;
    const saved = state.practice[practice.id] || { checkedSteps: [], completed: false };
    const stepOffset = mode === 'guided' ? 0 : 50;
    return `<section class="surface-card learning-section" data-practice-id="${practice.id}">
      <p class="eyebrow">${mode === 'guided' ? 'GUIDED PRACTICE' : 'INDEPENDENT PRACTICE'}</p><h2>${escapeHtml(practice.title)}</h2><p>${escapeHtml(practice.goal)}</p>
      <h3>준비와 안전 경계</h3>${list(practice.prerequisites)}
      ${mode === 'guided' ? `<h3>실행 명령</h3><div class="command-list">${practice.commands.map(command => `<code>${escapeHtml(command)}</code>`).join('')}</div>` : ''}
      <h3>${mode === 'guided' ? '안내 단계' : '스스로 수행할 단계'}</h3>
      <ol class="check-list">${steps.map((step, index) => `<li><label><input type="checkbox" data-practice-step="${stepOffset + index}" ${saved.checkedSteps.includes(stepOffset + index) ? 'checked' : ''}><span>${escapeHtml(step)}</span></label></li>`).join('')}</ol>
      <h3>실패 주입</h3>${list(practice.failureInjection)}
      <h3>관찰 증거</h3>${list(practice.observe)}
      <div class="card-actions"><button class="primary-button" type="button" data-save-practice="${mode}">${saved.completed ? '완료됨' : '단계 저장'}</button><button class="secondary-button" type="button" data-next-section="${mode === 'guided' ? 'independent' : 'verify'}">다음 단계</button></div>
    </section>`;
  }

  function renderVerify(day) {
    const practice = practiceById(day.guidedPracticeIds[0]);
    return `<section class="surface-card learning-section"><p class="eyebrow">VERIFY · EVIDENCE</p><h2>결과가 아니라 인과관계를 증명하세요</h2>
      <h3>검증 체크리스트</h3>${list(day.verify)}
      <h3>회귀 기준</h3>${list(practice.regression)}
      <h3>완료 기준</h3>${list(practice.completionCriteria)}
      <h3>평가 루브릭</h3><div class="table-scroll"><table class="rubric-table"><thead><tr><th>정확성</th><th>설명</th><th>실패 재현</th><th>구현 품질</th><th>증거</th><th>Trade-off</th></tr></thead><tbody><tr>${Object.values(practice.rubric).map(score => `<td>${score}점</td>`).join('')}</tr></tbody></table></div>
      <div class="card-actions"><button class="primary-button" type="button" data-next-section="quiz">회상 평가</button></div>
    </section>`;
  }

  function renderDayQuiz(day) {
    const questions = day.quizIds.map(questionById).filter(Boolean);
    return `<section class="surface-card learning-section"><p class="eyebrow">QUIZ · EXPLAIN</p><h2>답을 보지 않고 먼저 설명하세요</h2><p>선택형은 즉시 채점하며, 서술형 답안은 현재 화면에서만 유지되고 저장되지 않습니다.</p>
      <div class="review-grid">${questions.map(question => `<article class="review-item"><span class="status-chip">${escapeHtml(question.type)} · ${escapeHtml(question.difficulty)}</span><h3>${escapeHtml(question.prompt)}</h3><button class="secondary-button" type="button" data-single-question="${question.id}">풀기</button></article>`).join('')}</div>
      <div class="card-actions"><button class="primary-button" type="button" data-next-section="complete">DAY 완료 점검</button></div>
    </section>`;
  }

  function renderComplete(day) {
    const practice = state.practice[day.guidedPracticeIds[0]];
    const attempted = day.quizIds.filter(id => state.quiz[id]?.attempts).length;
    const done = Boolean(state.days[day.id]?.completedAt);
    return `<section class="surface-card learning-section"><p class="eyebrow">COMPLETE · SCHEDULE REVIEW</p><h2>${done ? '완료했습니다.' : '학습을 닫기 전 확인하세요.'}</h2>
      <div class="progress-grid"><article class="progress-item"><h3>실습</h3><p>${practice?.completed ? '단계 기록 완료' : '실습 단계 확인 필요'}</p></article><article class="progress-item"><h3>회상 평가</h3><p>${attempted} / ${day.quizIds.length}문제 시도</p></article></div>
      <h3>간격 복습</h3><p>권장 간격: ${day.spacedReview.map(days => `${days}일`).join(' · ')}</p>
      <div class="weak-list">${day.weaknessTags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
      <div class="card-actions"><button class="primary-button" type="button" data-complete-day="${day.id}">${done ? '완료 기록됨' : 'DAY 완료 기록'}</button><button class="secondary-button" type="button" data-open-view="home">학습 지도로</button></div>
    </section>`;
  }

  function renderDay(dayId, section) {
    const day = dayById(dayId);
    if (!day) return route({ view: 'home' }, { replace: true });
    updateNavigation('home');
    let content;
    if (section === 'learn') content = renderLearn(day);
    else if (section === 'worked') content = renderWorked(day);
    else if (section === 'guided' || section === 'independent') content = renderPractice(day, section);
    else if (section === 'verify') content = renderVerify(day);
    else if (section === 'quiz') content = renderDayQuiz(day);
    else content = renderComplete(day);
    root.innerHTML = `${dayHeader(day, section)}${content}`;
    const activeTab = root.querySelector('.section-tabs [aria-selected="true"]');
    if (typeof activeTab?.scrollIntoView === 'function') activeTab.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function selectExamQuestions(mode, chapterId) {
    const questions = data.questionBank.questions;
    if (mode === 'today') {
      const id = data.curriculum.days.find(day => !state.days[day.id]?.completedAt)?.id || 'D32';
      return questions.filter(question => question.id.startsWith(`${id}-`));
    }
    if (mode === 'chapter') return questions.filter(question => question.chapterId === chapterId);
    if (mode === 'cumulative') {
      const last = Math.max(1, ...Object.keys(state.days).map(id => Number(id.slice(1))));
      return questions.filter(question => question.day <= last).slice(0, 24);
    }
    return questions.filter((_, index) => index % 6 === 0 || index % 11 === 0).slice(0, 32);
  }

  function beginExam(mode, chapterId = 'CH01', explicitIds = null) {
    const questions = explicitIds ? explicitIds.map(questionById).filter(Boolean) : selectExamQuestions(mode, chapterId);
    examSession = { mode, chapterId, questions, index: 0, score: 0, graded: false, selected: null };
    renderExamQuestion();
  }

  function renderExam() {
    updateNavigation('exam');
    examSession = null;
    root.innerHTML = `${sectionHead('ACTIVE RECALL', '시험과 설명', '먼저 답한 뒤 기준 답안과 비교하고 다음 복습을 예약합니다.')}
      <section class="exam-layout">
        <aside class="surface-card exam-options">
          <button type="button" data-exam-mode="today"><strong>오늘 학습</strong><small>다음 DAY 6문제</small></button>
          <button type="button" data-exam-mode="cumulative"><strong>누적 점검</strong><small>완료 범위 최대 24문제</small></button>
          <button type="button" data-exam-mode="comprehensive"><strong>종합 평가</strong><small>전 범위 32문제</small></button>
          <label for="chapterExam">챕터 선택</label><select id="chapterExam">${data.curriculum.chapters.map(chapter => `<option value="${chapter.id}">${String(chapter.order).padStart(2, '0')} · ${escapeHtml(chapter.title)}</option>`).join('')}</select>
          <button type="button" data-exam-mode="chapter"><strong>챕터 평가</strong><small>선택 범위 6~18문제</small></button>
        </aside>
        <article class="surface-card question-card"><p class="eyebrow">START</p><h2>평가 방식을 선택하세요.</h2><p>서술형·코드·SQL·설계 답안은 브라우저 저장소나 URL에 기록하지 않습니다.</p></article>
      </section>`;
  }

  function renderExamQuestion() {
    updateNavigation('exam');
    const question = examSession.questions[examSession.index];
    if (!question) return renderExamResult();
    const progress = (examSession.index / examSession.questions.length) * 100;
    const isChoice = question.type === 'mcq' && question.choices.length;
    root.innerHTML = `<section class="surface-card question-card" data-question-id="${question.id}">
      <div class="exam-progress"><i style="width:${progress}%"></i></div>
      <p class="eyebrow">${examSession.index + 1} / ${examSession.questions.length}</p>
      <div class="question-meta"><span>${escapeHtml(question.type)}</span><span>${escapeHtml(question.difficulty)}</span><span>${escapeHtml(question.chapterId)}</span></div>
      <h2>${escapeHtml(question.prompt)}</h2>
      ${isChoice ? `<div class="choice-list">${question.choices.map((choice, index) => `<button type="button" data-choice="${index}">${escapeHtml(choice)}</button>`).join('')}</div>` : `<label for="studyAnswer"><strong>내 설명</strong></label><textarea id="studyAnswer" class="answer-box" placeholder="정의 → 내부 동작 → 선택 기준 → 실패/관찰 지점 순서로 적어 보세요.">${escapeHtml(answerDrafts.get(question.id) || '')}</textarea><p class="answer-boundary">답안은 이 화면의 메모리에만 유지되며 새로고침하면 사라집니다.</p>`}
      <div id="answerReference"></div>
      <div class="card-actions">
        ${isChoice ? '' : '<button class="primary-button" type="button" data-reveal-answer>기준 답안 보기</button>'}
        <button class="secondary-button" type="button" data-exit-exam>시험 선택으로</button>
      </div>
    </section>`;
    const textarea = document.getElementById('studyAnswer');
    if (textarea) textarea.addEventListener('input', () => answerDrafts.set(question.id, textarea.value));
  }

  function gradeQuestion(question, correct, selfLabel) {
    if (examSession.graded) return;
    examSession.graded = true;
    examSession.score += correct ? 1 : 0;
    persist(stateApi.scheduleReview(state, question.id, { correct, topics: question.tags.slice(2, 6) }));
    const reference = document.getElementById('answerReference');
    reference.innerHTML = `<section class="reference-answer"><h3>${correct ? '확인 완료' : '복습 큐에 추가됨'}${selfLabel ? ` · ${escapeHtml(selfLabel)}` : ''}</h3><p>${escapeHtml(question.explanation)}</p><h4>평가 기준</h4>${list(Object.entries(question.rubric).map(([key, value]) => `${key}: ${value}점`))}<div class="card-actions"><button class="primary-button" type="button" data-next-question>다음 문제</button></div></section>`;
    announce(correct ? '정답입니다. 다음 복습이 예약되었습니다.' : '오답을 기록하고 1일 뒤 복습을 예약했습니다.');
  }

  function renderExamResult() {
    const total = examSession.questions.length;
    const score = examSession.score;
    root.innerHTML = `<section class="surface-card learning-section"><p class="eyebrow">RESULT</p><h2>${score} / ${total} 확인</h2><p>객관식 정답과 서술형 자기평가를 합산한 학습 기록입니다.</p><div class="weak-list">${Object.entries(state.weakTopics).filter(([, weight]) => weight > 0).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([topic]) => `<span>${escapeHtml(topic)}</span>`).join('') || '<span>누적 약점 없음</span>'}</div><div class="card-actions"><button class="primary-button" type="button" data-open-view="review">복습 큐</button><button class="secondary-button" type="button" data-open-view="exam">다른 평가</button></div></section>`;
  }

  function renderReview() {
    updateNavigation('review');
    const queue = [...state.reviewQueue].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    root.innerHTML = `${sectionHead('SPACED REVIEW', '복습 큐', '오답과 회상 난이도에 따라 1·3·7·14일 간격으로 다시 설명합니다.')}
      <section class="review-grid">${queue.length ? queue.map(item => {
        const question = questionById(item.questionId);
        return `<article class="review-item"><span class="status-chip">${Date.parse(item.dueAt) <= Date.now() ? '오늘 복습' : new Date(item.dueAt).toLocaleDateString('ko-KR')}</span><h3>${escapeHtml(question?.prompt || item.questionId)}</h3><p>${escapeHtml(item.reason)} · ${item.intervalDays}일 간격</p><button class="secondary-button" type="button" data-single-question="${item.questionId}">다시 설명</button></article>`;
      }).join('') : '<div class="empty-state"><strong>복습 큐가 비어 있습니다.</strong><p>DAY 평가를 풀면 다음 회상 일정이 만들어집니다.</p></div>'}</section>`;
  }

  function renderProgress() {
    updateNavigation('progress');
    root.innerHTML = `${sectionHead('LEARNING EVIDENCE', '진도와 약점 지도', '완료 수보다 설명·재현·검증 증거를 우선합니다.')}
      <section class="metric-grid"><article class="metric-card"><small>DAY</small><strong>${completedCount()} / 32</strong></article><article class="metric-card"><small>실습</small><strong>${Object.values(state.practice).filter(item => item.completed).length} / 32</strong></article><article class="metric-card"><small>오답</small><strong>${state.wrong.length}</strong></article><article class="metric-card"><small>복습 큐</small><strong>${state.reviewQueue.length}</strong></article></section>
      <section class="progress-grid">${data.curriculum.days.map(day => {
        const entry = state.days[day.id];
        const attempts = day.quizIds.reduce((sum, id) => sum + (state.quiz[id]?.attempts || 0), 0);
        return `<article class="progress-item"><span class="status-chip">${entry?.completedAt ? '완료' : '진행 전'}</span><h3>${day.id} · ${escapeHtml(day.title)}</h3><p>평가 ${attempts}회 · 실습 ${state.practice[day.guidedPracticeIds[0]]?.completed ? '완료' : '대기'}</p><button class="text-button" type="button" data-open-day="${day.id}">열기</button></article>`;
      }).join('')}</section>`;
  }

  function render() {
    if (!validData) {
      root.innerHTML = '<section class="empty-state" role="alert"><h1>검수된 학습 자료를 불러오지 못했습니다.</h1><p>잘못된 자료로 학습하지 않도록 기능을 차단했습니다. 새로고침 후에도 계속되면 운영자에게 알려 주세요.</p></section>';
      return;
    }
    const current = parseRoute();
    if (current.view === 'day' && current.day) renderDay(current.day, current.section);
    else if (current.view === 'exam') renderExam();
    else if (current.view === 'review') renderReview();
    else if (current.view === 'progress') renderProgress();
    else renderHome();
    updateHeader();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.studyRoute) route({ view: button.dataset.studyRoute });
    if (button.dataset.openView) route({ view: button.dataset.openView });
    if (button.dataset.openDay) route({ view: 'day', day: button.dataset.openDay, section: 'learn' });
    if (button.dataset.daySection || button.dataset.nextSection) {
      const current = parseRoute();
      route({ view: 'day', day: current.day, section: button.dataset.daySection || button.dataset.nextSection });
    }
    if (button.dataset.savePractice) {
      const current = parseRoute();
      const day = dayById(current.day);
      const practice = practiceById(day.guidedPracticeIds[0]);
      const prior = state.practice[practice.id]?.checkedSteps || [];
      const modeOffset = button.dataset.savePractice === 'guided' ? 0 : 50;
      const checkedHere = [...root.querySelectorAll('[data-practice-step]:checked')].map(input => Number(input.dataset.practiceStep));
      const checked = [...new Set([...prior.filter(step => modeOffset === 0 ? step >= 50 : step < 50), ...checkedHere])];
      const required = button.dataset.savePractice === 'guided' ? practice.guidedSteps.length : practice.independentSteps.length;
      const complete = practice.guidedSteps.every((_, index) => checked.includes(index)) && practice.independentSteps.every((_, index) => checked.includes(50 + index));
      persist(stateApi.updatePractice(state, practice.id, checked, complete));
      announce(checkedHere.length === required ? '현재 실습 단계를 완료했습니다.' : `${checkedHere.length} / ${required}단계를 저장했습니다.`);
      renderDay(current.day, current.section);
    }
    if (button.dataset.completeDay) {
      persist(stateApi.completeDay(state, button.dataset.completeDay));
      data.curriculum.days.find(day => day.id === button.dataset.completeDay)?.quizIds.forEach(id => {
        if (!state.reviewQueue.some(item => item.questionId === id)) persist(stateApi.scheduleReview(state, id, { correct: true, topics: [], recordAttempt: false }));
      });
      announce(`${button.dataset.completeDay} 완료와 복습 일정을 기록했습니다.`);
      renderDay(button.dataset.completeDay, 'complete');
    }
    if (button.dataset.examMode) beginExam(button.dataset.examMode, document.getElementById('chapterExam')?.value || 'CH01');
    if (button.dataset.singleQuestion) beginExam('single', 'CH01', [button.dataset.singleQuestion]);
    if (button.dataset.choice !== undefined && examSession && !examSession.graded) {
      const question = examSession.questions[examSession.index];
      const choice = question.choices[Number(button.dataset.choice)];
      root.querySelectorAll('[data-choice]').forEach(item => {
        const value = question.choices[Number(item.dataset.choice)];
        if (value === question.correctAnswer) item.dataset.result = 'correct';
        else if (item === button) item.dataset.result = 'wrong';
        item.disabled = true;
      });
      gradeQuestion(question, choice === question.correctAnswer);
    }
    if (button.hasAttribute('data-reveal-answer') && examSession && !examSession.graded) {
      const question = examSession.questions[examSession.index];
      const draft = document.getElementById('studyAnswer')?.value.trim();
      if (!draft) return announce('먼저 자신의 설명을 적어 주세요.');
      const reference = document.getElementById('answerReference');
      reference.innerHTML = `<section class="reference-answer"><h3>기준 답안과 비교</h3><p>${escapeHtml(question.explanation)}</p><p><strong>내 설명</strong><br>${escapeHtml(draft)}</p><div class="card-actions"><button class="primary-button" type="button" data-self-grade="correct">핵심을 설명함</button><button class="secondary-button" type="button" data-self-grade="wrong">다시 학습 필요</button></div></section>`;
      button.disabled = true;
    }
    if (button.dataset.selfGrade && examSession && !examSession.graded) gradeQuestion(examSession.questions[examSession.index], button.dataset.selfGrade === 'correct', button.textContent.trim());
    if (button.hasAttribute('data-next-question') && examSession) { examSession.index += 1; examSession.graded = false; renderExamQuestion(); }
    if (button.hasAttribute('data-exit-exam')) renderExam();
  });

  document.getElementById('resetStudy').addEventListener('click', () => {
    if (!confirm('이 기기에 저장된 백엔드 실무 학습 진도와 복습 기록을 초기화할까요?')) return;
    localStorage.removeItem(stateApi.STORAGE_KEY);
    state = stateApi.createInitialState();
    answerDrafts.clear();
    announce('이 기기의 백엔드 실무 학습 기록을 초기화했습니다.');
    route({ view: 'home' }, { replace: true });
  });
  global.addEventListener('popstate', render);
  render();
})(window);
