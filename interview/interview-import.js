(function(){
  'use strict';
  let sessionProfile=null;
  async function importProfile(file){
    if(!file||file.size>2_000_000)return {ok:false,errors:['2MB 이하의 JSON 파일을 선택하세요.']};
    let parsed;
    try{parsed=JSON.parse(await file.text());}catch{return {ok:false,errors:['JSON 파일을 읽을 수 없습니다.']};}
    const result=window.InterviewSchema.validateProfile(parsed);
    if(!result.ok)return result;
    sessionProfile=result.value;
    window.InterviewState.setProfileMetadata(sessionProfile);
    return {ok:true,value:{candidateId:sessionProfile.candidateId,factCount:sessionProfile.facts.length,verifiedFacts:sessionProfile.facts.filter(fact=>fact.status==='verified').length}};
  }
  function getProfile(){return sessionProfile;}
  function forgetProfile(){sessionProfile=null;}
  window.InterviewImport={importProfile,getProfile,forgetProfile,policy:'원문은 현재 탭 메모리에만 보관되며 네트워크·URL·기본 localStorage에 저장되지 않습니다.'};
})();
