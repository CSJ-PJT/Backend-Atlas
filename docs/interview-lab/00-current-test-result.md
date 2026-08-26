# Phase 0 현재 테스트 및 release gate

실행 worktree: `C:\Users\dan18\AppData\Local\Temp\Backend-Atlas-interview-lab-20260826-110006`

## 실행 결과

| Gate | 결과 | 증거 |
|---|---|---|
| `npm ci` | PASS | 131 packages installed from lockfile |
| `npm test` | PASS | smoke, education contract, runtime, visuals, access monitor |
| smoke | PASS | reviewed questions 15, quiz, Why, search, related topics |
| education quality | PASS | 15 reviewed questions from 5,000, B-Tree/Servlet curated |
| learning runtime | PASS | schema boundary, XSS escape, deep-link, active recall, scoring, follow-up, retry |
| visual mapping | PASS | concept-specific accessible diagrams |
| access monitor | PASS | privacy and daily aggregation |
| `npm run quality:audit` | PASS_WITH_WARNINGS | 15 questions, 187 concepts, 0 errors, 260 warnings |
| audit determinism | PASS | generatedAt fixed at 2026-08-25T00:00:00.000Z |
| `npm run build:release` | PASS_AFTER_STAT_REFRESH | 16 assets, clean source provenance |
| build provenance | PASS | manifest `0f28b3db5c37a86650912750b8cd3119f49d7692c18b33e97e01595ffe841e76` |

## 확인된 release gate 결함

`npm run test:release`을 한 번에 실행하면 `quality:audit`이 tracked report 두 파일을 LF로 다시 기록한다. 생성된 파일의 Git blob SHA는 index와 동일하고 `git diff --exit-code`도 0이지만, Windows Git stat cache는 기존 checkout 크기를 유지하여 `git status --porcelain`에서 modified로 보인다. `build-web.mjs --release`는 이를 실제 source 변경으로 오판해 다음 메시지로 preflight를 중단한다.

```text
Release build refused during preflight: tracked or untracked source changes exist outside www
```

두 report를 `git add`로 다시 해시한 결과 staged diff 없이 clean이 되었고, 그 뒤 동일 source에서 release build와 provenance test가 통과했다. Phase 6 전에는 preflight가 stat/line-ending 오탐 대신 실제 diff와 untracked source를 판정하도록 회귀 테스트와 함께 수정해야 한다.

## 보안·품질 경고

`npm ci`는 기존 dependency graph에 high severity advisory 3건을 보고했다. 자동 `npm audit fix`는 실행하지 않았다. dependency 업그레이드는 범위와 runtime 영향을 별도 검토해야 한다.

현재 gate는 Interview Lab의 candidate/JD source manifest, fact allowlist, corpus 규모, duplicate, secret scan, handoff session, timer, free-text XSS, mobile/print/PWA를 아직 검증하지 않는다. Phase 6에 전용 테스트가 추가되어야 한다.

