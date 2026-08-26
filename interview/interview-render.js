(function(){
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const modeOptions=[
    ['quick-15','15분 빠른 점검','핵심 8문제'],['core-30','30분 핵심 면접','핵심 15문제'],['technical-60','60분 1차 기술면접','기술·장애 25문제'],['deep-90','90분 심층 기술면접','설계·압박 40문제'],
    ['culture','2차 문화·임원면접','행동·협업'],['career-defense','이력서/경력기술서 방어','사실·수치·역할'],['portfolio-defense','포트폴리오 방어','개인 프로젝트 경계'],['system-design','시스템 설계','요구사항부터 운영까지'],
    ['coding-java','코딩테스트/Java','알고리즘·동시성'],['sql','SQL','쿼리·모델링'],['incident','장애 대응','진단·복구·재발 방지'],['ai-ax','AI/AX','RAG·Agent·권한'],
    ['pressure','압박 꼬리질문','근거와 한계'],['weak-review','오답·약점 복습','낮은 점수 우선'],['dday','D-Day Top 30','마지막 점검']
  ];
  const modeLabel=id=>modeOptions.find(item=>item[0]===id)?.[1]||id;
  function statusLabel(status){return status==='active'?'현재 공식 공고 확인':status==='needs-confirmation'?'정확한 직무 확인 필요':status;}
  function safeExternalUrl(value){try{const url=new URL(String(value||''));return url.protocol==='https:'?url.href:'';}catch{return '';}}
  function jobBriefing(bundle,job,compact=false){
    if(!job)return '';
    const facts=new Map((bundle.facts||[]).map(fact=>[fact.id,fact]));
    const sources=(job.sourceRefs||[]).map(id=>(bundle.sources||[]).find(source=>source.id===id)).filter(Boolean);
    const evidence=(job.candidateEvidenceMap||[]).map(item=>({requirement:item.requirement,facts:(item.factIds||[]).map(id=>facts.get(id)).filter(Boolean)}));
    const learningQueue=[...(job.riskGaps||[]).map(item=>`경계 확인 · ${item}`),...(job.preferredSkills||[]).map(item=>`보완 학습 · ${item}`),...(job.requiredSkills||[]).map(item=>`필수 복습 · ${item}`)].slice(0,6);
    const officialUrl=safeExternalUrl(job.officialUrl);
    const content=`<div class="job-briefing-head"><div><p class="eyebrow">JOB EVIDENCE MAP</p><h2>${esc(job.company)} · ${esc(job.role)}</h2><p>${esc(statusLabel(job.status))} · ${esc(job.checkedAt)}</p></div>${officialUrl?`<a class="secondary job-official-link" href="${esc(officialUrl)}" target="_blank" rel="noopener noreferrer">공식 공고 확인</a>`:''}</div>
      <div class="job-briefing-grid"><section><h3>역할·전형</h3><p>${esc((job.process||[]).join(' → ')||'정확한 전형 확인 필요')}</p><ul>${(job.responsibilities||[]).map(item=>`<li>${esc(item)}</li>`).join('')}</ul></section>
      <section data-testid="job-evidence-map"><h3>요구역량 ↔ 공개 안전 근거</h3>${evidence.length?`<ul>${evidence.map(item=>`<li><strong>${esc(item.requirement)}</strong>${item.facts.length?item.facts.map(fact=>`<span>${esc(fact.statement)}${fact.caveat?` <small>경계: ${esc(fact.caveat)}</small>`:''}</span>`).join(''):'<span>직접 근거 없음 — 전이 가능성과 학습 계획으로 답변</span>'}</li>`).join('')}</ul>`:'<p>직접 연결된 공개 안전 근거가 없습니다. 경험을 만들지 말고 학습 계획으로 답변하세요.</p>'}</section>
      <section data-testid="job-learning-queue"><h3>학습 큐</h3><ol>${learningQueue.map(item=>`<li>${esc(item)}</li>`).join('')}</ol></section>
      <section><h3>출처·경계</h3><ul>${sources.map(source=>`<li><strong>${esc(source.grade)}급</strong> · ${esc(source.publisher)} · ${esc(source.status)}</li>`).join('')}</ul><p>공식 공개 자료와 Incruit handoff만 사용합니다. 회사 내부 정보나 실제 유출 질문으로 간주하지 않습니다.</p></section></div>`;
    return compact?`<details class="interview-job-briefing is-compact" data-testid="interview-job-briefing"><summary>선택 공고 근거·학습 큐 확인</summary>${content}</details>`:`<section class="interview-job-briefing" data-testid="interview-job-briefing" aria-labelledby="jobBriefingTitle">${content.replace('<h2>','<h2 id="jobBriefingTitle">')}</section>`;
  }
  const dayPlan=[
    {from:14,to:12,title:'경력 사실 방어',detail:'이력서 · 처리량 약 855배 · 차세대 전환'},
    {from:11,to:9,title:'Backend Core',detail:'Java · Spring · Database'},
    {from:8,to:7,title:'데이터 처리',detail:'배치 · 정산 · Kafka · 분산 시스템'},
    {from:6,to:5,title:'회사 도메인 설계',detail:'공식 JD 기반 시스템 설계'},
    {from:4,to:4,title:'운영 안전성',detail:'장애 · 보안 · 운영'},
    {from:3,to:3,title:'AI/AX와 프로젝트',detail:'근거 · 권한 · 한계 · 검증 책임'},
    {from:2,to:2,title:'60분 모의면접',detail:'기술 질문과 꼬리질문 연속 훈련'},
    {from:1,to:1,title:'D-Day Top 30',detail:'금지 과장 · 역질문 · 마지막 근거 확인'},
    {from:0,to:0,title:'15분 빠른 점검',detail:'새 내용 없이 핵심만 확인'}
  ];
  function localDay(value){const date=value?new Date(`${value}T00:00:00`):new Date();return new Date(date.getFullYear(),date.getMonth(),date.getDate());}
  function daysUntil(value,today=new Date()){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;const target=localDay(value);const base=localDay(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`);return Math.round((target-base)/86400000);}
  function planStatus(item,remaining){if(remaining===null)return '';if(remaining<0)return item.to===0?'is-current':'';if(remaining<=item.from&&remaining>=item.to)return 'is-current';return remaining<item.to?'is-complete':'';}
  function studyPlan(state,today=new Date()){
    const remaining=daysUntil(state.interviewDate,today);const summary=remaining===null?'면접일을 입력하면 오늘 할 학습을 자동으로 표시합니다.':remaining<0?'입력한 면접일이 지났습니다. 새 일정을 입력하세요.':remaining===0?'오늘은 D-Day입니다. 15분 빠른 점검만 진행하세요.':`면접까지 D-${remaining} · 오늘의 구간을 강조했습니다.`;
    return `<section class="interview-study-plan" aria-labelledby="interviewPlanTitle"><div class="section-title"><div><p class="eyebrow">14-DAY STUDY PLAN</p><h2 id="interviewPlanTitle">면접일까지 근거를 쌓는 순서</h2></div><span>${esc(summary)}</span></div><ol>${dayPlan.map(item=>`<li class="${planStatus(item,remaining)}"><strong>${item.from===item.to?`D-${item.from}`:`D-${item.from}~${item.to}`}</strong><span><b>${esc(item.title)}</b><small>${esc(item.detail)}</small></span></li>`).join('')}</ol></section>`;
  }
  function home(bundle,state,route={}){
    const selectedJob=state.selectedJobId||route.job?.id||'';const last=state.sessions.find(item=>item.id===state.lastSessionId&&!item.finishedAt);
    const weak=Object.entries(state.weakTags||{}).sort((a,b)=>b[1]-a[1]).slice(0,5);
    return `<div class="interview-hero">
      <p class="eyebrow">BACKEND ATLAS · INTERVIEW LAB</p><h1 id="interviewLabTitle">외운 답변이 아니라,<br><em>근거 있는 판단을 연습합니다.</em></h1>
      <p>공식 JD, 검수 기술자료, 공개 안전한 경력 근거를 연결합니다. 질문을 먼저 받고 답한 뒤 기준 답안과 비교하세요.</p>
      ${route.fallback?`<div class="interview-alert" role="status">요청한 공고 ID를 찾지 못해 공통 면접 모드로 안전하게 열었습니다. 답변 내용은 URL에 저장하지 않습니다.</div>`:''}
    </div>
    <section class="interview-setup" aria-labelledby="interviewSetupTitle"><div><p class="eyebrow">SESSION SETUP</p><h2 id="interviewSetupTitle">면접 세션 구성</h2></div>
      <label>회사·직무<select id="interviewJobSelect"><option value="">공통 백엔드 면접</option>${bundle.jobs.map(job=>`<option value="${esc(job.id)}" ${job.id===selectedJob?'selected':''}>${esc(job.company)} · ${esc(job.role)}</option>`).join('')}</select></label>
      <label>전형 단계<select id="interviewStageSelect"><option value="first-technical" ${state.selectedStage==='first-technical'?'selected':''}>1차 기술면접</option><option value="coding" ${state.selectedStage==='coding'?'selected':''}>코딩/과제</option><option value="second-culture" ${state.selectedStage==='second-culture'?'selected':''}>2차 문화·임원</option></select></label>
      <label>면접 예정일<input id="interviewDate" type="date" value="${esc(state.interviewDate||'')}" aria-describedby="interviewDateHelp"><small id="interviewDateHelp">일정이 바뀌면 14일 플랜을 즉시 다시 계산합니다.</small></label>
    </section>
    ${jobBriefing(bundle,bundle.jobs.find(job=>job.id===selectedJob))}
    <section class="interview-mode-section" aria-labelledby="interviewModeTitle"><div class="section-title"><div><p class="eyebrow">PRACTICE MODE</p><h2 id="interviewModeTitle">훈련 모드</h2></div><span>${bundle.questions.length}개 검수 문항</span></div>
      <div class="interview-mode-grid">${modeOptions.map(([id,label,desc])=>`<button type="button" data-interview-mode="${id}" class="interview-mode-card ${state.selectedMode===id?'is-selected':''}"><strong>${esc(label)}</strong><span>${esc(desc)}</span></button>`).join('')}</div>
      <button id="interviewStartSession" class="primary interview-start" type="button">선택한 세션 시작</button>
    </section>
    ${studyPlan(state)}
    ${last?`<section class="interview-resume-card"><div><p class="eyebrow">RESUME</p><h2>중단한 ${esc(modeLabel(last.mode))}</h2><p>${last.currentIndex+1} / ${last.questionIds.length} · 답변 ${last.answeredIds.length}개</p></div><button class="primary" type="button" data-resume-session="${esc(last.id)}">이어하기</button></section>`:''}
    <section class="interview-insight-grid"><article><p class="eyebrow">WEAK AREA</p><h2>약점·복습</h2>${weak.length?`<ul>${weak.map(([tag,count])=>`<li>${esc(tag)} <strong>${count}</strong></li>`).join('')}</ul>`:'<p>자가 점수를 기록하면 낮은 영역을 여기에 모읍니다.</p>'}</article>
      <article><p class="eyebrow">PRIVATE PROFILE</p><h2>로컬 근거 가져오기</h2><p>profile 원문은 현재 탭 메모리에서만 사용하며 네트워크·URL에 넣지 않습니다.</p><label class="file-button">JSON 선택<input id="interviewProfileFile" type="file" accept="application/json,.json"></label><p id="interviewProfileStatus" role="status">${state.profileMetadata?`메타데이터: fact ${state.profileMetadata.factCount}개`:'가져온 profile 없음'}</p></article>
      <article><p class="eyebrow">D-DAY</p><h2>마지막 면접 한 장</h2><p>Top 30, 위험 질문, 금지 과장, 역질문을 인쇄 가능한 화면으로 정리합니다.</p><button class="secondary" type="button" data-open-dday>D-Day 요약 열기</button></article>
    </section>
    <section class="interview-source-board"><div class="section-title"><div><p class="eyebrow">SOURCE & BOUNDARY</p><h2>근거 수준</h2></div></div><div class="source-levels"><span>verified-candidate</span><span>official-jd-derived</span><span>technical-official-source</span><span>practice-inference</span></div><p>회사별 질문은 공식 JD와 공개 안전한 경력에서 추론한 예상 질문입니다. 실제 유출 질문이나 회사 내부 구조가 아닙니다.</p></section>`;
  }
  function session(bundle,session,question,index,remainingSeconds,revealed=false,answer=''){
    const job=bundle.jobs.find(item=>item.id===session.jobId);const minutes=Math.floor(remainingSeconds/60);const seconds=String(remainingSeconds%60).padStart(2,'0');
    return `<div class="interview-session-shell" data-session-id="${esc(session.id)}">
      <div class="interview-session-head"><div><p class="eyebrow">${esc(job?`${job.company} · ${job.role}`:'COMMON BACKEND')}</p><h1>${esc(modeLabel(session.mode))}</h1></div><div class="interview-session-controls"><span class="interview-timer" id="interviewTimer" role="timer" aria-live="off" aria-label="남은 시간 ${minutes}분 ${seconds}초">${minutes}:${seconds}</span><button class="secondary" type="button" data-pause-session>${session.paused?'계속':'일시정지'}</button><button class="ghost" type="button" data-finish-session>종료</button></div></div>
      ${jobBriefing(bundle,job,true)}
      <div class="interview-progress" aria-label="질문 진행률"><i style="width:${Math.round((index+1)/session.questionIds.length*100)}%"></i></div><p class="interview-counter">QUESTION ${index+1} / ${session.questionIds.length} · ${esc(question.provenanceLevel)}</p>
      <article class="interview-question-card"><div class="question-meta"><span>${esc(question.category)}</span><span>${esc(question.difficulty)}</span></div><h2>${esc(question.question)}</h2>
        ${session.paused?`<div class="interview-paused" role="status"><strong>세션 일시정지</strong><p>타이머와 답변 입력을 멈췄습니다.</p></div>`:`<label for="interviewAnswerText">내 답변</label><textarea id="interviewAnswerText" rows="8" placeholder="먼저 소리 내어 답하거나, 문제 → 선택 → 근거 → 결과 → 한계 순서로 적어보세요.">${esc(answer)}</textarea><label class="persist-answer"><input id="persistInterviewAnswer" type="checkbox" ${window.InterviewState.snapshot().preferences.persistAnswerText?'checked':''}> 이 기기에 답변 원문 저장(명시적 선택)</label>${!revealed?`<button class="primary wide" type="button" data-reveal-answer>답변 점검하기</button>`:''}`}
        ${revealed?review(question):''}
      </article>
    </div>`;
  }
  function review(question){
    const scoreRubric=window.InterviewScore.forQuestion(question);
    return `<section class="interview-review" aria-live="polite"><div class="review-heading"><p class="eyebrow">ANSWER REVIEW</p><h3>기준 답안과 비교</h3><span>${esc(question.provenanceLevel)}</span></div>
      <details open><summary>면접관 의도</summary><p>${esc(question.interviewerIntent)}</p></details>
      <div class="answer-length-grid"><article><small>20초 답변</small><p>${esc(question.answer20Sec)}</p></article><article><small>90초 답변</small><p>${esc(question.answer90Sec)}</p></article></div>
      <details><summary>심층 답변 구조</summary><p>${esc(question.deepDive)}</p><ol>${question.answerOutline.map(item=>`<li>${esc(item)}</li>`).join('')}</ol></details>
      ${question.evidenceFactIds?.length?`<details><summary>본인 경험 근거</summary><ul>${question.evidenceFactIds.map(id=>`<li>${esc(id)}</li>`).join('')}</ul></details>`:''}
      ${question.forbiddenClaimIds?.length?`<details class="danger-detail"><summary>말하면 안 되는 과장</summary><ul>${question.forbiddenClaimIds.map(id=>`<li>${esc(id)}</li>`).join('')}</ul></details>`:''}
      <section class="score-panel" data-rubric="${esc(scoreRubric.key)}"><h3>자가 평가</h3><p>정답 판정이 아닌 연습 지표입니다. 질문 유형에 맞는 각 항목을 0~4로 평가하세요.</p><div class="score-grid">${Object.entries(scoreRubric.weights).map(([key,max])=>`<label>${esc(window.InterviewScore.labels[key])}<span>${max}점</span><input type="range" min="0" max="4" value="0" step="1" data-score-key="${key}"></label>`).join('')}</div><output id="interviewScoreTotal">0 / 100</output></section>
      <section class="followup-tree"><h3>꼬리질문</h3>${question.followUps.map((item,index)=>`<details><summary>${esc(item)}</summary><p><strong>답변 가이드</strong> · ${esc(question.followUpGuides[index]||'전제와 근거를 먼저 말합니다.')}</p></details>`).join('')}</section>
      <button class="primary wide" type="button" data-next-interview-question>점수 저장 후 다음</button>
    </section>`;
  }
  function dday(bundle,state){
    const job=bundle.jobs.find(item=>item.id===state.selectedJobId)||bundle.jobs[0];const playlist=bundle.playlists.jobs[job.id];const playlistQuestions=(playlist?.questionIds||[]).map(id=>bundle.questions.find(q=>q.id===id)).filter(Boolean);const top=playlistQuestions.slice(0,30);const systemDesign=playlistQuestions.filter(question=>question.category==='system-design').slice(0,5);
    return `<article class="dday-sheet"><div class="dday-header"><p class="eyebrow">D-DAY INTERVIEW SHEET</p><h1>${esc(job.company)}<br>${esc(job.role)}</h1><p>${esc(statusLabel(job.status))} · ${esc(job.checkedAt)}</p><button class="primary no-print" type="button" data-print-dday>인쇄 / PDF</button><button class="secondary no-print" type="button" data-back-interview-home>면접 홈</button></div>
      <section><h2>1분 자기소개 구조</h2><ol><li>Java/Spring 기반 운영·정산 문제 해결 경험</li><li>검증 가능한 처리량 개선과 데이터 정합성</li><li>지원 역할의 문제에 전이 가능한 근거와 학습 계획</li></ol></section>
      <section><h2>지원동기 구조</h2><ol><li>지원 역할이 해결하는 실제 문제를 공식 JD 근거로 요약</li><li>정산·배치·연계·운영 경험 중 전이 가능한 근거 연결</li><li>없는 도메인 경험과 첫 30·60·90일 학습 계획을 구분</li></ol></section>
      <section><h2>핵심 프로젝트 3개</h2><ul><li>교통 정산·배치·대외 연계</li><li>처리량 정규화 기준 약 855배 개선</li><li>Archive/Atlas 개인 프로젝트 — 합성·비식별 데이터와 검증 경계</li></ul></section>
      <section><h2>Top 30</h2><ol>${top.map(question=>`<li>${esc(question.question)}</li>`).join('')}</ol></section>
      <section><h2>회사·직무 예상 질문 10</h2><ol>${top.filter(question=>question.scope==='company').concat(top.filter(question=>question.scope!=='company')).slice(0,10).map(question=>`<li>${esc(question.question)}</li>`).join('')}</ol></section>
      <section><h2>위험 질문 10</h2><ul>${job.riskGaps.concat(['본인 역할과 팀 성과의 경계','수치의 계산식과 측정 조건','없는 도메인 경험을 어떻게 메울지','실패와 rollback 기준','AI 도구와 본인 검증 책임','지원 직무 확인 상태','투입처와 소속회사 구분','개인 프로젝트의 실제 트래픽 한계','확인되지 않은 회사 내부 구조','직접 해보지 않은 업무의 학습 계획']).slice(0,10).map(item=>`<li>${esc(item)}</li>`).join('')}</ul></section>
      <section><h2>시스템 설계 5</h2><ul>${systemDesign.map(q=>`<li>${esc(q.question)}</li>`).join('')}</ul></section>
      <section><h2>회사에 할 역질문 10</h2><ol>${['이 역할이 첫 90일에 해결해야 할 가장 큰 문제는 무엇인가요?','서비스의 핵심 SLI와 오류 예산은 어떻게 정의하나요?','기술 의사결정과 code review는 어떤 방식으로 이뤄지나요?','온콜과 장애 회고는 어떻게 운영하나요?','레거시 개선 우선순위는 누가 어떤 근거로 정하나요?','데이터 정합성을 검증하는 자동화 수준은 어느 정도인가요?','팀이 최근 바꾼 기술 선택과 그 이유는 무엇인가요?','AI 개발도구 사용 시 보안·검증 기준은 무엇인가요?','이 역할의 성장을 어떤 영향력으로 평가하나요?','입사 전 보완하면 좋은 도메인 지식은 무엇인가요?'].map(item=>`<li>${esc(item)}</li>`).join('')}</ol></section>
      <section class="danger-detail"><h2>금지 과장</h2><ul>${['투입처를 실제 소속회사로 단정하지 않기','SAP ERP 자체 개발로 표현하지 않기','개인 프로젝트를 대규모 상용 운영으로 표현하지 않기','자체 LLM 학습·GPU 모델 서버 운영으로 표현하지 않기','직접 DSP 또는 Staff 인사관리 경험을 만들지 않기','855배를 동일 건수 단순 시간 비교로 말하지 않기'].map(item=>`<li>${esc(item)}</li>`).join('')}</ul></section>
      <section><h2>마지막 확인 체크리스트</h2><ul class="dday-checklist">${['지원 회사·직무·전형을 다시 확인했다','1분 자기소개와 지원동기를 소리 내어 답했다','핵심 수치의 계산식과 측정 조건을 설명할 수 있다','본인 역할과 팀 성과를 구분했다','확인되지 않은 경험을 만들지 않는다','질문을 이해하지 못하면 가정을 확인한다','장애 답변에 탐지·격리·복구·재발 방지를 포함한다','시스템 설계 답변에 보안·관측성·비용을 포함한다','역질문 세 개를 골랐다','D-Day에는 새 내용을 추가하지 않는다'].map(item=>`<li><span aria-hidden="true">□</span> ${esc(item)}</li>`).join('')}</ul></section>
      ${studyPlan(state)}</article>`;
  }
  window.InterviewRender={esc,modeOptions,modeLabel,daysUntil,studyPlan,jobBriefing,home,session,dday};
})();
