(function initLearningOs(){
  const bank = window.QUESTION_BANK;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = v => String(v ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const questionTitle = q => q.question || q.q || '질문 준비 중';
  const questionDifficulty = q => q.difficulty || q.level || '기본';
  const safeDecode = value => {
    try { return decodeURIComponent(value); }
    catch { return ''; }
  };

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

  const saved = () => {
    try{
      const parsed=JSON.parse(localStorage.getItem('interviewDeck') || '{"wrong":[]}');
      if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)) return {wrong:[],categoryStats:{}};
      const knownIds=new Set(bank.map(question=>question.id));
      const knownCategories=new Set(bank.map(question=>question.category));
      const wrong=Array.isArray(parsed.wrong)?[...new Set(parsed.wrong.filter(id=>typeof id==='string'&&knownIds.has(id)))]:[];
      const rawCategoryStats=parsed.categoryStats&&typeof parsed.categoryStats==='object'&&!Array.isArray(parsed.categoryStats)?parsed.categoryStats:{};
      const categoryStats=Object.fromEntries(Object.entries(rawCategoryStats).filter(([category,value])=>knownCategories.has(category)&&value&&typeof value==='object'&&!Array.isArray(value)).map(([category,value])=>{
        const solved=Number.isInteger(value.solved)&&value.solved>=0?value.solved:0;
        const correct=Number.isInteger(value.correct)&&value.correct>=0?Math.min(solved,value.correct):0;
        return [category,{solved,correct}];
      }));
      return {...parsed,wrong,categoryStats};
    }catch{
      try{localStorage.removeItem('interviewDeck');}catch{}
      return {wrong:[],categoryStats:{}};
    }
  };

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
	    const misconception=(question.optionReasons||[]).filter((_,index)=>index!==question.answer).slice(0,2).join(' ');
	    const rows=[['왜 이런 개념이 생겼는가',w.origin||question.whyExplanation],['왜 다른 방식보다 좋은가',w.better||question.interviewPoint],['언제 쓰는가',w.when||question.practicalScenario||question.interviewPoint],['어떤 오해를 피해야 하는가',w.avoid||misconception||question.whyExplanation],['실무에서는 어떻게 사용하는가',w.practice||question.practicalScenario||question.interviewPoint],['면접에서는 어떻게 설명하는가',w.interview||question.interviewPoint]];
	    const topics=[...(question.prerequisites||[]),...(question.relatedTopics||[]),...(question.nextTopics||[])];
	    return `<div class="why-block">${rows.map(([h,p],i)=>`<details class="study-detail" ${i===0?'open':''}><summary>${h}</summary><p>${esc(p)}</p></details>`).join('')}<h4>연결해서 학습하기</h4>${chips([...new Set(topics)])}<details class="study-detail"><summary>꼬리 질문</summary>${(question.followUpQuestions||[]).map((item,index)=>`<section class="tail-answer"><strong>${esc(item)}</strong><p>${esc(question.followUpAnswers?.[index]||question.interviewAnswer||question.whyExplanation)}</p></section>`).join('')}</details></div>`;
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
    if(cleanQuery&&!concept&&!top) return null;
    const reviewedConcept = concept?.reviewStatus === 'reviewed' ? concept : null;
    const reviewedQuestion = cleanQuery && !concept && top?.reviewStatus === 'reviewed' ? top : null;
    const contentConcept = concept;
    const title = concept?.title || cleanQuery || '백엔드 지식 백과';
    const definition = contentConcept?.definition || reviewedQuestion?.explanation || '검증된 개념을 검색하면 정의, 동작 원리와 적용 기준을 연결해 보여드립니다.';
    const principle = contentConcept?.internals || reviewedQuestion?.whyExplanation || reviewedQuestion?.interviewPoint || '검색된 문제의 해설과 출처를 확인하세요.';
    const practice = contentConcept?.practice || reviewedQuestion?.practicalScenario || reviewedQuestion?.interviewPoint || '관련 검증 문제에서 실제 적용 조건을 확인하세요.';
    const relatedSource=concept
      ? concept.related||[]
      : cleanQuery
        ? [...(top?.tags||[]),...(top?.relatedTopics||[]),...results.slice(0,8).flatMap(({question})=>question.relatedTopics||question.tags||[])]
        : [];
    const related = [...new Set(relatedSource)].filter(item => norm(item) !== norm(title)).slice(0, 8);
    const sources=contentConcept?.sources||reviewedQuestion?.sources||[];
    const reviewStatus=reviewedConcept?'reviewed-concept':reviewedQuestion?'reviewed-question':concept?'draft':'guide';
    const provenance={
      'reviewed-concept':'직접 출처 대조 검수 완료',
      'reviewed-question':'직접 출처 대조 문항 기반 요약',
      draft:'검토 중인 커리큘럼 초안',
      guide:'검색 안내'
    }[reviewStatus];
    return { title, definition, principle, practice, related, concept, top, reviewedQuestion, sources, reviewStatus, provenance };
  }

  function renderEncyclopediaEntry(entry, resultCount){
    const reviewed=entry.reviewStatus?.startsWith('reviewed');
    return `
      <article class="encyclopedia-card" aria-label="${esc(entry.title)} 핵심 개념">
        <header class="encyclopedia-heading">
          <p class="eyebrow">BACKEND ENCYCLOPEDIA</p>
          <div><h2>${esc(entry.title)}</h2><span class="content-status-badge ${reviewed?'content-status-badge--reviewed':'content-status-badge--draft'}">${esc(entry.provenance)}</span></div>
          <p class="encyclopedia-definition">${esc(oneLine(entry.definition))}</p>
          ${entry.reviewStatus==='draft'?'<p class="draft-content-notice" role="note">직접 출처 검수가 끝나기 전의 참고 초안입니다. 면접 답안이나 완료 학습 기준으로 사용하지 마세요.</p>':''}
        </header>
        <dl class="encyclopedia-facts">
          <div><dt>핵심 원리</dt><dd>${esc(oneLine(entry.principle))}</dd></div>
          <div><dt>실무 맥락</dt><dd>${esc(oneLine(entry.practice))}</dd></div>
        </dl>
        ${entry.related.length ? `<div class="encyclopedia-related"><strong>함께 보면 좋은 개념</strong>${chips(entry.related)}</div>` : ''}
        ${entry.sources.length?`<div class="encyclopedia-sources"><strong>근거 문서</strong>${entry.sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noreferrer">${esc(source.title)}${source.checkedAt?` · 확인 ${esc(source.checkedAt)}`:''} ↗</a>`).join('')}</div>`:''}
        <p class="encyclopedia-count">${resultCount ? `연결된 학습 자료 ${resultCount}개` : '검색어를 입력하면 연결된 학습 자료를 함께 보여드립니다.'}</p>
      </article>`;
  }

  function renderNoVerifiedEntry(query){
    return `<section class="knowledge-card empty-state no-verified-entry" role="status"><p class="eyebrow">NO VERIFIED CONTENT</p><h2>등록된 개념이 없습니다</h2><p>“${esc(query)}”에 대해 검토된 정의나 문제를 찾지 못했습니다. 임의 설명은 생성하지 않습니다.</p><div class="topic-chips"><button data-topic="B-Tree">B-Tree</button><button data-topic="Servlet과 Container">Servlet과 Container</button><button data-topic="Transaction">Transaction</button></div></section>`;
  }

  function renderIncruitHandoff(query){
    const context=window.ATLAS_INCRUIT_CONTEXT;
    if(!context?.job||norm(context.topic)!==norm(query)) return '';
    return `<aside class="knowledge-card incruit-handoff-context" data-testid="incruit-handoff-context"><p class="eyebrow">INCRUIT ATLAS HANDOFF</p><h2>선택한 공고의 면접 준비</h2><p>${esc(context.topic)} 주제를 검색·학습·면접 질문에 연결했습니다.</p></aside>`;
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
    const path = entry?.reviewStatus?.startsWith('reviewed')?window.getLearningPath(query || entry.top?.relatedTopics?.[0] || 'default'):null;
    const concept = entry?.concept;

    document.getElementById('knowledgeSummary').innerHTML = `${renderIncruitHandoff(query)}${entry?renderEncyclopediaEntry(entry, results.length):renderNoVerifiedEntry(query)}`;
    document.getElementById('knowledgeResults').innerHTML = results.length ? `
      <section class="knowledge-card secondary-materials">
        <div class="section-title"><div><p class="eyebrow">RELATED LEARNING</p><h2>관련 학습 자료</h2></div><span>${Math.min(results.length, 8)}개 표시</span></div>
        <p class="section-description">핵심 개념을 확인한 뒤, 필요한 문제를 선택해 학습하세요.</p>
        <div class="supplement-results">${results.slice(0, 8).map(({question:q,wrong}) => renderSupplementCard(q, wrong)).join('')}</div>
      </section>` : '';

    const comparison = concept?.reviewStatus==='reviewed'&&concept.comparison ? `<div class="comparison-table-wrap"><table class="comparison-table"><thead><tr>${concept.comparison.headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${concept.comparison.rows.map(row=>`<tr>${row.map((x,index)=>`<td data-label="${esc(concept.comparison.headers[index]||'')}">${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
    document.getElementById('learningPath').innerHTML = path?`
      <details class="supplement-section"><summary>학습 경로와 비교 보기</summary>
        <div class="supplement-section-body">
          <div class="path-grid">${[['먼저 알아야 하는 것',path.prerequisites],['핵심 개념',path.core],['심화',path.advanced],['실무',path.practical]].map(([t,a]) => `<div><strong>${t}</strong>${chips(a || [])}</div>`).join('')}</div>
          ${comparison}
        </div>
      </details>`:'';

    const reviewedConcept=concept?.reviewStatus==='reviewed'?concept:null;
    const tailAnswers=reviewedConcept?.tailAnswers||[];
    const interviewItems = reviewedConcept ? `<details open><summary>검수 30초 답변</summary><p>${esc(reviewedConcept.interview || entry.definition)}</p></details>${(reviewedConcept.tails || []).map((item,index)=>`<details><summary>${esc(item)}</summary><p><b>먼저 답한 뒤 검수 답안과 비교</b> · ${esc(tailAnswers[index]||reviewedConcept.interview)}</p></details>`).join('')}` : entry?.reviewedQuestion ? (entry.reviewedQuestion.followUpQuestions||[]).map((item,index)=>`<details><summary>${esc(item)}</summary><p><b>검수 답안</b> · ${esc(entry.reviewedQuestion.followUpAnswers?.[index]||entry.reviewedQuestion.interviewPoint||entry.reviewedQuestion.explanation)}</p></details>`).join('') : '';
    document.getElementById('interviewSection').innerHTML = interviewItems?`
      <details class="supplement-section"><summary>면접·실무 질문 보기</summary>
        <div class="supplement-section-body interview-list">${interviewItems}</div>
      </details>`:'';

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

  const categoryFilter=document.getElementById('categoryFilter');
  const categories=[...new Set(bank.map(question=>question.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
  const existingCategoryValues=new Set([...categoryFilter.options].map(option=>option.value));
  categories.forEach(category=>{
    if(existingCategoryValues.has(category)) return;
    const option=document.createElement('option');
    option.value=category;
    option.textContent=category;
    categoryFilter.append(option);
  });

  document.getElementById('homeSearchForm').onsubmit = e => {
    e.preventDefault();
    openSearch(document.getElementById('homeSearchInput').value);
  };
  document.getElementById('knowledgeSearchForm').onsubmit = e => {
    e.preventDefault();
    openSearch(document.getElementById('knowledgeSearchInput').value);
  };
  ['categoryFilter','difficultyFilter','tagFilter','scenarioFilter','wrongFilter'].forEach(id =>
    document.getElementById(id).addEventListener(id === 'tagFilter' ? 'input' : 'change', () =>
      renderKnowledgeSearch(document.getElementById('knowledgeSearchInput').value))
  );
  document.getElementById('knowledgeBackBtn').onclick = () => {
    if(typeof window.safeAtlasBack==='function') window.safeAtlasBack();
    else history.back();
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
    }
  };

  const handoffParams=new URLSearchParams(window.location.search);
  const handoffTopic=handoffParams.get('topic')?.trim();
  const handoffJob=handoffParams.get('job')?.trim();
  if(handoffTopic){
    window.ATLAS_INCRUIT_CONTEXT={job:handoffJob||'',topic:handoffTopic};
    window.openAtlasSearch?.(handoffTopic,false);
    history.replaceState({route:'search',query:handoffTopic,job:handoffJob||'',source:'incruit',atlasDepth:0},'',`${location.pathname}${location.search}#search/${encodeURIComponent(handoffTopic)}`);
  }else if(location.hash.startsWith('#search/')){
    const hashQuery=safeDecode(location.hash.slice('#search/'.length));
    if(hashQuery){
      document.getElementById('knowledgeSearchInput').value=hashQuery;
      renderKnowledgeSearch(hashQuery);
    }else{
      history.replaceState({route:'search',query:'',atlasDepth:0},'',`${location.pathname}${location.search}#search`);
      renderKnowledgeSearch('');
    }
  }
})();
