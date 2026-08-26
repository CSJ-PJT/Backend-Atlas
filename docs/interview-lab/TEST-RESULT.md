# Test Result

상태: LOCAL RELEASE GATES PASS, OCI DEPLOYMENT AND PUBLIC SMOKE PASS

- 기존 smoke: PASS — 공개 reviewed 객관식 15개
- education quality contract: PASS
- learning runtime: PASS
- learning visuals: PASS
- access monitor: PASS
- Learn deploy/rollback safety contract: PASS
- Interview schema: PASS — 695개
- source coverage: PASS — 회사 문항 250개, 10개 role-isolated playlist, 직무별 D-Day system focus
- fact consistency: PASS — 공개 안전 fact 6개
- duplicate: PASS — 정규화 unique 695개
- public secret/PII scan: PASS — 데이터·runtime·HTML·deploy helper 30개 source asset
- Interview runtime: PASS — 15개 모드 세션, 전형 단계별 질문군, canonical deep link, fallback, session reload/finish, timer, reveal, 꼬리질문, 약점·복습, 유형별 score, profile import, corrupt/downgrade/quota recovery, XSS, 14일 학습 플랜, 직무별 D-Day print
- content quality audit: PASS — 기존 0 errors / 260 warnings
- Interview audit: PASS — 0 errors
- normal build: PASS — 44 assets
- build provenance: PASS
- browser 390×844: PASS — canonical URL, session reload ID 유지, overflow 0, console warn/error 0
- browser 412×915: PASS — overflow 0
- browser 768×1024: PASS — overflow 0
- browser 1440×900: PASS — overflow 0
- browser offline/PWA: PASS — local server 중단 후 reload, Interview session과 22개 asset graph 복구, console warn/error 0
- OCI stage/operating/public asset parity: PASS — source `44fcb49`, manifest `bfc9396d`, 공개 asset 44개
- OCI browser 390×844: PASS — D-Day Top 30, 시스템 설계 5, 체크리스트 10, overflow 0
- OCI browser 412×915: PASS — 직무 briefing, 실제 세션, 공식 공고 링크, overflow 0
- OCI browser console warning/error: 0
- OCI owner/mode/SELinux mismatch: 0
- OCI Nginx 및 다른 Atlas route status contract: PASS

실브라우저에서 발견해 수정한 회귀:

1. 전역 `header` selector가 내부 면접 header에 적용되어 모바일 타이머·질문이 겹침
2. Incruit deep link 뒤로가기와 D-Day 홈 복귀가 세션을 자동 재시작
3. 390px 하단 6개 탭에 가로 스크롤 표시
4. 면접 예정일 기반 14일 학습 플랜과 D-Day 전체 체크리스트 누락
5. 시스템 설계·행동 질문이 공통 기술 rubric만 사용
6. Interview deep link에 이전 검색 hash가 남아 canonical URL과 history를 오염
7. deep link 새로고침이 같은 미완료 세션을 복구하지 않고 중복 생성 가능
8. 기존 network-only service worker로 offline/PWA와 release별 stale cache 정리 gate를 증명할 수 없음
9. 같은 회사의 복수 직무 playlist가 회사명만으로 묶여 타 role 질문을 섞고, D-Day 시스템 설계가 직무와 무관하게 고정될 수 있음
10. 전형 단계 선택값이 저장만 되고 일반 시간형 세션의 질문군에 반영되지 않음
11. 공통 모드에서 D-Day가 사용자가 선택하지 않은 첫 번째 회사를 암묵적으로 사용함
12. Incruit 공고 handoff 뒤 역할·전형·공개 안전 경력 근거·학습 큐·공식 링크가 한 화면에 연결되지 않음

clean 기능 브랜치에서 `npm run test:release` 전체 PASS와 44개 공개 asset provenance를 확인했다. 운영 `build-info.json`, disk manifest, 공개 asset graph는 승인·배포한 앱 source `44fcb49db2effe5cd5f49caa57cfd4c9be078008`와 exact 일치한다. 배포 후 helper 안전성 수정은 앱 code/asset을 변경하지 않으며 별도 Git commit으로 추적한다.
