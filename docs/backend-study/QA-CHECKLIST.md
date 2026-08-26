# QA 체크리스트

## 데이터와 품질

- [ ] 21챕터, 32일, 실습 32개, 문항 192개
- [ ] 모든 항목 reviewed, sourceRefs 연결
- [ ] 금지 문자열·비밀·개인정보 없음
- [ ] PDF와 웹이 canonical JSON에서 생성됨
- [ ] 인쇄용 PDF 전 페이지 생성, 대표 페이지 한글/잘림 확인

## Runtime

- [ ] 홈에서 32일 지도와 다음 DAY가 보임
- [ ] `/learn/backend-study/?view=day&day=D10&section=verify` 새로고침 가능
- [ ] 개념→사례→안내 실습→독립 실습→검증→회상→완료 이동
- [ ] 실습 단계 저장·완료 판정
- [ ] 객관식 자동 채점
- [ ] 서술형 답을 적기 전 기준 답안 차단
- [ ] 답안 원문이 URL/localStorage에 없음
- [ ] 오답·약점·복습 일정 저장
- [ ] v0 상태 마이그레이션과 손상 상태 복구
- [ ] 기록 초기화 확인창

## Responsive / Accessibility

- [ ] 1440×900
- [ ] 390×844
- [ ] 412×915
- [ ] 가로 overflow 0
- [ ] 하단 네비게이션 4개 모두 보임
- [ ] 탭과 버튼 키보드 접근
- [ ] focus 이동과 live status
- [ ] 밝기·대비·한글 줄바꿈

## Release / OCI

- [ ] full test, quality audit, release build
- [ ] source HEAD와 build-info 일치
- [ ] 기존 `/learn` timestamp backup
- [ ] local/staged/operating manifest 일치
- [ ] root:root, dirs 0755, files 0644, httpd_sys_content_t
- [ ] nginx -t와 reload
- [ ] 공개 홈·백엔드 실무 학습·Interview Lab·PDF HTTP 200
- [ ] `/run/` 호환 경로 유지
- [ ] 실패 시 직전 backup rollback
