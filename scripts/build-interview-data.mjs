import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const dataRoot=resolve(root,'data/interview');
const outputRoot=resolve(dataRoot,'generated');
const runtimeRoot=resolve(root,'interview/data');
const readJson=async path=>JSON.parse(await readFile(resolve(root,path),'utf8'));
const slug=value=>String(value).normalize('NFKC').toLowerCase().replace(/[^a-z0-9가-힣]+/g,'-').replace(/^-|-$/g,'');
const unique=value=>[...new Set(value.filter(Boolean))];

const facts=await readJson('data/interview/candidate-facts-public.json');
const sourceManifest=await readJson('data/interview/sources/job-sources.json');
const jobFiles=[
  'linepay-server-engineer.json','linepay-ai-data-platform-engineer.json','kakaomobility-logistics-agent-backend.json',
  'jyp-software-engineer-backend.json','nhnkcp-java-backend.json','kakaopaysec-backend-needs-confirmation.json',
  'coupang-backend-needs-confirmation.json','kakaostyle-display-backend-needs-confirmation.json',
  'cjoliveyoung-ad-dsp-backend-needs-confirmation.json','cjoliveyoung-common-platform-backend-needs-confirmation.json'
];
const jobs=await Promise.all(jobFiles.map(file=>readJson(`data/interview/jobs/${file}`)));

const rubrics={
  common:{factAccuracy:25,technicalDepth:20,ownership:15,structure:15,tradeOff:10,operationsSecurity:10,metricsOutcome:5},
  systemDesign:{requirementsAssumptions:12,capacity:10,apiDataModel:14,consistency:12,scalability:12,failureHandling:12,observability:10,security:10,costTradeOff:8},
  behavior:{specificity:15,judgment:18,collaboration:15,action:20,outcome:17,reflection:15}
};
const rubricForCategory=category=>category==='system-design'?rubrics.systemDesign:category==='behavior'?rubrics.behavior:rubrics.common;
const baseQuestion=(id,scope,category,question,intent,answerOutline,sourceRefs,extra={})=>({
  id,schemaVersion:1,scope,companies:[],roles:[],stages:['first-technical'],category,difficulty:'deep',question,
  interviewerIntent:intent,evidenceFactIds:[],forbiddenClaimIds:[],answerOutline,
  answer20Sec:answerOutline.slice(0,2).join(' '),answer90Sec:answerOutline.join(' '),
  deepDive:`${answerOutline.join(' ')} 답변 뒤에는 전제, 실패 조건, 검증 지표를 구분하고 모르는 내부 정보는 추정하지 않습니다.`,
  followUps:[],followUpGuides:[],redFlags:['근거 없이 범위를 넓히는 답변','본인 역할과 팀 결과를 구분하지 않는 답변'],rubric:rubricForCategory(category),
  tags:[category],sourceRefs,provenanceLevel:'practice-inference',reviewStatus:'reviewed',reviewedAt:'2026-08-26',...extra
});

