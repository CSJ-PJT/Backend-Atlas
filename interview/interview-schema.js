(function(){
  'use strict';
  const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const safeText=(value,max=5000)=>typeof value==='string'?value.slice(0,max):'';
  const safeList=(value,max=200)=>Array.isArray(value)?value.filter(item=>typeof item==='string').map(item=>item.slice(0,300)).slice(0,max):[];
  function validateProfile(input){
    const errors=[];
    if(!isRecord(input)) return {ok:false,errors:['JSON 최상위 값은 객체여야 합니다.']};
    if(input.schemaVersion!==1) errors.push('지원하는 profile schemaVersion은 1입니다.');
    if(!safeText(input.candidateId,120)) errors.push('candidateId가 필요합니다.');
    if(!Array.isArray(input.facts)) errors.push('facts 배열이 필요합니다.');
    const facts=(input.facts||[]).filter(isRecord).slice(0,500).map(fact=>({
      id:safeText(fact.id,120),statement:safeText(fact.statement,2000),status:['verified','needs-confirmation'].includes(fact.status)?fact.status:'needs-confirmation',source:safeText(fact.source,200),publicSafe:Boolean(fact.publicSafe)
    })).filter(fact=>fact.id&&fact.statement);
    if(Array.isArray(input.facts)&&facts.length!==input.facts.length)errors.push('일부 fact의 id 또는 statement가 유효하지 않습니다.');
    const forbiddenClaims=(input.forbiddenClaims||[]).filter(isRecord).slice(0,200).map(item=>({id:safeText(item.id,120),statement:safeText(item.statement,1000)})).filter(item=>item.id&&item.statement);
    const projectBoundaries=(input.projectBoundaries||[]).filter(isRecord).slice(0,100).map(item=>({id:safeText(item.id,120),statement:safeText(item.statement,1000)})).filter(item=>item.id&&item.statement);
    return {ok:errors.length===0,errors,value:{schemaVersion:1,candidateId:safeText(input.candidateId,120),facts,forbiddenClaims,projectBoundaries,metrics:Array.isArray(input.metrics)?input.metrics.slice(0,100):[]}};
  }
  function validateBundle(bundle){
    const errors=[];
    if(!isRecord(bundle)||bundle.schemaVersion!==1)errors.push('Interview data schemaVersion이 유효하지 않습니다.');
    if(!Array.isArray(bundle?.questions)||bundle.questions.length===0)errors.push('검수 질문이 없습니다.');
    if(!Array.isArray(bundle?.jobs)||bundle.jobs.length===0)errors.push('직무 profile이 없습니다.');
    const ids=new Set();
    for(const question of bundle?.questions||[]){
      if(!question?.id||ids.has(question.id))errors.push(`중복 또는 빈 question id: ${question?.id||'(empty)'}`);
      ids.add(question?.id);
      if(question?.reviewStatus!=='reviewed')errors.push(`미검수 공개 문항: ${question?.id}`);
      if(!Array.isArray(question?.followUps)||question.followUps.length<2)errors.push(`꼬리질문 부족: ${question?.id}`);
    }
    return {ok:errors.length===0,errors};
  }
  window.InterviewSchema={isRecord,safeText,safeList,validateProfile,validateBundle};
})();
