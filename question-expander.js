(function expandQuestionBank(){
  const base=[...window.QUESTION_BANK];
  const contexts=[
    ['개념 확인','다음 질문에 가장 정확한 답을 고르세요.'],
    ['장애 분석','운영 장애 원인을 분석하는 상황에서 다음 질문에 답하세요.'],
    ['설계 리뷰','설계 리뷰에서 근거를 설명해야 합니다.'],
    ['코드 리뷰','코드 리뷰 중 발견한 문제를 판단하세요.'],
    ['성능 개선','응답 지연을 개선하는 관점에서 판단하세요.'],
    ['대규모 트래픽','동시 요청이 급증한 환경을 가정하세요.'],
    ['데이터 정합성','실패와 재시도가 발생하는 환경을 가정하세요.'],
    ['보안 검토','외부에 노출되는 서비스의 보안 검토 상황입니다.'],
    ['운영 자동화','사람의 반복 작업을 자동화하는 상황입니다.'],
    ['모바일 서비스','모바일 사용자가 불안정한 네트워크로 접속합니다.'],
    ['분산 시스템','여러 서비스가 비동기로 연결된 환경입니다.'],
    ['레거시 개선','운영 중인 레거시를 중단 없이 개선해야 합니다.'],
    ['테스트 전략','회귀를 막는 테스트를 설계하는 상황입니다.'],
    ['관측성','원인을 로그와 지표로 추적해야 합니다.'],
    ['비용 최적화','정확성을 유지하면서 자원 비용을 줄여야 합니다.'],
    ['확장성','사용량이 열 배 증가해도 유지되는 구조를 검토합니다.'],
    ['복구 전략','부분 실패 후 안전하게 복구해야 합니다.'],
    ['동시성','중복 요청과 경쟁 상태가 발생할 수 있습니다.'],
    ['API 계약','기존 클라이언트와 호환성을 유지해야 합니다.'],
    ['배포 전략','구버전과 신버전이 동시에 실행됩니다.'],
    ['핵심 요약','30초 안에 핵심과 trade-off를 설명해야 합니다.'],
    ['심화 점검','구현 세부사항까지 추가로 검토합니다.'],
    ['PM 협업','기술 선택의 운영 영향을 비개발자에게 설명합니다.'],
    ['SRE 관점','오류 예산과 서비스 안정성을 함께 고려합니다.'],
    ['데이터 증가','누적 데이터가 수억 건으로 늘어난 상황입니다.'],
    ['외부 연동','외부 플랫폼이 간헐적으로 응답하지 않습니다.'],
    ['최종 점검','배포 직전 핵심 원칙을 확인합니다.']
  ];
  const rotate=(items,offset)=>items.map((_,i)=>items[(i+offset)%items.length]);
  const expanded=[];
  base.forEach((source,sourceIndex)=>contexts.forEach((context,contextIndex)=>{
    const offset=(sourceIndex+contextIndex)%source.options.length;
    expanded.push({
      ...source,
      id:`${source.id}-v${String(contextIndex+1).padStart(2,'0')}`,
      level:contextIndex>20?'심화':contextIndex>9?'중급':source.level,
      q:`[${context[0]}] ${source.q}`,
      hint:`${context[1]} ${source.hint}`,
      options:rotate(source.options,offset),
      answer:(source.answer-offset+source.options.length)%source.options.length,
      explanation:`${context[0]} 관점에서도 핵심 원리는 같습니다. ${source.explanation}`,
      points:[...source.points,`${context[0]} 상황의 제약과 trade-off를 함께 언급`],
      follow:`${context[0]} 상황에 이 원칙을 적용한다면: ${source.follow}`
    });
  }));
  const levelMap={기본:'easy',중급:'medium',심화:'hard'};
  window.QUESTION_BANK=[...base,...expanded].slice(0,1000).map(item=>({
    ...item,
    level:levelMap[item.level]||item.level,
    tags:item.tags||[item.category.toLowerCase().replaceAll(' ','-'),'core']
  }));
})();