const candidateTopics=[
  ['throughput-855','처리량 약 855배 개선','서로 다른 건수를 분당 처리량으로 환산한 계산과 측정 조건','병목을 재현하고 반복 쓰기를 줄인 설계','metric-throughput-normalized-855x',['claim-same-volume-comparison'],'performance'],
  ['transit-settlement','교통 정산과 대사','원천·집계·정산 상태와 금액·건수 대사','부분 실패를 격리하고 재처리 가능한 상태 모델','project-transit-settlement',[],'settlement'],
  ['interface-27','27개 대외 연계','인터페이스 목록·계약·개통 체크리스트','기관별 차이를 계약과 어댑터로 격리','integration-count-27',[],'integration'],
  ['idc-migration','IDC 이전과 차세대 전환','현행 자산 inventory와 신구 결과 대사','전환 기준·롤백·첫 정기 배치를 단계별 검증','career-java-spring-six-plus',[],'migration'],
  ['batch-idempotency','배치 재실행과 멱등성','기준일·재실행 키·중복 방지·감사 이력','부분 성공을 상태로 남기고 안전하게 이어서 처리','project-transit-settlement',[],'batch'],
  ['eai-rest','대외 연계 전환','DB-Link·polling·File·REST의 실패 모드 비교','timeout·retry·idempotency와 버전 계약','integration-count-27',[],'integration'],
  ['kafka-disconnect','Kafka 연결 끊김 분석','producer·broker·network·timeout 지표로 원인 분리','재시도 폭주와 중복을 피하는 복구 순서','career-java-spring-six-plus',[],'messaging'],
  ['oracle-tuning','Oracle SQL 성능 개선','실행 계획·카디널리티·I/O·lock의 증거','인덱스와 SQL 변경의 쓰기 비용까지 검증','career-java-spring-six-plus',[],'database'],
  ['security-quality','보안과 품질 개선','민감정보·XSS·CSRF·예외 노출·정적 분석','최소 수정 후 회귀와 운영 로그를 함께 확인','career-java-spring-six-plus',[],'security'],
  ['sap-rest-boundary','SAP ERP REST 연동','연동 계약·오류·재시도 책임 경계','ERP 내부 개발이 아닌 API 소비자 역할을 정확히 설명','career-java-spring-six-plus',['claim-sap-erp-development'],'integration'],
  ['archive-atlas','Archive와 Atlas 개인 프로젝트','문제 선택·설계·구현·검증 책임','합성·비식별 데이터와 실제 트래픽 한계를 공개','project-archive-atlas',['claim-commercial-personal-project'],'portfolio'],
  ['ai-tools','AI 개발도구 활용','도구가 생성한 결과와 본인의 요구사항·경계·검증','테스트와 런타임 증거로 최종 책임을 분리','project-archive-atlas',['claim-self-trained-llm'],'ai'],
  ['affiliation-boundary','소속회사와 투입처 구분','계약 소속과 고객 프로젝트를 시간축으로 분리','확인되지 않은 고용관계를 단정하지 않음','career-java-spring-six-plus',['claim-tmoney-employee','claim-yanolja-employee'],'career'],
  ['failure-learning','실패와 재발 방지','징후·판단·영향·복구·사후 조치','개인 탓 대신 시스템 guard와 관측성으로 개선','career-java-spring-six-plus',[],'behavior'],
  ['product-transition','제품회사 지원 동기','운영·정산 경험을 제품의 장기 품질에 연결','도메인 학습 계획과 첫 90일 기여를 구체화','career-java-spring-six-plus',[],'career']
];
const lenses=[
  ['explain','핵심을 90초 안에 구조적으로 설명해 주세요.','정의보다 문제, 선택, 결과 순서가 드러나는지 확인'],
  ['evidence','주장을 입증할 수치와 관측 증거를 제시해 주세요.','성과 수치의 계산과 측정 조건을 검증'],
  ['diagnose','같은 문제가 재현되면 원인을 어떤 순서로 분리하겠습니까?','가설보다 증거를 우선하는 진단 능력을 확인'],
  ['design','처음부터 다시 설계한다면 경계와 데이터 모델을 어떻게 바꾸겠습니까?','재설계 시 요구사항과 실패 모델을 확인'],
  ['tradeoff','선택한 방식의 가장 큰 trade-off와 대안은 무엇입니까?','장점만 말하지 않고 비용을 인식하는지 확인'],
  ['incident','운영 중 부분 실패가 나면 탐지·격리·복구를 어떻게 하겠습니까?','운영 안전성과 재처리 계약을 확인'],
  ['verify','변경이 안전하다는 것을 어떤 테스트와 지표로 증명하겠습니까?','검증 가능성과 rollback 기준을 확인'],
  ['reflect','본인 책임 범위와 다시 한다면 바꿀 점을 말해 주세요.','소유권을 과장하지 않고 학습을 설명하는지 확인']
];

