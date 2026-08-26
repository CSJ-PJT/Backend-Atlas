(function(){
  'use strict';
  const rubrics={
    common:{factAccuracy:25,technicalDepth:20,ownership:15,structure:15,tradeOff:10,operationsSecurity:10,metricsOutcome:5},
    systemDesign:{requirementsAssumptions:12,capacity:10,apiDataModel:14,consistency:12,scalability:12,failureHandling:12,observability:10,security:10,costTradeOff:8},
    behavior:{specificity:15,judgment:18,collaboration:15,action:20,outcome:17,reflection:15}
  };
  const labels={factAccuracy:'사실 일치',technicalDepth:'기술 깊이',ownership:'본인 역할',structure:'구조·전달력',tradeOff:'Trade-off',operationsSecurity:'운영·보안',metricsOutcome:'수치·결과',requirementsAssumptions:'요구사항·가정',capacity:'용량 추정',apiDataModel:'API·데이터 모델',consistency:'정합성',scalability:'확장성',failureHandling:'장애 처리',observability:'관측성',security:'보안',costTradeOff:'비용·복잡도',specificity:'상황의 구체성',judgment:'본인의 판단',collaboration:'협업 과정',action:'행동',outcome:'결과',reflection:'회고·재발 방지'};
  function forQuestion(question){
    const key=question?.category==='system-design'?'systemDesign':question?.category==='behavior'?'behavior':'common';
    const candidate=question?.rubric&&typeof question.rubric==='object'?question.rubric:rubrics[key];
    const entries=Object.entries(candidate).filter(([name,value])=>labels[name]&&Number.isFinite(Number(value))&&Number(value)>0);
    const weights=Object.fromEntries(entries.map(([name,value])=>[name,Number(value)]));
    return Object.values(weights).reduce((sum,value)=>sum+value,0)===100?{key,weights}:{key,weights:rubrics[key]};
  }
  function calculate(grades={},question=null){
    const {key,weights}=forQuestion(question);
    const breakdown={};
    let total=0;
    for(const [key,max] of Object.entries(weights)){
      const grade=Math.max(0,Math.min(4,Number(grades[key])||0));
      const score=Math.round(max*grade/4);
      breakdown[key]={label:labels[key],grade,max,score};total+=score;
    }
    return {total,breakdown,rubric:key,notice:'이 점수는 정답 판정이 아니라 답변 개선을 위한 자가 연습 지표입니다.'};
  }
  window.InterviewScore={rubrics,labels,forQuestion,calculate};
})();
