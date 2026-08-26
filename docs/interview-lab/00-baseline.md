# Interview Lab Phase 0 기준선

- 조사 시각: 2026-08-26 KST
- 제품 canonical: **Learn Atlas**
- 제품 설명: **AX·Backend Interview & Learning Platform**
- 소스 저장소: `CSJ-PJT/Backend-Atlas`
- 공개 canonical 경로: `/learn/`
- legacy alias: `/run`, `/run/` → `/learn/` 308 redirect
- 구현 기준 브랜치: `feat/run-atlas-learning-quality`
- 구현 기준 SHA: `c03bceede1871709ad268bfd883178222cff342f`
- Interview Lab worktree: `C:\Users\dan18\AppData\Local\Temp\Backend-Atlas-interview-lab-20260826-110006`
- Interview Lab 브랜치: `feat/learn-atlas-interview-lab`

## 보호 경계

Phase 0 동안 기존 저장소 변경을 reset, clean, stash, restore, rebase하지 않았다. `Atlas-Management`의 사용자 미커밋 `README.md`, `index.html`은 읽기만 했고, Incruit/Backend 기존 worktree도 수정하지 않았다. OCI에서는 `/learn/` 정적 파일과 Nginx 설정을 변경하지 않았다.

다음 경로는 Interview Lab 배포 범위 밖이며 독립 보호 대상이다.

- `/`
- `/travel/`
- `/health/`
- `/jobs/`
- `/sketchfy/`
- `/world/`
- `/archive/`
- `/archiveos/`
- `/api/`
- `/atlas-admin-api`

## Source of truth 판정

`feat/run-atlas-learning-quality`는 원격 `main`보다 6 commits 앞서고 0 commits 뒤이며, 원격 feature SHA와 로컬 SHA가 일치한다. 최신 교육 품질, Incruit 검색 handoff, release provenance, 비식별 access monitor가 이 선에 있다. `fix/atlas-access-monitor-cutoff-20260827`은 같은 SHA에서 분기한 운영 모니터 전용 후속 브랜치이며 Interview Lab의 UI/content 기준을 바꾸지 않는다.

따라서 Interview Lab은 `c03bcee`에서 새 clean branch/worktree로 분리했다. `Atlas-Management` main은 원격과 갈라져 있고 사용자 변경이 있으므로 canonical 소스로 사용하지 않는다. Incruit는 연관 계약 확인용으로만 조사했다.

## 운영 기준선

운영 `/learn/`은 SHA `090c2ddb7a9739a5671efc3ece2af15aa154a294` build이며, asset manifest SHA는 `dcc2be168e5723fa2b61a6be050158e3a384108d81638909de6c1b5c547f08ed`이다. 현재 개발 기준 `c03bcee`보다 두 운영/접근 모니터 commits 이전이다. Phase 0 clean source release build manifest는 `0f28b3db5c37a86650912750b8cd3119f49d7692c18b33e97e01595ffe841e76`이다.

외부 브라우저에서 다음을 확인했다.

- 1440×900: home, quiz CTA, Interview Mode CTA visible, horizontal overflow 0, console warning/error 0
- 390×844: heading, quiz CTA, bottom navigation visible, horizontal overflow 0, console warning/error 0
- 기존 `?job=qa-job-42&topic=LocalStorage`: Incruit context와 `Web Storage API` 검색 결과 visible
- 목표 `?mode=interview&job=qa-job-42&topic=LocalStorage`: `mode=interview`가 처리되지 않고 동일 검색 화면에 머묾

## 최초 실패 계층과 Phase 1 진입 조건

기존 학습/검색/퀴즈 기능은 작동하지만 Interview Mode는 검수 문제 15개에서 10개를 섞어 기존 객관식 흐름을 재사용한다. 채용공고·후보자 경력·회사별 playlist·텍스트 답변·타이머·채점 rubric·session history가 없다. Incruit handoff도 job/topic 검색 문맥만 제공하며 Interview Lab session을 시작하지 않는다.

따라서 Phase 1은 다음을 먼저 만족해야 한다.

1. 공개 가능한 후보자 사실과 비공개 원문을 분리한다.
2. APPLIED/INTERVIEW 공고 및 공식 JD 원문을 source manifest로 고정한다.
3. 질문은 reviewed-only 계약을 유지하고, 출처·사실·후속질문·답안 parity를 검증한다.
4. 민감한 이력서 원문, 연락처, 계정, 사설 URL, 비밀값은 `www`와 Git에 포함하지 않는다.
5. 현재 Windows release preflight 오탐을 실제 콘텐츠 변경 검증으로 교정한 뒤에만 최종 release gate로 인정한다.

## 증거

- `evidence/before/phase0-operating-desktop-1440x900.png`
- `evidence/before/phase0-operating-mobile-390x844.png`
- `evidence/before/phase0-operating-incruit-handoff.png`
- `evidence/before/phase0-operating-mode-interview-gap.png`
- `evidence/before/phase0-cli-baseline.txt`
- `evidence/before/phase0-browser-baseline.json`