const questions=[];
for(const [topicId,title,context,approach,factId,forbidden,category] of candidateTopics){
  for(const [lensId,prompt,intent] of lenses){
    const q=baseQuestion(`candidate-${topicId}-${lensId}`,'candidate',category,`${title}: ${prompt}`,intent,[`${context}을 먼저 명시합니다.`,`${approach}을 본인 역할과 팀 협업으로 나눠 설명합니다.`,`결과와 한계, 재현 가능한 검증 기준을 함께 제시합니다.`],[factId==='project-archive-atlas'?'candidate-source-portfolio-20260701':'candidate-source-career-20260701'],{
      evidenceFactIds:[factId],forbiddenClaimIds:forbidden,provenanceLevel:'verified-candidate',tags:[category,topicId,lensId]
    });
    q.followUps=[`${title}에서 가장 먼저 확인한 원시 지표는 무엇입니까?`,`${approach}이 실패하는 경계 조건은 무엇입니까?`,`팀 결과와 본인이 직접 결정한 부분을 구분해 주세요.`];
    q.followUpGuides=[`측정 단위와 시간 범위를 명시합니다.`,`대안과 rollback 기준을 함께 말합니다.`,`본인이 작성·검증한 산출물을 구체적으로 말합니다.`];
    questions.push(q);
  }
}

const systemTopics=[
  ['payment-ledger','결제 승인·취소 원장','멱등키, 원장 불변성, 정산 대사','rfc9110-http-semantics'],
  ['shipment-state','배송·배차 상태 이벤트','상태 전이, 순서, 중복, 지연 이벤트','apache-kafka-docs'],
  ['ad-budget','광고 예산과 과금','pacing, 노출·클릭 로그, 중복 과금 방지','postgresql-current-docs'],
  ['batch-settlement','대규모 정산 배치','기준일, partition, 재실행, 대사','postgresql-current-docs'],
  ['cache-degradation','조회 캐시와 강등','TTL, stampede, stale 허용 범위','rfc9110-http-semantics'],
  ['event-outbox','트랜잭션 Outbox','원자성, relay, 중복 소비, 순서','apache-kafka-docs'],
  ['api-gateway','공통 API 플랫폼','인증, rate limit, 추적, 표준 오류','rfc9110-http-semantics'],
  ['rag-agent','RAG·Agent 워크플로','근거, 권한, 승인, 감사, provider 실패','spring-framework-reference'],
  ['migration-cutover','무중단 전환','dual write 위험, backfill, shadow read, rollback','postgresql-current-docs'],
  ['observability','운영 관측성','SLI, trace, 로그 상관관계, alert 품질','spring-framework-reference']
];
for(const [topicId,title,dimensions,sourceRef] of systemTopics){
  for(const [lensId,prompt,intent] of lenses){
    const q=baseQuestion(`system-${topicId}-${lensId}`,'shared','system-design',`${title} 시스템을 설계합니다. ${prompt}`,intent,[`기능·비기능 요구사항과 트래픽 가정을 먼저 확인합니다.`,`${dimensions}을 데이터 계약과 실패 모델에 반영합니다.`,`관측 지표, 보안, 비용, 단계적 rollout과 rollback을 제시합니다.`],[sourceRef],{provenanceLevel:'technical-official-source',tags:['system-design',topicId,lensId]});
    q.followUps=[`용량 추정에 가장 민감한 가정은 무엇입니까?`,`부분 장애에서 보존해야 할 불변식은 무엇입니까?`,`비용을 절반으로 줄여야 하면 무엇을 단순화하겠습니까?`];
    q.followUpGuides=[`QPS·데이터 크기·보존 기간을 수치화합니다.`,`정합성과 가용성 우선순위를 명시합니다.`,`필수·선택 기능을 분리합니다.`];
    questions.push(q);
  }
}

