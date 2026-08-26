# Phase 4 Interview Quality Contract

Release audit는 다음을 fail-closed로 검사한다.

- 공개 문항 `reviewStatus=reviewed`
- ID와 정규화 질문문 unique
- sourceRefs 해석 가능
- 후보자 문항 evidenceFactIds 존재
- 회사·직무 일치, 확인된 JD는 `official-jd-derived`, 미확인 직무는 `practice-inference` provenance
- 답변 20초·90초·심층 구조 비어 있지 않음
- 질문별 rubric 총합 100, 시스템 설계 9요소, 행동 질문 6요소
- 꼬리질문과 가이드 최소 2개 및 개수 일치
- forbidden claim 문자열 누출 없음
- 공개 Interview 데이터·runtime·HTML에 이메일·전화번호·credential·private key·IPv4 없음
- 회사·직무별 playlist 50개, 타 role 문항 혼입 0, D-Day 시스템 설계 5개가 직무별 system focus와 일치
- 후보자 120, 회사별 25, 시스템 80, 행동 60, top-level 400, 꼬리질문 1,200 이상
- 코딩·SQL 분야별 최소 수량

실행 명령은 `npm run interview:audit`와 `npm run test:interview`다.
