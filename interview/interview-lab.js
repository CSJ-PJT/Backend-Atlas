(function(){
  'use strict';
  const bundle=window.INTERVIEW_LAB_DATA;const validation=window.InterviewSchema.validateBundle(bundle);const root=document.getElementById('interviewLabRoot');
  const view=document.getElementById('interviewLabView');let activeSession=null;let revealed=false;let answerMemory={};let timerId=null;let remainingSeconds=0;let lastTick=0;
  const modeConfig={
    'quick-15':{count:8,seconds:900},'core-30':{count:15,seconds:1800},'technical-60':{count:25,seconds:3600},'deep-90':{count:40,seconds:5400},culture:{count:15,seconds:2700,filter:q=>q.category==='behavior'},
    'career-defense':{count:20,seconds:2400,filter:q=>q.scope==='candidate'},'portfolio-defense':{count:15,seconds:1800,filter:q=>q.tags?.includes('portfolio')||q.tags?.includes('ai')},'system-design':{count:20,seconds:3600,filter:q=>q.category==='system-design'},
    'coding-java':{count:20,seconds:3600,filter:q=>['java-algorithm','data-structure','java-concurrency','live-coding','refactoring','debug-code-review'].includes(q.category)},sql:{count:20,seconds:3000,filter:q=>['sql','data-modeling'].includes(q.category)},
    incident:{count:20,seconds:3000,filter:q=>q.tags?.includes('incident')||q.tags?.includes('diagnose')},'ai-ax':{count:18,seconds:2700,filter:q=>q.tags?.includes('ai')||q.id.includes('rag-agent')},pressure:{count:20,seconds:2400,filter:q=>q.tags?.includes('evidence')||q.tags?.includes('tradeoff')||q.tags?.includes('reflect')},
    'weak-review':{count:20,seconds:2400},dday:{count:30,seconds:3600}
  };
  const codingCategories=new Set(['java-algorithm','data-structure','java-concurrency','live-coding','refactoring','debug-code-review','sql','data-modeling']);
  const stageAwareModes=new Set(['quick-15','core-30','technical-60','deep-90','dday']);
  function showView(){document.querySelectorAll('.view').forEach(item=>item.classList.remove('active'));view.classList.add('active');document.querySelectorAll('.bottom-nav-item').forEach(item=>{item.classList.toggle('active',item.id==='navInterviewBtn');item.removeAttribute('aria-current');});document.getElementById('navInterviewBtn')?.setAttribute('aria-current','page');window.scrollTo?.(0,0);}
  function home(route={active:false,job:null,topic:'',fallback:false}){
    stopTimer();activeSession=null;revealed=false;document.body.classList.remove('interview-session-active');showView();if(!validation.ok){root.innerHTML=`<section class="interview-alert" role="alert"><h1>검수 데이터 계약을 확인할 수 없습니다.</h1><p>${window.InterviewRender.esc(validation.errors[0])}</p></section>`;return;}
    const state=window.InterviewState.snapshot();if(route.job?.id)window.InterviewState.setSelection({jobId:route.job.id});root.innerHTML=window.InterviewRender.home(bundle,window.InterviewState.snapshot(),route);bindHome(route);root.querySelector('select,button')?.focus({preventScroll:true});
  }
  function bindHome(route){
    const jobSelect=document.getElementById('interviewJobSelect');const stageSelect=document.getElementById('interviewStageSelect');const interviewDate=document.getElementById('interviewDate');
    jobSelect.onchange=()=>{window.InterviewState.setSelection({jobId:jobSelect.value});home();};stageSelect.onchange=()=>window.InterviewState.setSelection({stage:stageSelect.value});interviewDate.onchange=()=>{window.InterviewState.setSelection({interviewDate:interviewDate.value});home();};
    root.querySelectorAll('[data-interview-mode]').forEach(button=>button.onclick=()=>{window.InterviewState.setSelection({mode:button.dataset.interviewMode});root.querySelectorAll('[data-interview-mode]').forEach(item=>item.classList.toggle('is-selected',item===button));});
    document.getElementById('interviewStartSession').onclick=()=>startNewSession();
    root.querySelector('[data-resume-session]')?.addEventListener('click',event=>resumeSession(event.currentTarget.dataset.resumeSession));
    root.querySelector('[data-open-dday]')?.addEventListener('click',openDDay);
    const file=document.getElementById('interviewProfileFile');file.onchange=async()=>{const result=await window.InterviewImport.importProfile(file.files?.[0]);const status=document.getElementById('interviewProfileStatus');status.textContent=result.ok?`현재 탭에 verified fact ${result.value.verifiedFacts}개를 불러왔습니다.`:result.errors.join(' ');};
    if(route.active&&route.job){const unfinished=window.InterviewState.snapshot().sessions.find(item=>item.id===window.InterviewState.snapshot().lastSessionId&&!item.finishedAt&&item.jobId===route.job.id);setTimeout(()=>unfinished?resumeSession(unfinished.id):startNewSession(),0);}
  }
  function selectQuestions(jobId,mode,stage){
    const config=modeConfig[mode]||modeConfig['quick-15'];const playlist=bundle.playlists.jobs[jobId]?.questionIds||[];const playlistQuestions=playlist.map(id=>bundle.questions.find(q=>q.id===id)).filter(Boolean);
    let pool=[...playlistQuestions,...bundle.questions.filter(q=>!playlist.includes(q.id))];if(config.filter)pool=pool.filter(config.filter);else if(stageAwareModes.has(mode)&&stage==='second-culture')pool=pool.filter(q=>q.category==='behavior');else if(stageAwareModes.has(mode)&&stage==='coding')pool=pool.filter(q=>codingCategories.has(q.category));
    if(mode==='weak-review'){
      const weak=Object.entries(window.InterviewState.snapshot().weakTags).sort((a,b)=>b[1]-a[1]).map(([tag])=>tag);pool.sort((a,b)=>Math.min(...weak.map((tag,index)=>a.tags?.includes(tag)?index:999))-Math.min(...weak.map((tag,index)=>b.tags?.includes(tag)?index:999)));
    }
    const seen=new Set();return pool.filter(q=>!seen.has(q.id)&&seen.add(q.id)).slice(0,Math.min(config.count,pool.length));
  }
  function startNewSession(){
    const state=window.InterviewState.snapshot();const questions=selectQuestions(state.selectedJobId,state.selectedMode,state.selectedStage);if(!questions.length){setStatus('선택한 조건의 검수 문항이 없습니다.');return;}
    activeSession=window.InterviewState.createSession({jobId:state.selectedJobId,mode:state.selectedMode,stage:state.selectedStage,questionIds:questions.map(q=>q.id)});remainingSeconds=modeConfig[state.selectedMode]?.seconds||900;revealed=false;renderSession();startTimer();
  }
  function resumeSession(id){activeSession=window.InterviewState.getSession(id);if(!activeSession)return home();remainingSeconds=Math.max(0,(modeConfig[activeSession.mode]?.seconds||900)-activeSession.elapsedSeconds);revealed=false;renderSession();if(!activeSession.paused)startTimer();}
  function currentQuestion(){return bundle.questions.find(q=>q.id===activeSession?.questionIds[activeSession.currentIndex]);}
  function renderSession(){
    document.body.classList.add('interview-session-active');showView();const question=currentQuestion();if(!question){finishSession();return;}
    root.innerHTML=window.InterviewRender.session(bundle,activeSession,question,activeSession.currentIndex,remainingSeconds,revealed,answerMemory[question.id]||'');bindSession(question);setStatus(activeSession.paused?'세션이 일시정지되었습니다.':'답변 원문은 기본적으로 현재 탭에만 유지됩니다.');
  }
  function bindSession(question){
    const textarea=document.getElementById('interviewAnswerText');if(textarea)textarea.oninput=()=>{answerMemory[question.id]=textarea.value;};
    document.getElementById('persistInterviewAnswer')?.addEventListener('change',event=>window.InterviewState.setPersistAnswers(event.currentTarget.checked));
    root.querySelector('[data-reveal-answer]')?.addEventListener('click',()=>{revealed=true;answerMemory[question.id]=textarea?.value||'';renderSession();root.querySelector('.interview-review')?.focus?.();});
    root.querySelectorAll('[data-score-key]').forEach(input=>input.oninput=()=>updateScorePreview());
    root.querySelector('[data-next-interview-question]')?.addEventListener('click',()=>saveAndNext(question));
    root.querySelector('[data-pause-session]')?.addEventListener('click',togglePause);
    root.querySelector('[data-finish-session]')?.addEventListener('click',()=>{if(confirm('현재 면접 세션을 종료할까요?'))finishSession();});
  }
  function updateScorePreview(){const grades=Object.fromEntries([...root.querySelectorAll('[data-score-key]')].map(input=>[input.dataset.scoreKey,Number(input.value)]));document.getElementById('interviewScoreTotal').textContent=`${window.InterviewScore.calculate(grades,currentQuestion()).total} / 100`;}
  function saveAndNext(question){
    const grades=Object.fromEntries([...root.querySelectorAll('[data-score-key]')].map(input=>[input.dataset.scoreKey,Number(input.value)]));const score=window.InterviewScore.calculate(grades,question);window.InterviewState.recordResult(activeSession.id,question,{score,tags:question.tags,answerText:answerMemory[question.id]||''});
    const nextIndex=activeSession.currentIndex+1;if(nextIndex>=activeSession.questionIds.length){finishSession();return;}activeSession=window.InterviewState.updateSession(activeSession.id,{currentIndex:nextIndex,elapsedSeconds:(modeConfig[activeSession.mode]?.seconds||900)-remainingSeconds});revealed=false;renderSession();
  }
  function togglePause(){activeSession=window.InterviewState.updateSession(activeSession.id,{paused:!activeSession.paused,elapsedSeconds:(modeConfig[activeSession.mode]?.seconds||900)-remainingSeconds});if(activeSession.paused)stopTimer();else startTimer();renderSession();}
  function finishSession(){if(activeSession)window.InterviewState.finishSession(activeSession.id);stopTimer();const completed=activeSession;activeSession=null;home({active:false,job:null,topic:'',fallback:false});if(completed)setStatus(`면접 세션을 마쳤습니다. 답변 ${completed.answeredIds?.length||0}개를 점검했습니다.`);}
  function startTimer(){stopTimer();lastTick=Date.now();timerId=setInterval(()=>{if(!activeSession||activeSession.paused)return;const now=Date.now();const elapsed=Math.max(1,Math.floor((now-lastTick)/1000));lastTick=now;remainingSeconds=Math.max(0,remainingSeconds-elapsed);const timer=document.getElementById('interviewTimer');if(timer){timer.textContent=`${Math.floor(remainingSeconds/60)}:${String(remainingSeconds%60).padStart(2,'0')}`;timer.setAttribute('aria-label',`남은 시간 ${Math.floor(remainingSeconds/60)}분 ${remainingSeconds%60}초`);}if(remainingSeconds===0){stopTimer();setStatus('제한 시간이 끝났습니다. 현재 답변을 점검하거나 세션을 종료하세요.');}},1000);}
  function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}
  function persistElapsed(){if(!activeSession)return;activeSession=window.InterviewState.updateSession(activeSession.id,{elapsedSeconds:Math.max(0,(modeConfig[activeSession.mode]?.seconds||900)-remainingSeconds)});}
  function openDDay(){const state=window.InterviewState.snapshot();if(!bundle.jobs.some(job=>job.id===state.selectedJobId)){setStatus('D-Day 요약을 열려면 회사·직무를 먼저 선택하세요.');document.getElementById('interviewJobSelect')?.focus();return;}stopTimer();document.body.classList.remove('interview-session-active');showView();root.innerHTML=window.InterviewRender.dday(bundle,state);root.querySelector('[data-print-dday]').onclick=()=>window.print();root.querySelector('[data-back-interview-home]').onclick=()=>home();}
  function setStatus(message){const status=document.getElementById('interviewSaveStatus');if(status)status.textContent=message;}
  document.getElementById('interviewBackBtn').onclick=()=>home({active:false,job:null,topic:'',fallback:false});
  window.openInterviewLab=options=>home(options||{active:false,job:null,topic:'',fallback:false});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)persistElapsed();});window.addEventListener('beforeunload',persistElapsed);
  window.InterviewRouter.cleanAnswerUnsafeParams();const route=window.InterviewRouter.resolve(bundle);if(route.active)setTimeout(()=>home(route),0);
})();