const behaviorTopics=[
  ['conflict','기술 방향 충돌','의견 차이를 사실·실험·결정 기준으로 좁힌 경험'],['failure','실패 경험','영향을 숨기지 않고 복구와 재발 방지를 만든 경험'],
  ['ambiguity','불명확한 요구사항','질문·가정·acceptance criteria로 범위를 합의한 경험'],['pressure','일정 압박','품질·범위·일정 trade-off를 투명하게 조정한 경험'],
  ['incident','운영 장애 협업','역할을 나누고 커뮤니케이션 채널을 유지한 경험'],['security','보안 우선순위','위험도를 근거로 수정 범위와 회귀를 합의한 경험'],
  ['mentoring','지식 공유','문서·리뷰·페어링으로 팀의 재현성을 높인 경험'],['feedback','피드백 수용','반대 의견을 검증 가능한 개선으로 바꾼 경험'],
  ['ownership','소유권 경계','본인 결정과 팀 성과를 구분하며 끝까지 확인한 경험'],['motivation','지원 동기','과거 경험과 지원 역할의 문제를 연결한 구체적 동기']
];
const behaviorLenses=[
  ['star','STAR 구조로 답해 주세요.'],['decision','가장 어려운 판단과 기준은 무엇이었습니까?'],['stakeholder','이해관계자와 어떻게 합의했습니까?'],
  ['failure-mode','잘못된 선택의 가능성을 어떻게 줄였습니까?'],['outcome','결과를 어떤 지표로 확인했습니까?'],['retrospective','다시 한다면 무엇을 바꾸겠습니까?']
];
for(const [topicId,title,context] of behaviorTopics){
  for(const [lensId,prompt] of behaviorLenses){
    const q=baseQuestion(`behavior-${topicId}-${lensId}`,'shared','behavior',`${title}: ${prompt}`,`행동의 구체성, 판단, 협업, 결과, 회고를 확인`,[`${context}을 상황과 목표로 짧게 설명합니다.`,`본인이 한 판단과 행동, 타인과의 합의를 구분합니다.`,`정량·정성 결과와 재발 방지 또는 학습을 말합니다.`],['candidate-source-career-20260701'],{provenanceLevel:'practice-inference',tags:['behavior',topicId,lensId]});
    q.followUps=[`당시 반대 의견은 무엇이었습니까?`,`본인이 직접 바꾼 행동은 무엇입니까?`,`결과가 나빴다면 무엇을 먼저 되돌렸겠습니까?`];
    q.followUpGuides=[`상대의 우려를 공정하게 요약합니다.`,`팀 활동과 개인 행동을 분리합니다.`,`rollback 또는 범위 축소 기준을 말합니다.`];
    questions.push(q);
  }
}

