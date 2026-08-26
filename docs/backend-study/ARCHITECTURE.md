# 백엔드 실무 학습 아키텍처

## 경계

`/learn/backend-study/`는 기존 Backend Atlas 홈과 Interview Lab을 대체하지 않는 독립 정적 페이지다. Nginx 설정이나 API·DB를 추가하지 않고 `/usr/share/nginx/html/learn`의 기존 SPA/정적 별칭 아래에 배포한다.

## Source of Truth

```text
data/backend-study/*.json
 ├─ curriculum.json        21챕터·32일 교육 흐름
 ├─ practice-bank.json     안내/독립 실습과 검증 계약
 ├─ question-bank.json     192문항과 기준 답안·루브릭
 ├─ source-manifest.json   공식·권위 출처 55개
 ├─ quality-contract.json  공개·검수·스키마 게이트
 └─ review-manifest.json   검수 귀속 증거
          │
          ├─ scripts/build-backend-study-data.mjs → 브라우저 데이터 번들
          ├─ scripts/build-backend-study-pdf.py  → 159쪽 인쇄용 가이드
          └─ schema/source/privacy/runtime tests → release gate
```

PDF를 브라우저에서 런타임 해석하지 않는다. 웹과 PDF는 정규화 JSON에서만 파생한다.

## Browser Runtime

- `backend-study-app.js`: history/query 기반 뷰와 학습·시험·복습·진도 렌더링
- `backend-study-state.js`: 별도 localStorage key와 스키마 마이그레이션
- URL에는 `view`, `day`, `section`만 기록한다. 입력 답안은 현재 메모리에만 존재한다.
- 객관식은 자동 채점하고 서술형·코드·SQL·설계 답안은 기준 답안 공개 뒤 자기평가한다.
- 오답/난이도 결과는 질문 ID·점수·약점 태그만 저장한다.

## Offline / Release

기존 content-hash Service Worker가 새 하위 경로와 PDF를 precache한다. `build-web.mjs --release`는 깨끗한 Git SHA, 소스 불변, 결정적 asset manifest와 build-info를 검증한다.
