(function initLearningOs(){
  const bank = window.QUESTION_BANK;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = v => String(v ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const questionTitle = q => q.question || q.q || '질문 준비 중';
  const questionDifficulty = q => q.difficulty || q.level || '기본';

  const index = bank.map(q => ({
    q,
    text: norm([
      questionTitle(q),
      q.explanation,
      (q.tags || []).join(' '),
      JSON.stringify(q.metadata),
      (q.relatedTopics || []).join(' '),
      q.whyExplanation,
      q.practicalScenario || '',
    ].join(' '))
  }));

  const saved = () => JSON.parse(localStorage.getItem('interviewDeck') || '{"wrong":[]}');

  function filters(){
    return {
      category: document.getElementById('categoryFilter').value,
      difficulty: document.getElementById('difficultyFilter').value,
      tag: document.getElementById('tagFilter').value,
      scenario: document.getElementById('scenarioFilter').checked,
      wrong: document.getElementById('wrongFilter').checked,
    };
  }

  function matchesFilter(q, filter, wrongSet){
    if (filter.category && q.category !== filter.category) return false;
    if (filter.difficulty && q.difficulty !== filter.difficulty && q.level !== filter.difficulty) return false;
    if (filter.tag && !(q.tags || []).some(t => norm(t).includes(norm(filter.tag)))) return false;
    if (filter.scenario && !q.practicalScenario) return false;
    if (filter.wrong && !wrongSet.has(q.id)) return false;
    return true;
  }

  function scoreQuestion(q, terms, wrongSet){
    let score = wrongSet.has(q.id) ? 1 : 0;
    for (const term of terms) {
      if (norm(questionTitle(q)).includes(term)) score += 5;
      if ((q.tags || []).some(x => norm(x).includes(term))) score += 3;
      if (norm(q.explanation).includes(term)) score += 2;
      if (norm(q.whyExplanation).includes(term)) score += 1;
      if (norm(q.practicalScenario || '').includes(term)) score += 1;
    }
    return score;
  }

  window.searchKnowledge = function(query, filter = filters()){
    const terms = norm(query).split(' ').filter(Boolean);
    const wrongSet = new Set(saved().wrong || []);
    return index.map(row => {
      const q = row.q;
      if (terms.length && terms.some(term => !row.text.includes(term))) return null;
      if (!matchesFilter(q, filter, wrongSet)) return null;
      return { question: q, score: scoreQuestion(q, terms, wrongSet), wrong: wrongSet.has(q.id) };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.question.id.localeCompare(b.question.id));
  };

  window.getRelatedQuestions = topic => window.searchKnowledge(topic).slice(0, 20).map(x => x.question);
  window.getWhyExplanation = id => bank.find(q => q.id === id)?.whyExplanation || null;
  window.getLearningPath = topic => window.LEARNING_PATHS[Object.keys(window.LEARNING_PATHS).find(k => norm(topic).includes(norm(k)) || norm(k).includes(norm(topic)))] || window.LEARNING_PATHS.default;
  window.getInterviewQuestions = topic => window.INTERVIEW_BANK[Object.keys(window.INTERVIEW_BANK).find(k => norm(topic).includes(norm(k)) || norm(k).includes(norm(topic)))] || window.INTERVIEW_BANK.default;

  function chips(topics){
    return `<div class="topic-chips">${topics.map(t => `<button data-topic="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
  }

  function renderRelatedDetails(question){
    return `
      <div class="why-block">
        <details class="study-detail">
          <summary>왜 중요한가</summary>
          <p>${esc(question.whyExplanation)}</p>
        </details>
        <details class="study-detail">
          <summary>실무 사용 예</summary>
          <p>${esc(question.practicalScenario || question.interviewPoint)}</p>
        </details>
        <details class="study-detail">
          <summary>꼬리질문</summary>
          <ul>${question.followUpQuestions.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        </details>
      </div>`;
  }

  function bind(root){
    root.querySelectorAll('[data-topic]').forEach(b => b.onclick = () => openSearch(b.dataset.topic));
  }

	  function renderAtlasWhy(question){
	    const w=question.whyDetails||{};
	    const rows=[['왜 이런 개념이 생겼는가',w.origin||question.whyExplanation],['왜 다른 방식보다 좋은가',w.better||question.interviewPoint],['언제 쓰는가',w.when||question.practicalScenario||question.interviewPoint],['언제 쓰면 안 되는가',w.avoid||'요구사항과 비용을 측정하지 않은 채 관성적으로 적용하면 안 됩니다.'],['실무에서는 어떻게 사용하는가',w.practice||question.practicalScenario||question.interviewPoint],['면접에서는 어떻게 설명하는가',w.interview||question.interviewPoint]];
	    const topics=[...(question.prerequisites||[]),...(question.relatedTopics||[]),...(question.nextTopics||[])];
	    return `<div class="why-block">${rows.map(([h,p],i)=>`<details class="study-detail" ${i===0?'open':''}><summary>${h}</summary><p>${esc(p)}</p></details>`).join('')}<h4>연결해서 학습하기</h4>${chips([...new Set(topics)])}<details class="study-detail"><summary>꼬리 질문</summary><ul>${(question.followUpQuestions||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details></div>`;
	  }
	  window.renderAtlasWhy=renderAtlasWhy;

  function renderProblemCard(q,wrong,store){
    const stat=store.categoryStats?.[q.category];
    const rate=stat?.solved?`${Math.round(stat.correct/stat.solved*100)}%`:'기록 없음';
    const topics=(q.relatedTopics||q.tags||[]).slice(0,6);
    const lastWrong=wrong?'<span class="wrong-mark">최근 틀림</span>':'<span>재시도 가능</span>';
    return `
      <article class="result-item problem-card">
        <div class="problem-meta">
          <span>${esc(q.category)}</span>
          <span>난이도 ${esc(questionDifficulty(q))}</span>
          <span>정답률 ${esc(rate)}</span>
          ${lastWrong}
        </div>
        <h3>${esc(questionTitle(q))}</h3>
        <p>${esc(q.explanation)}</p>
        ${chips(topics)}
        <div class="problem-actions">
          <button class="primary" type="button" data-question-id="${esc(q.id)}">${wrong?'오답 재시도':'이 문제 풀기'}</button>
          <button class="why-inline-button" type="button" data-why="${esc(q.id)}">Why</button>
        </div>
        <div class="why-inline-panel" data-why-panel="${esc(q.id)}" hidden>${renderAtlasWhy(q)}</div>
      </article>`;
  }

  const oneLine = (value, fallback = '연결된 학습 자료를 통해 정의, 동작 원리와 선택 기준을 확인할 수 있습니다.') => {
    const text = String(value || fallback).replace(/\s+/g, ' ').trim();
    return text.length > 220 ? `${text.slice(0, 217)}…` : text;
  };

  function getEncyclopediaEntry(query, results){
    const cleanQuery = String(query || '').trim();
    const top = results[0]?.question;
    const concept = cleanQuery ? window.findCurriculumConcept?.(cleanQuery) : null;
    const title = cleanQuery || concept?.title || '백엔드 지식 백과';
    const definition = concept?.definition || top?.explanation || (cleanQuery
      ? `“${cleanQuery}”와(과) 관련된 백엔드 학습 자료를 정리했습니다. 아래 자료에서 정의와 사용 맥락을 확인하세요.`
      : '궁금한 백엔드 용어를 검색하면 핵심 정의, 동작 원리와 관련 학습 자료를 순서대로 보여드립니다.');
    const principle = concept?.internals || top?.whyExplanation || top?.interviewPoint ||
      (cleanQuery ? `${title}은(는) 요구사항, 성능, 일관성 및 운영 비용을 함께 고려해 선택합니다.` : '학습 자료는 개념의 정의보다 실제 동작과 선택 기준을 함께 이해하도록 구성되어 있습니다.');
    const practice = concept?.practice || top?.practicalUse || top?.practicalScenario || top?.interviewAnswer ||
      '실무에서는 적용 전후의 지표와 실패 조건을 먼저 정하고, 인접한 대안과 trade-off를 비교합니다.';
    const related = [...new Set([
      ...(concept?.related || []),
      ...(top?.tags || []),
      ...(top?.relatedTopics || []),
      ...results.slice(0, 8).flatMap(({ question }) => question.relatedTopics || question.tags || [])
    ])].filter(item => norm(item) !== norm(title)).slice(0, 8);
    return { title, definition, principle, practice, related, concept, top };
  }

  function renderEncyclopediaEntry(entry, resultCount){
    return `
      <article class="encyclopedia-card" aria-label="${esc(entry.title)} 핵심 개념">
        <header class="encyclopedia-heading">
          <p class="eyebrow">BACKEND ENCYCLOPEDIA</p>
          <div><h2>${esc(entry.title)}</h2><span>핵심 개념</span></div>
          <p class="encyclopedia-definition">${esc(oneLine(entry.definition))}</p>
        </header>
        <dl class="encyclopedia-facts">
          <div><dt>핵심 원리</dt><dd>${esc(oneLine(entry.principle))}</dd></div>
          <div><dt>실무 맥락</dt><dd>${esc(oneLine(entry.practice))}</dd></div>
        </dl>
        ${entry.related.length ? `<div class="encyclopedia-related"><strong>함께 보면 좋은 개념</strong>${chips(entry.related)}</div>` : ''}
        <p class="encyclopedia-count">${resultCount ? `연결된 학습 자료 ${resultCount}개` : '검색어를 입력하면 연결된 학습 자료를 함께 보여드립니다.'}</p>
      </article>`;
  }

  function renderSupplementCard(q, wrong){
    const summary = q.whyExplanation || q.explanation || q.practicalScenario || '관련 학습 자료를 열어 핵심 내용을 확인하세요.';
    return `
      <article class="supplement-result">
        <div>
          <p>${esc(q.category || 'Backend')} · ${esc(questionDifficulty(q))}${wrong ? ' · 최근 틀림' : ''}</p>
          <h3>${esc(questionTitle(q))}</h3>
          <span>${esc(oneLine(summary, '관련 학습 자료를 열어 핵심 내용을 확인하세요.'))}</span>
        </div>
        <button class="secondary" type="button" data-question-id="${esc(q.id)}">문제 풀기</button>
      </article>`;
  }

	  function openSearch(query){
    if(window.openAtlasSearch){ window.openAtlasSearch(query); return; }
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('knowledgeView').classList.add('active');
    document.getElementById('knowledgeSearchInput').value = query;
    renderKnowledgeSearch(query);
    scrollTo(0,0);
  }

	  function renderKnowledgeSearch(query){
	    const results = window.searchKnowledge(query, filters());
    const entry = getEncyclopediaEntry(query, results);
    const path = window.getLearningPath(query || entry.top?.relatedTopics?.[0] || 'default');
    const interviews = window.getInterviewQuestions(query || 'default');
    const concept = entry.concept;

    document.getElementById('knowledgeSummary').innerHTML = renderEncyclopediaEntry(entry, results.length);
    document.getElementById('knowledgeResults').innerHTML = results.length ? `
      <section class="knowledge-card secondary-materials">
        <div class="section-title"><div><p class="eyebrow">RELATED LEARNING</p><h2>관련 학습 자료</h2></div><span>상위 ${Math.min(results.length, 8)}개</span></div>
        <p class="section-description">핵심 개념을 확인한 뒤, 필요한 문제를 선택해 학습하세요.</p>
        <div class="supplement-results">${results.slice(0, 8).map(({question:q,wrong}) => renderSupplementCard(q, wrong)).join('')}</div>
      </section>` : (String(query || '').trim() ? '<section class="knowledge-card empty-state">일치하는 자료가 없습니다. 다른 표현으로 검색하거나 상세 필터를 확인하세요.</section>' : '');

    const comparison = concept?.comparison ? `<div class="comparison-table-wrap"><table class="comparison-table"><thead><tr>${concept.comparison.headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${concept.comparison.rows.map(row=>`<tr>${row.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
    document.getElementById('learningPath').innerHTML = `
      <details class="supplement-section"><summary>학습 경로와 비교 보기</summary>
        <div class="supplement-section-body">
          <div class="path-grid">${[['먼저 알아야 하는 것',path.prerequisites],['핵심 개념',path.core],['심화',path.advanced],['실무',path.practical]].map(([t,a]) => `<div><strong>${t}</strong>${chips(a || [])}</div>`).join('')}</div>
          ${comparison}
        </div>
      </details>`;

    const interviewItems = concept ? `<details open><summary>30초 답변</summary><p>${esc(concept.interview || entry.definition)}</p></details>${(concept.tails || []).map(item=>`<details><summary>${esc(item)}</summary><p><b>답변 방향</b> · 내부 원리, 선택 기준, trade-off와 실무 지표를 연결하세요.</p></details>`).join('')}` : interviews.map(([item,keywords]) => `<details><summary>${esc(item)}</summary><p><b>답변 키워드</b> · ${(keywords || []).map(esc).join(' · ')}</p></details>`).join('');
    document.getElementById('interviewSection').innerHTML = `
      <details class="supplement-section"><summary>면접·실무 질문 보기</summary>
        <div class="supplement-section-body interview-list">${interviewItems}</div>
      </details>`;

    bind(document.getElementById('knowledgeView'));
	    document.querySelectorAll('[data-why]').forEach(btn => btn.onclick = () => {
	      const panel = document.querySelector(`[data-why-panel="${CSS.escape(btn.dataset.why)}"]`);
	      if (!panel) return;
	      panel.hidden = !panel.hidden;
	      btn.textContent = panel.hidden ? 'Why' : 'Why 닫기';
	    });
    document.querySelectorAll('[data-question-id]').forEach(btn => btn.onclick = () => {
      if(window.startBackendAtlasQuestion) window.startBackendAtlasQuestion(btn.dataset.questionId);
    });
	  }

  window.renderKnowledgeSearch = renderKnowledgeSearch;
  window.renderStudyOverview = true;

  document.getElementById('homeSearchForm').onsubmit = e => {
    e.preventDefault();
    openSearch(document.getElementById('homeSearchInput').value);
  };
  document.getElementById('knowledgeSearchForm').onsubmit = e => {
    e.preventDefault();
    renderKnowledgeSearch(document.getElementById('knowledgeSearchInput').value);
  };
  ['categoryFilter','difficultyFilter','tagFilter','scenarioFilter','wrongFilter'].forEach(id =>
    document.getElementById(id).addEventListener(id === 'tagFilter' ? 'input' : 'change', () =>
      renderKnowledgeSearch(document.getElementById('knowledgeSearchInput').value))
  );
  document.getElementById('knowledgeBackBtn').onclick = () => {
    history.back();
  };
  document.getElementById('whyBtn').onclick = () => {
    const q = window.currentQuestion;
    if (!q) return;
    const panel = document.getElementById('whyPanel');
    panel.hidden = !panel.hidden;
    document.getElementById('whyBtn').textContent = panel.hidden ? 'Why? 더 깊게 보기' : 'Why? 닫기';
    if (!panel.hidden) {
      panel.innerHTML = renderAtlasWhy(q);
      bind(panel);
      return;
      panel.innerHTML = `
        <div class="why-main">
          <p class="why-summary">${esc(q.whyExplanation)}</p>
          ${chips(q.relatedTopics)}
          <div class="why-links">
            ${window.getRelatedQuestions(q.relatedTopics[0] || q.tags[0]).slice(0,3).map(x => `<button class="why-link" data-topic="${esc(x.relatedTopics?.[0] || x.tags?.[0] || x.category)}">${esc(x.question)}</button>`).join('')}
          </div>
        </div>
        <div class="why-folders">
          <details class="study-detail" open><summary>왜 중요한가</summary><p>${esc(q.whyExplanation)}</p></details>
          <details class="study-detail"><summary>실무 사용 예</summary><p>${esc(q.practicalScenario || q.interviewPoint)}</p></details>
          <details class="study-detail"><summary>꼬리질문</summary><ul>${q.followUpQuestions.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>
        </div>`;
      bind(panel);
      panel.querySelectorAll('[data-topic]').forEach(btn => btn.onclick = () => openSearch(btn.dataset.topic));
      panel.querySelectorAll('.why-link').forEach(btn => btn.onclick = () => openSearch(btn.dataset.topic));
    }
  };
})();
