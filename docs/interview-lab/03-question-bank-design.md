# Phase 3 Question Bank Design

질문은 기존 5,000개 초안 은행을 공개로 복제하지 않는다. 공개 reviewed 기술 문제 15개는 회사 playlist에 포함하고, Interview Lab 전용 문항은 독립 schema와 review manifest로 관리한다.

## 구성

- 후보자 경력 방어 120개: 처리량, 정산, 연계, 이전, 배치, 보안, 경력 경계, 개인 프로젝트
- 회사·직무 250개: 10개 job profile × 25개
- 시스템 설계 80개
- 행동·협업 60개
- Java·자료구조·동시성·SQL·모델링·디버깅·라이브 코딩·리팩터링 185개
- 전체 공개 reviewed 문항 695개
- 꼬리질문 2,085개
- 회사·직무 playlist 10개, 각 50문항: 해당 role 예상 질문 25개, legacy reviewed 15개, 직무 도메인 시스템 설계 우선 10개

각 문항은 question, interviewer intent, evidence fact, forbidden claim, 20초·90초·심층 답변, 꼬리질문과 가이드, rubric, source, provenance를 가진다.

회사 문항은 확인된 공식 JD에서 추론한 예상 질문이다. 정확한 직무가 확인되지 않은 pack은 `practice-inference`로 낮추며, 실제 회사 내부 구조나 유출 질문이라고 표현하지 않는다. 회사명이 같아도 role이 다른 pack은 서로 섞지 않는다.
