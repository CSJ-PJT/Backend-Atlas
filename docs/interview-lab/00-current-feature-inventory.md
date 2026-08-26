# 현재 기능 inventory

## 제품·내비게이션

- 운영 title과 header brand: `Backend Atlas`
- Atlas Management 사용자 변경에서의 제품명: `Learn Atlas`
- canonical public route: `/learn/`
- legacy route: `/run`, `/run/` → `/learn/`
- 고정 하단 내비게이션: 홈, 학습, 문제, 검색, 설계
- desktop 1440×900와 mobile 390×844에서 horizontal overflow 없음

## 현재 Interview Mode

`app.js`의 `startInterviewMode()`는 현재 public question bank에서 `interviewAnswer`, `interviewPoint`, follow-up이 있는 문항을 골라 섞고 기존 `startQuestionSet()`에 `count: 10`으로 전달한다.

현재 제공:

- Interview Mode 홈 카드와 시작 버튼
- 객관식 한 문제씩 진행
- 정답, 오답 이유, 실무 맥락, 면접 답변, 핵심 포인트
- 문항별 3개 꼬리질문과 3개 답안

현재 없음:

- candidate/profile 기반 질문
- job/company/JD 기반 playlist
- behavioral, system-design, incident 전용 session
- 자유서술 답변, self-evaluation rubric, 타이머, 답변 녹음
- session 저장/복원/결과 비교/D-Day
- 질문 source/fact manifest 전용 Interview Lab schema

## Incruit handoff

Incruit의 현재 `buildLearnAtlasUrl(job)` 계약은 다음이다.

```text
/learn/?job=<encoded job id>&topic=<encoded job title>
```

Learn Atlas는 `learning-os.js`에서 `job`과 `topic`을 읽고 지식 검색 화면, handoff context, reviewed concept를 연다. 브라우저 실측으로 이 경로는 작동한다.

목표 계약은 다음이다.

```text
/learn/?mode=interview&job=<id>&topic=<role>
```

현재 Learn Atlas는 `mode`를 읽지 않는다. 목표 URL도 검색 화면만 열며 Interview session은 시작하지 않는다. Incruit 소스도 현재 `mode=interview`를 생성하지 않는다.

## Content quality contract

- mode: `reviewed-only`
- 검수 전 생성 문항: 5,000
- 공개 문항: 15
- 제외된 미검수 문항: 4,985
- 공개 문항 reviewStatus: reviewed 15
- 공개 문항 category: Java & Spring 7, Database 3, 나머지 5개 분야 각 1
- 공개 문항 꼬리질문/답안: 45/45
- curriculum concepts: 187
- reviewed concepts: 4
- draft concepts: 183
- reviewed allowlist: ArrayList vs LinkedList, B-Tree, Servlet과 Container, Web Storage API
- 모든 공개 문항: stable reviewer ID, reviewed date, direct HTTPS sources, stable-json-v1 SHA-256 manifest
- content quality audit: errors 0, warnings 260

`ATLAS_CHAPTERS`에는 7개 chapter마다 20개 interview prompt가 있지만 현재 reviewed public question bank와 같은 provenance/answer/follow-up 계약으로 공개되는 Interview Lab 데이터는 아니다.

## 기존 저장 상태

현재 quiz와 학습 진행은 browser local storage에 저장한다. Interview Lab 전용 versioned session schema, migration, candidate/JD selection state는 없다. 기존 학습 기록을 깨지 않도록 Interview Lab 저장 key와 schema version을 분리해야 한다.

## Phase 0 gap 판정

기존 기능은 “검수된 문제를 학습하고 검색하는 교육 앱”으로는 작동한다. 마스터 지시서의 Interview Lab은 별도 domain model, source manifest, 대규모 reviewed corpus, job/candidate playlist, session UX, scoring 및 handoff 계약을 요구하므로 신규 기능 계층이 필요하다. 기존 reviewed-only gate를 완화하거나 draft 183개를 공개하는 방식은 허용하지 않는다.

