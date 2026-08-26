(function(){
  'use strict';
  const KEY='backendAtlasInterviewLab';
  const VERSION=1;
  const empty=()=>({schemaVersion:VERSION,selectedJobId:'',selectedMode:'quick-15',selectedStage:'first-technical',interviewDate:'',sessions:[],weakTags:{},reviewSchedule:{},lastSessionId:'',profileMetadata:null,preferences:{persistAnswerText:false}});
  const clone=value=>JSON.parse(JSON.stringify(value));
  function safeRead(){
    try{
      const raw=localStorage.getItem(KEY);if(!raw)return empty();
      const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object'||parsed.schemaVersion!==VERSION){localStorage.removeItem(KEY);return empty();}
      return normalize(parsed);
    }catch{try{localStorage.removeItem(KEY);}catch{}return empty();}
  }
  function normalize(value){
    const next=empty();
    next.selectedJobId=typeof value.selectedJobId==='string'?value.selectedJobId.slice(0,160):'';
    next.selectedMode=typeof value.selectedMode==='string'?value.selectedMode.slice(0,80):next.selectedMode;
    next.selectedStage=typeof value.selectedStage==='string'?value.selectedStage.slice(0,80):next.selectedStage;
    next.interviewDate=/^\d{4}-\d{2}-\d{2}$/.test(value.interviewDate||'')&&!Number.isNaN(Date.parse(`${value.interviewDate}T00:00:00`))?value.interviewDate:'';
    next.sessions=Array.isArray(value.sessions)?value.sessions.filter(item=>item&&typeof item==='object'&&typeof item.id==='string').slice(-30).map(session=>({
      id:session.id.slice(0,160),jobId:String(session.jobId||'').slice(0,160),mode:String(session.mode||'').slice(0,80),stage:String(session.stage||'').slice(0,80),questionIds:Array.isArray(session.questionIds)?session.questionIds.filter(id=>typeof id==='string').slice(0,200):[],currentIndex:Number.isInteger(session.currentIndex)?Math.max(0,session.currentIndex):0,answeredIds:Array.isArray(session.answeredIds)?session.answeredIds.filter(id=>typeof id==='string').slice(0,200):[],scores:session.scores&&typeof session.scores==='object'?session.scores:{},startedAt:validDate(session.startedAt),updatedAt:validDate(session.updatedAt),finishedAt:validDate(session.finishedAt),paused:Boolean(session.paused),elapsedSeconds:Number.isFinite(session.elapsedSeconds)?Math.max(0,Math.floor(session.elapsedSeconds)):0,...(value.preferences?.persistAnswerText&&session.answers&&typeof session.answers==='object'?{answers:session.answers}:{})
    })):[];
    next.weakTags=value.weakTags&&typeof value.weakTags==='object'?value.weakTags:{};
    next.reviewSchedule=value.reviewSchedule&&typeof value.reviewSchedule==='object'?value.reviewSchedule:{};
    next.lastSessionId=typeof value.lastSessionId==='string'?value.lastSessionId.slice(0,160):'';
    next.profileMetadata=value.profileMetadata&&typeof value.profileMetadata==='object'?{candidateId:String(value.profileMetadata.candidateId||'').slice(0,120),factCount:Math.max(0,Number(value.profileMetadata.factCount)||0),loadedAt:validDate(value.profileMetadata.loadedAt)}:null;
    next.preferences={persistAnswerText:Boolean(value.preferences?.persistAnswerText)};
    return next;
  }
  function validDate(value){return typeof value==='string'&&!Number.isNaN(Date.parse(value))?value:null;}
  let state=safeRead();
  function write(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}}
  function snapshot(){return clone(state);}
  function update(mutator){const draft=snapshot();mutator(draft);state=normalize(draft);return write();}
  function setSelection({jobId,mode,stage,interviewDate}){return update(draft=>{if(jobId!==undefined)draft.selectedJobId=jobId;if(mode!==undefined)draft.selectedMode=mode;if(stage!==undefined)draft.selectedStage=stage;if(interviewDate!==undefined)draft.interviewDate=interviewDate;});}
  function createSession({jobId,mode,stage,questionIds}){
    const id=crypto.randomUUID?.()||`interview-${Date.now()}`;const now=new Date().toISOString();
    const session={id,jobId,mode,stage,questionIds,currentIndex:0,answeredIds:[],scores:{},startedAt:now,updatedAt:now,finishedAt:null,paused:false,elapsedSeconds:0};
    update(draft=>{draft.sessions.push(session);draft.lastSessionId=id;draft.selectedJobId=jobId;draft.selectedMode=mode;draft.selectedStage=stage;});return clone(session);
  }
  function updateSession(id,changes){update(draft=>{const session=draft.sessions.find(item=>item.id===id);if(!session)return;Object.assign(session,changes,{updatedAt:new Date().toISOString()});if(!draft.preferences.persistAnswerText)delete session.answers;});return getSession(id);}
  function getSession(id){const found=state.sessions.find(item=>item.id===id);return found?clone(found):null;}
  function lastSession(){return getSession(state.lastSessionId);}
  function recordResult(sessionId,question,{score,tags,answerText}){
    update(draft=>{const session=draft.sessions.find(item=>item.id===sessionId);if(!session)return;const total=Math.max(0,Math.min(100,Number(score?.total??score)||0));session.answeredIds=[...new Set([...session.answeredIds,question.id])];session.scores[question.id]={total,breakdown:score?.breakdown||{}};session.currentIndex=Math.min(session.currentIndex+1,session.questionIds.length-1);if(draft.preferences.persistAnswerText&&answerText){session.answers=session.answers||{};session.answers[question.id]=String(answerText).slice(0,8000);}for(const tag of tags||[])if(total<70)draft.weakTags[tag]=(Number(draft.weakTags[tag])||0)+1;draft.reviewSchedule[question.id]=new Date(Date.now()+(total<50?86400000:total<75?259200000:604800000)).toISOString();});
  }
  function finishSession(id){return updateSession(id,{finishedAt:new Date().toISOString(),paused:false});}
  function setProfileMetadata(profile){return update(draft=>{draft.profileMetadata={candidateId:profile.candidateId,factCount:profile.facts.length,loadedAt:new Date().toISOString()};});}
  function setPersistAnswers(enabled){return update(draft=>{draft.preferences.persistAnswerText=Boolean(enabled);if(!enabled)for(const session of draft.sessions)delete session.answers;});}
  function clear(){state=empty();try{localStorage.removeItem(KEY);}catch{}return true;}
  window.InterviewState={KEY,snapshot,update,setSelection,createSession,updateSession,getSession,lastSession,recordResult,finishSession,setProfileMetadata,setPersistAnswers,clear};
})();
