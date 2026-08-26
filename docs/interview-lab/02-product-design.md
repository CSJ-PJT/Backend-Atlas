# Phase 2 Product Design

## 학습 원칙

Interview Lab은 답을 바로 보여주지 않는다. 질문 → 제한 시간 → 사용자의 말하기/텍스트 답변 → 명시적 공개 → 근거와 금지 과장 → 자가 평가 → 꼬리질문 → 복습일 순서다. 점수는 정답 판정이 아니라 답변 개선 지표임을 화면에 표시한다.

## 화면

1. 면접 준비 홈: 회사·직무, 전형 단계, 훈련 모드 선택
2. 질문 세션: 진행률, 접근 가능한 timer, 일시정지·종료
3. 답변 점검: 면접관 의도, 20초·90초·심층 구조
4. 꼬리질문 트리: 최소 3개와 답변 가이드
5. 약점·복습: 70점 미만 tag 누적과 1·3·7일 복습일
6. 14일 학습 플랜: 면접 예정일 기준 D-14부터 D-Day까지 오늘 구간 자동 강조
7. D-Day: Top 30, 지원동기, 회사 질문, 위험 질문, 설계, 역질문, 금지 과장, 최종 체크리스트 인쇄
8. private profile: session-only JSON import와 schema validation

## 모드

15분, 30분, 60분, 90분, 문화·임원, 경력 방어, 포트폴리오 방어, 시스템 설계, Java 코딩, SQL, 장애 대응, AI/AX, 압박 꼬리질문, 약점 복습, D-Day Top 30을 제공한다.

15·30·60·90분과 D-Day 세션은 선택한 전형 단계에 따라 1차 기술, 코딩/과제, 2차 문화·임원 질문군을 실제로 바꾼다. 문화·Java·SQL·시스템 설계처럼 목적이 명시된 모드는 모드 자체의 질문 계약을 우선한다.

자가 평가는 공통 기술 7요소, 시스템 설계 9요소, 행동 질문 6요소를 각각 100점으로 정규화한다. 세 rubric 모두 정답 판정이 아니라 구조적 자기 점검 도구다.

## Incruit handoff

`/learn/?mode=interview&job=<id>&topic=<role>`는 유효한 job profile을 선택하고 맞춤 playlist로 세션을 시작한다. 알 수 없는 job ID는 공통 모드로 안전하게 fallback한다. 최초 deep link에만 자동 시작을 적용하며, 뒤로가기 이후에는 세션을 재시작하지 않는다.

## 접근성·반응형

- native button, label, textarea, select로 키보드 조작
- timer role과 상태 live region
- 답변 공개 영역 `aria-live`
- reduced motion, print CSS
- 390×844, 768×1024, 1440×900에서 문서 가로 overflow 0
- 활성 세션에서는 집중을 방해하는 하단 탐색을 숨김
