# Backend Study Phase 0 Baseline

Checked: 2026-08-26 KST

```text
BASE_BRANCH=feat/learn-atlas-interview-lab
BASE_HEAD=de76a19b79cd7bcbd044953cd1e704f5f118c8d5
TREE_STATE=clean
IMPLEMENTATION_BRANCH=feat/learn-backend-study
CURRENT_PUBLIC_SOURCE_HEAD=44fcb49db2effe5cd5f49caa57cfd4c9be078008
CURRENT_PUBLIC_RELEASE_ID=44fcb49db2ef-bfc9396de936
CURRENT_PUBLIC_MANIFEST_SHA=bfc9396de936cffd938044169f9f3c3aa5b217938ee41c903135e03f8468220a
CURRENT_LEARN_ROUTE=/learn/
CURRENT_INTERVIEW_ROUTE=/learn/?mode=interview
CURRENT_RUN_COMPAT_ROUTE=/run and /run/ -> /learn/
DEPLOY_HELPER=ops/deploy-learn-release.sh
DEPLOY_TARGET_DISCOVERY=/usr/share/nginx/html/learn
```

## Repository and protected worktrees

- Repository: `CSJ-PJT/Backend-Atlas`
- Node: `v24.18.0`
- npm: `11.16.0`
- Base worktree and the existing education/access-monitor worktrees were clean when the implementation worktree was created.
- `Atlas-Management` retained its pre-existing `README.md` and `index.html` modifications and is out of scope.
- Prohibited history operations were not used.

## Existing product contracts

- The existing Learn shell is a static HTML/CSS/JavaScript application with quiz, score, wrong-answer, review, knowledge search and architecture views.
- Interview Lab is a separate view opened by the query contract `?mode=interview`; its state, question data, PWA assets and Incruit handoff must remain intact.
- `scripts/build-web.mjs --release` rejects a dirty source tree and writes deterministic `www/build-info.json` and `www/asset-manifest.json`.
- The service worker uses a content-derived cache version, network-first fetch and offline cache fallback.
- The deployment helper validates source SHA and every manifest asset, creates a timestamped backup, atomically replaces only `/usr/share/nginx/html/learn`, restores the target SELinux context and runs `nginx -t`.

## Route discovery

The operating Nginx location uses an alias for `/learn/` and `try_files $uri $uri/ /learn/index.html`. Therefore `/learn/backend-study/` currently falls back to the root Learn shell because no physical directory exists. `/learn/interview/` currently resolves to the physical `interview/` asset directory without an index and returns 403. Backend Study will use a real standalone `backend-study/index.html`; Interview Lab will keep its query contract and gain a path compatibility entry without changing Nginx.

## Input source

- Migration seed: `백엔드_실무_역량_학습_가이드_32일_20260826.pdf`
- Pages: 141, A4, no encryption, forms or embedded JavaScript.
- The guide contains 21 chapters and 32 Days. Each Day has a learning section, Worked Example, practice, Verify rubric, four recall/explain prompts and official references.
- The public implementation will use normalized reviewed JSON. The PDF is not parsed at runtime and the original local path is not published.

## Initial route status

| Route | Status | Meaning |
| --- | ---: | --- |
| `/learn/` | 200 | Current Learn/Interview shell |
| `/learn/backend-study/` | 200 | Currently root-shell fallback; not yet a distinct page |
| `/learn/interview/` | 403 | Physical directory collision; compatibility fix required |
| `/run/` | 308 | Existing compatibility redirect |
