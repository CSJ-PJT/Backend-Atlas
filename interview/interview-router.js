(function(){
  'use strict';
  function read(){
    const params=new URLSearchParams(location.search);const mode=params.get('mode');const job=params.get('job');const topic=params.get('topic');
    return {mode:mode==='interview'?'interview':'',job:typeof job==='string'?job.slice(0,160):'',topic:typeof topic==='string'?topic.slice(0,200):''};
  }
  function resolve(bundle){
    const route=read();if(route.mode!=='interview')return {active:false,job:null,topic:route.topic,fallback:false};
    const job=bundle.jobs.find(item=>item.id===route.job)||null;
    return {active:true,job,topic:route.topic,fallback:Boolean(route.job&&!job),requestedJobId:route.job};
  }
  function cleanAnswerUnsafeParams(){
    const url=new URL(location.href);for(const key of ['answer','response','profile','candidate'])url.searchParams.delete(key);if(url.searchParams.get('mode')==='interview')url.hash='';history.replaceState(history.state,'',`${url.pathname}${url.search}${url.hash}`);
  }
  window.InterviewRouter={read,resolve,cleanAnswerUnsafeParams};
})();
