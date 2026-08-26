# Security and Privacy Review

## 공개 빌드 경계

- `private/`는 `.gitignore`에 있고 `build-web.mjs` 자산 목록에 포함되지 않는다.
- 공개 `data/interview/`, Interview runtime, `index.html`과 비공개 deploy helper의 이메일, 전화번호, credential, private key, IPv4 정적 scan 결과 0건이다.
- 지원 완료 여부·희망연봉·주소·생년월일·실제 답변은 public data에 없다.

## 답변과 profile

- 답변은 query/hash에 기록하지 않고 Interview deep link는 legacy hash를 제거한 canonical URL로 정리한다.
- 답변은 기본 session memory이며 체크박스를 명시적으로 켠 경우에만 이 기기 localStorage에 저장한다.
- opt-out 시 저장된 답변 원문을 제거한다.
- private profile JSON은 schema validation 뒤 현재 탭 메모리에서만 사용한다.
- localStorage에는 candidateId와 fact count의 metadata만 남고 statement 원문은 남지 않는다.
- malformed JSON, schema mismatch, corrupt storage, quota failure는 앱을 깨뜨리지 않는다.

## 콘텐츠 안전

- 회사 질문은 공식 JD 기반 예상 질문으로 표시한다.
- source 원문을 장문 복사하지 않고 구조화 요약만 저장한다.
- 동적 문자열은 HTML escape하고 사용자 답변은 textarea value로만 처리한다.
