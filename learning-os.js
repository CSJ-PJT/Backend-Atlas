(function initLearningOs(){
  const bank = window.QUESTION_BANK;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = v => String(v ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

  const index = bank.map(q => ({
    q,
    text: norm([
      q.question,
      q.explanation,
      q.tags.join(' '),
      JSON.stringify(q.metadata),
      q.relatedTopics.join(' '),
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
    if (filter.difficulty && q.difficulty !== filter.difficulty) return false;
    if (filter.tag && !q.tags.some(t => norm(t).includes(norm(filter.tag)))) return false;
    if (filter.scenario && !q.practicalScenario) return false;
    if (filter.wrong && !wrongSet.has(q.id)) return false;
    return true;
  }

  function scoreQuestion(q, terms, wrongSet){
    let score = wrongSet.has(q.id) ? 1 : 0;
    for (const term of terms) {
      if (norm(q.question).includes(term)) score += 5;
      if (q.tags.some(x => norm(x).includes(term))) score += 3;
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
    const top = results[0]?.question;
    const concept = window.findCurriculumConcept?.(query);
    const related = [...new Set(results.slice(0,30).flatMap(x => x.question.relatedTopics))].slice(0,12);
    const path = window.getLearningPath(query || top?.relatedTopics?.[0] || 'default');
    const interviews = window.getInterviewQuestions(query || 'default');
    const graphKey = Object.keys(window.ATLAS_GRAPH||{}).find(k => norm(k)===norm(query)) || top?.relatedTopics?.[0];
    const graphNodes = window.ATLAS_GRAPH?.[graphKey] || related.slice(0,10);

    document.getElementById('knowledgeSummary').innerHTML = `
      <section class="knowledge-card">
        <p class="eyebrow">KNOWLEDGE SUMMARY</p>
        <h2>${esc(query || '전체 지식')}</h2>
        <p>${concept ? esc(concept.summary) : `${results.length.toLocaleString()}개 관련 문제를 찾았습니다. 문제·해설·태그·메타데이터를 통합 검색했습니다.`}</p>
        ${concept ? `<div class="concept-search-summary"><strong>핵심 정의</strong><p>${esc(concept.definition)}</p><strong>내부 동작</strong><p>${esc(concept.internals)}</p></div>` : ''}
        ${chips(concept ? concept.related : related)}
        <div class="knowledge-graph" aria-label="지식 그래프"><button data-topic="${esc(graphKey||query)}">${esc(graphKey||query||'START')}</button>${graphNodes.map(x=>`<span>→</span><button data-topic="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      </section>`;

    document.getElementById('learningPath').innerHTML = `
      <section class="knowledge-card">
        <p class="eyebrow">LEARNING PATH</p>
        <h2>학습 경로</h2>
        <div class="path-grid">
          ${[['먼저 알아야 하는 것',path.prerequisites],['핵심 개념',path.core],['심화',path.advanced],['실무',path.practical]].map(([t,a]) => `<div><strong>${t}</strong>${chips(a)}</div>`).join('')}
        </div>
      </section>`;
    if(concept?.comparison){
      const table=`<div class="comparison-table-wrap"><table class="comparison-table"><thead><tr>${concept.comparison.headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${concept.comparison.rows.map(row=>`<tr>${row.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      document.getElementById('learningPath').innerHTML += `<section class="knowledge-card"><p class="eyebrow">COMPARISON</p><h2>${esc(concept.title)} 비교표</h2>${table}</section>`;
    }

    document.getElementById('interviewSection').innerHTML = `
      <section class="knowledge-card">
        <p class="eyebrow">PRACTICAL QUESTIONS</p>
        <h2>면접 질문 보기</h2>
        <div class="interview-list">
          ${concept ? `<details open><summary>30초 답변</summary><p>${esc(concept.interview)}</p></details>${concept.tails.map(q=>`<details><summary>${esc(q)}</summary><p><b>답변 방향</b> · 내부 원리, 선택 기준, trade-off와 실무 지표를 연결하세요.</p></details>`).join('')}` : interviews.map(([q,k]) => `<details><summary>${esc(q)}</summary><p><b>답변 키워드</b> · ${k.map(esc).join(' · ')}</p></details>`).join('')}
        </div>
      </section>`;

    document.getElementById('knowledgeResults').innerHTML = `
      <section class="knowledge-card">
        <div class="section-title">
          <div>
            <p class="eyebrow">RELATED QUESTIONS</p>
            <h2>관련 문제</h2>
          </div>
          <span>${Math.min(results.length,60)} / ${results.length}</span>
        </div>
        <div class="search-results">
          ${results.slice(0,60).map(({question:q,wrong}) => `
            <article class="result-item">
              <div><span>${esc(q.category)}</span><span>${esc(q.difficulty)}</span>${wrong ? '<span class="wrong-mark">오답</span>' : ''}</div>
              <h3>${esc(q.question)}</h3>
              <p>${esc(q.explanation)}</p>
              ${chips(q.relatedTopics.slice(0,6))}
              <button class="why-inline-button" data-why="${esc(q.id)}">Why</button>
              <div class="why-inline-panel" data-why-panel="${esc(q.id)}" hidden>${renderAtlasWhy(q)}</div>
            </article>`).join('') || '<div class="empty-state">조건에 맞는 결과가 없습니다.</div>'}
        </div>
      </section>`;

    bind(document.getElementById('knowledgeView'));
    document.querySelectorAll('[data-why]').forEach(btn => btn.onclick = () => {
      const panel = document.querySelector(`[data-why-panel="${CSS.escape(btn.dataset.why)}"]`);
      if (!panel) return;
      panel.hidden = !panel.hidden;
      btn.textContent = panel.hidden ? 'Why' : 'Why 닫기';
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
