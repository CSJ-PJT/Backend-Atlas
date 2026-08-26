# Known Limitations

1. 지시서가 지정한 최신 최종 후보자 문서 3개와 지원 완료 목록을 찾지 못했다. 소속 관계와 실제 지원 역할을 추측하지 않는다.
2. Incruit Atlas 상태는 브라우저 localStorage 기반이라 현재 공개 화면의 APPLIED 0/SAVED 0만 확인했다. 실제 지원 이력 source of truth로 쓰지 않았다.
3. 카카오페이증권, Coupang, 카카오스타일, CJ올리브영의 정확한 지원 직무는 `needs-confirmation`이다.
4. JYP 공식 역할 상세는 확인했지만 현재 모집 상태는 재확인이 필요하다.
5. 기존 reviewed 객관식은 15개뿐이다. 회사 playlist 50개는 legacy 15개와 새 Interview Lab reviewed 문항을 조합한다.
6. private profile v1은 session-only다. WebCrypto 암호화 export는 P0 범위에서 제외했다.
7. 음성 입력은 기본 비활성화했고 Web Speech API를 사용하지 않는다.
8. 이번 보고 시점의 OCI 운영 `/learn/`에는 아직 Interview Lab을 배포하지 않았다. 사용자 승인 전 변경 금지다.