const companyFocus={
  'linepay-server-engineer':['멱등 승인·취소','원장·정산·대사','대규모 트래픽과 cache','MSA 장애 격리','테스트와 코드리뷰'],
  'linepay-ai-data-platform-engineer':['batch·streaming 경계','data quality·governance','Kafka·Redis 파이프라인','model serving API','RAG·Agent 근거와 권한'],
  'kakaomobility-logistics-agent-backend':['dispatch 상태 모델','ETA와 위치 이벤트','라스트마일 공통 플랫폼','운영 admin과 관측성','성능 최적화와 fail fast'],
  'jyp-software-engineer-backend':['글로벌 팬 트래픽','콘텐츠·내부 업무 API','타임존과 일정','cloud 운영과 모니터링','DX·AX 프로세스 개선'],
  'nhnkcp-java-backend':['PG/VAN 승인·취소','결제 정산·대사','Oracle·MySQL 성능','고가용성과 장애 복구','Java REST 레거시 개선'],
  'kakaopaysec-backend-needs-confirmation':['금융 데이터 정합성','주문·체결 상태 추론의 경계','감사·보안','대량 이벤트 처리','레거시 운영 개선'],
  'coupang-backend-needs-confirmation':['shipment 상태','고처리량 event-driven','global operation','failure isolation','설계 영향력과 리딩 경계'],
  'kakaostyle-display-backend-needs-confirmation':['상품·전시 조회','cache·검색 연계','실험과 사용자 경험','강등과 장애 격리','왜에서 시작하는 문제 해결'],
  'cjoliveyoung-ad-dsp-backend-needs-confirmation':['입찰·노출 추론','budget pacing','impression·click 로그','과금·정산','비동기 데이터 파이프라인'],
  'cjoliveyoung-common-platform-backend-needs-confirmation':['공통 모듈과 API Gateway','표준 오류·추적','레거시 전환','개발자 포털·자동화','LLM 보조 검증과 보안']
};
const companySystemFocus={
  'linepay-server-engineer':['payment-ledger','batch-settlement','event-outbox'],
  'linepay-ai-data-platform-engineer':['event-outbox','rag-agent','observability'],
  'kakaomobility-logistics-agent-backend':['shipment-state','event-outbox','observability'],
  'jyp-software-engineer-backend':['cache-degradation','api-gateway','observability'],
  'nhnkcp-java-backend':['payment-ledger','batch-settlement','migration-cutover'],
  'kakaopaysec-backend-needs-confirmation':['payment-ledger','event-outbox','observability'],
  'coupang-backend-needs-confirmation':['shipment-state','event-outbox','observability'],
  'kakaostyle-display-backend-needs-confirmation':['cache-degradation','api-gateway','observability'],
  'cjoliveyoung-ad-dsp-backend-needs-confirmation':['ad-budget','event-outbox','observability'],
  'cjoliveyoung-common-platform-backend-needs-confirmation':['api-gateway','migration-cutover','rag-agent']
};
const companyLenses=[
  ['concept','핵심 불변식과 데이터 계약을 설명해 주세요.'],['scenario','트래픽이 10배 늘어난 상황을 설계해 주세요.'],['incident','부분 장애를 진단하고 복구해 주세요.'],['tradeoff','두 대안의 trade-off와 선택 기준을 말해 주세요.'],['candidate','본인 경험과 없는 경험을 구분해 연결해 주세요.']
];
for(const job of jobs){
  const focus=companyFocus[job.id];
  for(const topic of focus){
    for(const [lensId,prompt] of companyLenses){
      const topicId=slug(topic);
      const q=baseQuestion(`company-${job.id}-${topicId}-${lensId}`,'company','company-role',`${job.company} ${job.role} 예상 질문 — ${topic}: ${prompt}`,`공식 공고와 공개 채용 자료에서 추론한 역할 적합성·설계·운영 판단을 확인`,[`공식 공고에서 확인된 역할 범위와 확인되지 않은 내부 구조를 구분합니다.`,`${topic}의 요구사항, 상태, 실패 조건, 관측 지표를 설명합니다.`,`후보자 근거가 있으면 범위를 정확히 연결하고 없는 도메인 경험은 학습·전이 계획으로 답합니다.`],job.sourceRefs,{companies:[job.company],roles:[job.role],stages:job.process.length?job.process:['first-technical'],evidenceFactIds:job.candidateEvidenceMap.flatMap(item=>item.factIds).slice(0,2),forbiddenClaimIds:job.riskGaps.map((_,index)=>`job-risk-${job.id}-${index+1}`),provenanceLevel:job.id.includes('needs-confirmation')?'practice-inference':'official-jd-derived',tags:['company-role',job.id,topicId,lensId]});
      q.followUps=[`${topic}에서 가장 중요한 SLI와 오류 예산은 무엇입니까?`,`공식 공고에 없는 내부 구조를 어떻게 가정하고 검증하겠습니까?`,`입사 후 30일 안에 도메인 격차를 어떻게 줄이겠습니까?`];
      q.followUpGuides=[`사용자 영향과 시스템 지표를 함께 말합니다.`,`가정을 명시하고 면접관에게 확인 질문을 합니다.`,`문서·코드·운영 지표를 순서대로 학습합니다.`];
      questions.push(q);
    }
  }
}

