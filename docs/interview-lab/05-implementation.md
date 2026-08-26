# Phase 5 Implementation

Interview Lab은 기존 `app.js`에 세션 로직을 추가하지 않고 모듈로 분리했다.

- `interview-schema.js`: public bundle/private profile validation
- `interview-state.js`: versioned local state, corrupt storage recovery, answer opt-in, 면접일 저장
- `interview-score.js`: 공통·시스템 설계·행동 유형별 100점 rubric
- `interview-lab.js`: 15개 모드, 전형 단계별 질문 선택, timer·pause·resume·finish와 deep-link session 복구
- `interview-import.js`: 현재 탭 메모리 기반 private profile import
- `interview-router.js`: Incruit deep link, legacy search hash canonicalization, unsafe query 제거
- `interview-render.js`: 홈·세션·점검·14일 학습 플랜·D-Day render와 escaping
- `interview-lab.js`: lifecycle, timer, pause/resume, 새로고침 세션 복구, weak/review schedule
- `interview-lab.css`: desktop/mobile/tablet/print/reduced-motion
- `sw.js`: network-first 업데이트와 release별 cache 격리, offline fallback, stale cache 제거
- `ops/deploy-learn-release.sh`: exact SHA/manifest/asset 검증, timestamp backup, `/learn` 한정 교체·rollback

`build-web.mjs`는 `interview/`와 `data/interview/`의 모든 파일을 결정적 경로 순서로 manifest에 포함하고 content hash 기반 service worker cache version과 precache 목록을 생성한다. `private/`, `docs/`, `ops/`는 공개 빌드에 포함하지 않는다.

release preflight는 Windows stat/autocrlf 오탐을 피하기 위해 porcelain status가 아니라 실제 unstaged/staged diff와 untracked 파일을 각각 검사한다. 내용이 동일한 보고서의 stat 변화는 dirty로 오인하지 않으며 실제 변경은 계속 차단한다.
