# Final Interview Lab Report

현재 판정: **PASS — INTERVIEW LAB OCI DEPLOYED**

- 실제 배포 앱 source: `44fcb49db2effe5cd5f49caa57cfd4c9be078008`
- 운영 release ID: `44fcb49db2ef-bfc9396de936`
- 운영 asset manifest: `bfc9396de936cffd938044169f9f3c3aa5b217938ee41c903135e03f8468220a`
- 배포 후 운영 도구 보완 commit: `a65015d9d914f6ed22e7af229fcd9698d9136d11`

## 완료

- Phase 0 저장소·운영·경로 기준선
- Phase 1 공개/비공개 후보자 사실 경계와 공식 JD source manifest
- Phase 2 회사·전형·15개 모드·세션·유형별 평가·복습·면접일 기반 14일 플랜·D-Day 설계
- Phase 3 reviewed 질문 695개와 꼬리질문 2,085개, 10개 role-isolated 50문항 playlist와 직무별 D-Day system focus
- Phase 4 schema/source/fact/duplicate/secret quality gate
- Phase 5 모듈형 UI·state·router·score·import·render
- content-hash versioned network-first PWA cache와 offline fallback
- `/learn` 한정 SHA/manifest 검증·backup·rollback 배포 helper
- 기존 기능과 Interview Lab 자동 회귀
- 390×844, 412×915, 768×1024, 1440×900 및 서버 중단 offline/PWA 실브라우저 smoke
- clean 기능 브랜치의 `npm run test:release` 전체 PASS와 44개 공개 asset provenance 검증
- Incruit handoff에서 역할·전형·공개 안전 경력 근거·학습 큐·공식 공고 링크 연결
- 기존 운영본 timestamp backup, 전체 release stage parity, `/learn/` 원자 교체
- 운영 disk/public 44개 asset graph parity, owner/mode/SELinux/Nginx 검증
- 운영 390×844·412×915 Interview Lab, 직무 briefing, 세션, D-Day 실브라우저 smoke
- Atlas root와 `/run/`, `/jobs/`, `/health/`, `/travel/`, `/sketchfy/`, `/world/`, `/archive/`, `/archiveos/`, `/admin/`, `/api/` 응답 계약 회귀 확인

## 배포 중 발견·복구

처음 원자 교체할 때 `/tmp` stage에 `restorecon`을 실행해 stage의 `user_tmp_t`가 운영 경로에 승계되면서 `/learn/`이 일시적으로 HTTP 403을 반환했다. 운영 경로에 `restorecon -RF /usr/share/nginx/html/learn`을 적용해 즉시 `httpd_sys_content_t`와 HTTP 200을 복구했다. 이후 배포 helper가 atomic move 다음에 운영 target의 context를 복구하도록 수정하고 회귀 테스트를 추가했다.

PR은 열려 있으며 merge하지 않았다. 공개 앱은 검증·승인된 `44fcb49` artifact이고, 후속 Git commit은 배포 helper 및 결과 문서만 변경하므로 앱 artifact provenance와 구분한다.