const challengePlans={
  'java-algorithm':{count:40,topics:['중복 요청 제거','기간별 집계','최단 처리 경로','우선순위 작업','로그 구간 병합','상위 K 오류','재시도 일정','문자열 정규화'],source:'java-language-spec'},
  'data-structure':{count:20,topics:['LRU cache','시간순 이벤트','중복 없는 순서','범위 조회','우선순위 큐'],source:'java-language-spec'},
  'java-concurrency':{count:15,topics:['bounded executor','동시 집계','취소 전파','lock 순서','CompletableFuture timeout'],source:'java-language-spec'},
  sql:{count:40,topics:['일별 결제 대사','중복 승인 탐지','배치 실행시간','배송 상태 전이','광고 클릭률','미정산 거래','기관별 오차','재처리 대상'],source:'postgresql-current-docs'},
  'data-modeling':{count:20,topics:['결제 원장','정산 상태','배송 이벤트','광고 노출','배치 실행'],source:'postgresql-current-docs'},
  'debug-code-review':{count:20,topics:['N+1','누락된 timeout','중복 retry','잘못된 transaction 경계','민감정보 로그'],source:'spring-framework-reference'},
  'live-coding':{count:15,topics:['rate limiter','idempotency registry','CSV validator','retry policy','settlement comparator'],source:'java-language-spec'},
  refactoring:{count:15,topics:['거대 service 분리','조건문 정책화','시간 의존성 제거','외부 연계 adapter','오류 모델 표준화'],source:'spring-framework-reference'}
};
const challenges=[];
for(const [category,plan] of Object.entries(challengePlans)){
  for(let index=0;index<plan.count;index++){
    const topic=plan.topics[index%plan.topics.length];
    const variant=Math.floor(index/plan.topics.length)+1;
    challenges.push({
      id:`coding-${category}-${String(index+1).padStart(3,'0')}`,schemaVersion:1,category,topic,difficulty:variant===1?'medium':'deep',timeLimitMinutes:15+variant*5,
      prompt:`${topic} 문제를 합성 데이터로 구현합니다. 변형 ${variant}: 정상 경로뿐 아니라 중복·빈 입력·경계 시간을 처리하고 선택한 자료구조 또는 SQL 계획을 설명하세요.`,
      input:`합성 ${topic} 레코드 목록. 각 레코드는 식별자, 상태, 시각, 수치를 포함합니다.`,output:`결정적 순서의 결과와 검증 가능한 오류 목록.`,
      edgeCases:['빈 입력','같은 식별자의 중복','경계 시각','부분적으로 잘못된 레코드'],
      solutionOutline:[`입력 계약과 불변식을 먼저 정의합니다.`,`${topic}에 필요한 조회·갱신 복잡도를 기준으로 자료구조 또는 인덱스를 고릅니다.`,`정상·중복·경계·실패 케이스를 표 기반 테스트로 검증합니다.`],
      complexity:`입력 n에 대해 목표 시간복잡도 O(n log n) 이하, 추가 공간 O(n) 이하를 설명합니다.`,alternatives:['정렬 후 단일 순회','해시 인덱스와 우선순위 구조','데이터베이스 집합 연산'],
      followUps:[`메모리 제한이 절반이면 어떻게 바꾸겠습니까?`,`동시 요청에서 결정성을 어떻게 보장합니까?`,`운영 지표와 실패 로그에는 무엇을 남깁니까?`],
      sourceRefs:[plan.source],provenanceLevel:'technical-official-source',reviewStatus:'reviewed',reviewedAt:'2026-08-26'
    });
  }
}

