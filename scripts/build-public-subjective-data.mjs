import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

globalThis.window = {};
await import('../interview/data/interview-data.js');

const bundle = globalThis.window.INTERVIEW_LAB_DATA;
if (!bundle?.questions?.length) throw new Error('Interview question bundle is unavailable');

const topic = (answer, clue, aliases = []) => ({ answer, clue, aliases });
const TOPICS = {
  'payment-ledger': topic('원장', '승인과 취소 이력을 덮어쓰지 않고 차변·대변 또는 증감 내역으로 보존하는 기록 구조', ['ledger', '결제 원장']),
  'shipment-state': topic('상태 머신', '배송 단계와 허용되는 전이 규칙을 명시해 잘못된 순서의 변경을 막는 모델', ['state machine', '유한 상태 머신']),
  'ad-budget': topic('페이싱', '한정된 광고 예산이 특정 시간대에 조기 소진되지 않도록 집행 속도를 조절하는 기법', ['pacing']),
  'batch-settlement': topic('파티셔닝', '대규모 정산 작업을 기준일이나 키 범위로 나누어 병렬 처리하는 기법', ['partitioning', '분할 처리']),
  'cache-degradation': topic('캐시 스탬피드', '캐시 만료 순간 다수 요청이 동시에 원본 저장소로 몰리는 현상', ['cache stampede', '스탬피드']),
  'event-outbox': topic('트랜잭셔널 아웃박스', 'DB 변경과 발행할 이벤트를 같은 트랜잭션에 기록한 뒤 별도 릴레이가 전달하는 패턴', ['transactional outbox', 'outbox', '아웃박스']),
  'api-gateway': topic('API 게이트웨이', '여러 백엔드 앞에서 인증·라우팅·호출 제한을 공통 처리하는 진입 계층', ['api gateway', '게이트웨이']),
  'rag-agent': topic('RAG', '검색한 근거 문서를 생성 모델의 입력에 결합해 답변의 근거성을 높이는 방식', ['retrieval augmented generation', '검색 증강 생성']),
  'migration-cutover': topic('섀도 리드', '새 저장소의 응답을 사용자에게 노출하지 않고 기존 응답과 비교하는 전환 검증 기법', ['shadow read', 'shadow reading']),
  observability: topic('관측성', '로그·메트릭·트레이스로 시스템 내부 상태를 외부 출력에서 추론할 수 있는 능력', ['observability']),
  conflict: topic('합의', '기술 방향 충돌을 사람의 선호가 아닌 사실·실험·결정 기준으로 좁혀 만드는 결과', ['consensus']),
  failure: topic('회고', '실패의 영향과 원인을 숨기지 않고 재발 방지 행동까지 도출하는 활동', ['retrospective', '포스트모템']),
  ambiguity: topic('인수 조건', '불명확한 요구사항을 검증 가능한 완료 기준으로 바꾸어 합의한 조건', ['acceptance criteria', '완료 조건']),
  pressure: topic('트레이드오프', '품질·범위·일정처럼 동시에 최대로 만족시키기 어려운 가치 사이의 선택 관계', ['tradeoff', 'trade-off']),
  incident: topic('인시던트 커맨드', '운영 장애에서 역할을 나누고 단일 소통 채널로 복구를 지휘하는 체계', ['incident command', '사고 지휘 체계']),
  security: topic('위험도', '발생 가능성과 영향도를 함께 고려해 보안 작업의 우선순위를 정하는 기준', ['risk', '리스크']),
  mentoring: topic('페어 프로그래밍', '두 사람이 한 작업을 함께 수행하며 지식과 판단 과정을 실시간 공유하는 방법', ['pair programming', '페어링']),
  feedback: topic('피드백 루프', '의견을 실행 가능한 개선으로 바꾸고 결과를 다시 관찰하는 반복 구조', ['feedback loop']),
  ownership: topic('오너십', '본인의 결정과 팀 성과를 구분하면서 결과를 끝까지 확인하는 태도', ['ownership', '주인의식']),
  motivation: topic('직무 적합성', '과거 경험과 앞으로 해결할 역할의 문제 사이의 구체적인 연결 정도', ['job fit', 'role fit']),
  '중복-요청-제거': topic('멱등성', '같은 요청을 여러 번 수행해도 최종 결과가 한 번 수행한 것과 같게 만드는 성질', ['idempotency']),
  '기간별-집계': topic('프리픽스 합', '누적값을 미리 저장해 연속 구간의 합을 두 누적값의 차로 구하는 기법', ['prefix sum', '누적합']),
  '최단-처리-경로': topic('다익스트라', '음수가 아닌 가중치 그래프에서 한 시작점부터 최단 거리를 구하는 알고리즘', ['dijkstra', '다익스트라 알고리즘']),
  '우선순위-작업': topic('힙', '최댓값이나 최솟값을 반복해서 빠르게 꺼내는 완전 이진 트리 기반 자료구조', ['heap']),
  '로그-구간-병합': topic('구간 병합', '시작점을 기준으로 정렬한 뒤 겹치는 시간 범위를 하나로 합치는 기법', ['interval merge', 'merge intervals']),
  '상위-k-오류': topic('최소 힙', '전체를 정렬하지 않고 가장 빈번한 K개만 유지할 때 사용하는 자료구조', ['min heap', 'min-heap']),
  '재시도-일정': topic('지수 백오프', '실패가 반복될수록 재시도 대기 시간을 지수적으로 늘리는 전략', ['exponential backoff', '백오프']),
  '문자열-정규화': topic('유니코드 정규화', '조합 방식이 다른 문자를 동일한 코드 표현 규칙으로 맞추는 처리', ['unicode normalization', 'NFC', 'NFKC']),
  'lru-cache': topic('LRU', '가장 오랫동안 사용되지 않은 항목을 먼저 제거하는 캐시 교체 정책', ['least recently used', 'LRU cache']),
  '시간순-이벤트': topic('타임스탬프', '서로 다른 이벤트의 발생 순서를 비교하기 위해 기록하는 시간 값', ['timestamp']),
  '중복-없는-순서': topic('LinkedHashSet', '중복은 제거하면서 입력 순서는 유지하는 자바 컬렉션', ['linked hash set']),
  '범위-조회': topic('TreeMap', '정렬된 키를 유지하며 특정 키 구간을 조회할 수 있는 자바 맵', ['tree map']),
  '우선순위-큐': topic('PriorityQueue', '우선순위가 가장 높은 원소를 먼저 꺼내도록 구성된 자바 컬렉션', ['priority queue']),
  'bounded-executor': topic('백프레셔', '처리 속도보다 입력이 빠를 때 생산자에게 지연이나 거부를 전달하는 제어', ['backpressure', 'back pressure']),
  '동시-집계': topic('LongAdder', '경합이 많은 다중 스레드 카운터를 여러 셀로 분산해 합산하는 자바 타입', ['long adder']),
  '취소-전파': topic('구조적 동시성', '부모 작업의 생명주기에 자식 작업의 완료와 취소를 묶는 동시성 모델', ['structured concurrency']),
  'lock-순서': topic('데드락', '둘 이상의 작업이 서로 가진 자원을 기다리며 영원히 진행하지 못하는 상태', ['deadlock', '교착 상태']),
  'completablefuture-timeout': topic('orTimeout', 'CompletableFuture가 지정 시간 안에 끝나지 않으면 예외로 완료시키는 메서드', ['or timeout']),
  '일별-결제-대사': topic('GROUP BY', '날짜별 결제 금액처럼 같은 키의 행을 묶어 집계하는 SQL 절', ['groupby', '그룹 바이']),
  '중복-승인-탐지': topic('윈도 함수', '행을 축약하지 않고 파티션 안의 순번·합계 등을 계산하는 SQL 기능', ['window function', 'window 함수']),
  '배치-실행시간': topic('LAG', '같은 파티션에서 현재 행보다 이전 행의 값을 가져오는 SQL 윈도 함수', ['lag function']),
  '배송-상태-전이': topic('재귀 CTE', '이전 단계의 결과를 다시 참조해 계층이나 연속 상태를 탐색하는 SQL 구문', ['recursive cte', 'WITH RECURSIVE']),
  '광고-클릭률': topic('CTR', '광고 노출 수 대비 클릭 수의 비율을 뜻하는 지표', ['click through rate', '클릭률']),
  '미정산-거래': topic('안티 조인', '한쪽에는 있고 다른 쪽에는 대응 행이 없는 데이터만 찾는 조인 패턴', ['anti join', 'anti-join']),
  '기관별-오차': topic('FULL OUTER JOIN', '양쪽의 일치 행뿐 아니라 어느 한쪽에만 있는 행도 모두 보존하는 조인', ['full join', '풀 아우터 조인']),
  '재처리-대상': topic('SKIP LOCKED', '다른 트랜잭션이 잠근 행을 기다리지 않고 건너뛰는 SQL 잠금 옵션', ['skiplocked']),
  '결제-원장': topic('복식부기', '하나의 거래를 차변과 대변에 같은 금액으로 기록하는 회계 모델', ['double-entry bookkeeping', 'double entry']),
  '정산-상태': topic('상태 전이', '현재 상태와 이벤트에 따라 다음 상태를 제한하는 모델링 방식', ['state transition']),
  '배송-이벤트': topic('이벤트 소싱', '현재값 대신 상태를 바꾼 사건의 연속을 원본 데이터로 저장하는 패턴', ['event sourcing']),
  '광고-노출': topic('팩트 테이블', '노출·클릭처럼 측정 가능한 사건을 차원 키와 함께 저장하는 분석 모델의 중심 테이블', ['fact table']),
  '배치-실행': topic('체크포인트', '긴 작업의 중간 진행 상태를 저장해 실패 후 그 지점부터 재개하게 하는 기록', ['checkpoint']),
  'n-1': topic('N+1', '목록 한 번 조회 뒤 각 행마다 추가 쿼리가 반복되는 데이터 접근 문제', ['n plus one', 'n+1 query']),
  '누락된-timeout': topic('타임아웃', '외부 호출이 정해진 시간 안에 끝나지 않으면 중단하는 제한', ['timeout']),
  '중복-retry': topic('재시도 폭풍', '다수 요청이 동시에 반복 재시도하면서 장애 시스템의 부하를 더 키우는 현상', ['retry storm']),
  '잘못된-transaction-경계': topic('트랜잭션 경계', '원자적으로 성공하거나 실패해야 하는 작업 묶음의 시작과 끝', ['transaction boundary']),
  '민감정보-로그': topic('로그 마스킹', '로그에 기록되는 개인정보나 비밀값의 일부 또는 전부를 가리는 처리', ['log masking', '마스킹']),
  'rate-limiter': topic('토큰 버킷', '일정 속도로 토큰을 채우고 요청마다 토큰을 소비해 순간 폭주도 허용하는 호출 제한 알고리즘', ['token bucket']),
  'idempotency-registry': topic('멱등키', '동일한 쓰기 요청을 식별해 중복 처리를 막기 위해 클라이언트가 보내는 키', ['idempotency key']),
  'csv-validator': topic('상태 머신', '따옴표와 구분자를 문맥에 따라 처리하며 CSV를 한 글자씩 읽는 모델', ['state machine']),
  'retry-policy': topic('지터', '동시 재시도를 피하려고 백오프 대기 시간에 더하는 임의의 흔들림', ['jitter']),
  'settlement-comparator': topic('대사', '두 원장의 거래를 비교해 누락·중복·금액 차이를 찾는 작업', ['reconciliation', '정산 대사']),
  '거대-service-분리': topic('단일 책임 원칙', '하나의 모듈이 하나의 변경 이유만 가져야 한다는 설계 원칙', ['SRP', 'single responsibility principle']),
  '조건문-정책화': topic('전략 패턴', '교체 가능한 알고리즘을 공통 인터페이스 뒤의 객체로 캡슐화하는 패턴', ['strategy pattern', 'strategy']),
  '시간-의존성-제거': topic('Clock', '현재 시각을 직접 호출하지 않고 주입해 시간 의존 코드를 테스트 가능하게 하는 자바 추상화', ['java clock']),
  '외부-연계-adapter': topic('어댑터 패턴', '외부 시스템의 인터페이스를 내부에서 기대하는 계약으로 변환하는 패턴', ['adapter pattern', 'adapter']),
  '오류-모델-표준화': topic('문제 상세', 'HTTP API 오류를 type·title·status·detail 같은 표준 필드로 표현하는 형식', ['problem details', 'RFC 9457', 'RFC 7807']),
};