const codingQuestions=challenges.map(challenge=>{
  const q=baseQuestion(challenge.id,'shared',challenge.category,challenge.prompt,`${challenge.category} 문제 해결 과정과 검증 능력을 확인`,challenge.solutionOutline,challenge.sourceRefs,{difficulty:challenge.difficulty,provenanceLevel:'technical-official-source',tags:[challenge.category,slug(challenge.topic)],timeLimitSeconds:challenge.timeLimitMinutes*60});
  q.followUps=challenge.followUps;q.followUpGuides=challenge.followUps.map(()=>`가정, 복잡도, 실패 조건, 테스트를 포함합니다.`);q.deepDive=`입력: ${challenge.input} 출력: ${challenge.output} Edge: ${challenge.edgeCases.join(', ')} 복잡도: ${challenge.complexity}`;
  return q;
});
questions.push(...codingQuestions);

const legacyQuestionIds=[
  'quality-db-btree-descent','quality-db-btree-fanout','quality-db-btree-range-scan','quality-java-collections-arraylist-vs-linkedlist',
  'quality-java-collections-arraylist-access','quality-java-collections-linkedlist-middle-access','quality-java-collections-linkedlist-ends','quality-java-servlet-container-boundary',
  'quality-java-servlet-container-lifecycle','quality-java-servlet-container-concurrency','quality-web-storage-boundary','quality-web-storage-cookie-difference',
  'quality-web-storage-xss-risk','quality-java-collections-arraylist-insert','quality-db-btree-write-cost'
];
const playlists={schemaVersion:1,generatedAt:'2026-08-26',jobs:{}};
for(const job of jobs){
  const companyIds=questions.filter(q=>q.companies.includes(job.company)&&q.roles.includes(job.role)).map(q=>q.id);
  const systemFocus=companySystemFocus[job.id]||['observability'];
  const prioritizedSystemIds=systemFocus.flatMap(topic=>questions.filter(q=>q.scope==='shared'&&q.category==='system-design'&&q.tags.includes(topic)).map(q=>q.id));
  const remainingSharedIds=questions.filter(q=>q.scope==='shared'&&q.reviewStatus==='reviewed'&&!prioritizedSystemIds.includes(q.id)).map(q=>q.id);
  playlists.jobs[job.id]={jobId:job.id,systemFocus,legacyReviewedQuestionIds:legacyQuestionIds,questionIds:unique([...companyIds,...legacyQuestionIds,...prioritizedSystemIds,...remainingSharedIds]).slice(0,50)};
}

const reviewManifest={schemaVersion:1,reviewedAt:'2026-08-26',reviewerContract:'content-quality-and-claim-boundary-review',questionIds:questions.map(q=>q.id),codingChallengeIds:challenges.map(q=>q.id)};
const bundle={schemaVersion:1,generatedAt:'2026-08-26',facts:facts.facts,jobs,questions,playlists,sources:sourceManifest.sources};
await mkdir(outputRoot,{recursive:true});
await mkdir(runtimeRoot,{recursive:true});
await Promise.all([
  writeFile(resolve(outputRoot,'interview-question-bank.json'),`${JSON.stringify({schemaVersion:1,questions},null,2)}\n`),
  writeFile(resolve(outputRoot,'coding-challenges.json'),`${JSON.stringify({schemaVersion:1,challenges},null,2)}\n`),
  writeFile(resolve(outputRoot,'interview-playlists.json'),`${JSON.stringify(playlists,null,2)}\n`),
  writeFile(resolve(dataRoot,'interview-review-manifest.json'),`${JSON.stringify(reviewManifest,null,2)}\n`),
  writeFile(resolve(runtimeRoot,'interview-data.js'),`window.INTERVIEW_LAB_DATA=${JSON.stringify(bundle)};\n`)
]);

const counts={candidate:questions.filter(q=>q.scope==='candidate').length,company:questions.filter(q=>q.scope==='company').length,systemScenario:questions.filter(q=>q.id.startsWith('system-')).length,behavior:questions.filter(q=>q.id.startsWith('behavior-')).length,coding:challenges.length,total:questions.length,followUps:questions.reduce((sum,q)=>sum+q.followUps.length,0)};
console.log(JSON.stringify({counts,jobs:jobs.length,playlists:Object.keys(playlists.jobs).length},null,2));