const forbidden = [...new Set((bundle.jobs || []).flatMap(job => [job.company, job.role]).filter(Boolean))];
const sourceQuestions = bundle.questions
  .filter(question => question.scope === 'shared')
  .filter(question => !(question.companies || []).length && !(question.roles || []).length);

const questions = sourceQuestions.map(question => {
  const key = question.tags?.[1];
  const definition = TOPICS[key];
  if (!definition) throw new Error(`Missing short-answer definition for topic: ${key}`);
  return {
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    question: `다음 설명에 맞는 용어는 무엇인가요? ${definition.clue}`,
    answer: definition.answer,
    acceptedAnswers: [definition.answer, ...definition.aliases],
    explanation: `${definition.answer}: ${definition.clue}`,
    tags: (question.tags || []).slice(0, 6),
  };
});

if (questions.length < 300) throw new Error(`Too few public short-answer questions: ${questions.length}`);
if (questions.some(question => !question.answer || !question.acceptedAnswers.length)) throw new Error('Every public question must have a canonical short answer');
const serialized = JSON.stringify({ schemaVersion: 2, generatedAt: bundle.generatedAt, answerType: 'single-term', questions });
for (const value of forbidden) {
  if (value && serialized.toLocaleLowerCase('ko-KR').includes(value.toLocaleLowerCase('ko-KR'))) {
    throw new Error(`Employer-specific value leaked into public short-answer data: ${value}`);
  }
}

const output = `window.ATLAS_SUBJECTIVE_QUESTIONS=${serialized};\n`;
await writeFile(resolve(import.meta.dirname, '..', 'subjective-questions.js'), output, 'utf8');
console.log(`Public short-answer data built: ${questions.length} single-term questions across ${Object.keys(TOPICS).length} topics; employer and candidate scopes excluded.`);
