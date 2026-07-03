(function buildBackendAtlasContent(){
  const chapters = {
    'OS & Network': {
      title:'실행과 통신의 원리', summary:'프로세스에서 네트워크까지, 코드가 실행되고 요청이 전달되는 전체 경로를 이해합니다.',
      flow:['Process','Thread','Context Switching','CPU Cache','Deadlock','Lock','CAS','Virtual Thread','TCP','HTTP'],
      definition:'운영체제는 제한된 CPU·메모리·I/O를 격리하고 스케줄링하며, 네트워크는 서로 다른 실행 환경 사이에 신뢰 가능한 통신 경계를 만듭니다.',
      need:'애플리케이션 지연은 코드 한 줄보다 스케줄링, 락 경합, 페이지 폴트, 재전송, 커넥션 고갈에서 자주 발생합니다. 실행 경로를 알아야 증상이 아닌 원인을 고칠 수 있습니다.',
      internals:'프로세스의 가상 주소 공간 안에서 스레드가 실행되고, 스케줄러가 실행 문맥을 교체합니다. 공유 상태는 메모리 가시성과 원자성을 요구하며, 요청은 소켓·TCP 혼잡 제어·HTTP 계층을 통과합니다.',
      advantages:'격리, 동시성, 자원 공정성, 표준화된 통신을 얻습니다.', disadvantages:'문맥 전환, 동기화, 커널 진입, 네트워크 지연과 부분 실패 비용이 생깁니다.',
      tradeoff:'스레드를 늘리면 처리량이 늘 수 있지만 경합과 메모리 비용도 증가합니다. 비동기는 자원 효율을 높이지만 흐름과 오류 처리가 복잡해집니다.',
      practice:'Java API의 p95가 급증하면 CPU 사용률만 보지 말고 runnable thread, lock wait, GC pause, connection pool, TCP retransmission을 같은 시간축에서 확인합니다.',
      incident:'커넥션 풀 30개인 서비스에서 외부 API가 5초 지연되어 모든 요청 스레드가 대기했습니다. timeout·bulkhead·pool 대기 시간을 분리해 연쇄 장애를 차단합니다.',
      answer:'“프로세스는 격리의 단위, 스레드는 실행의 단위입니다. 동시성을 높일 때는 처리량뿐 아니라 경합·문맥 전환·메모리 가시성을 함께 측정하고, I/O 중심이면 Virtual Thread를 검토합니다.”',
      mistakes:['스레드 수를 무조건 늘린다','timeout을 한 값으로 통일한다','평균 지연만 보고 tail latency를 놓친다'], links:['JVM','Connection Pool','Backpressure','OpenTelemetry']
    },
    'Database': {
      title:'정합성과 성능의 경계', summary:'SQL 한 문장을 저장 구조, 트랜잭션, 인덱스, 락과 복구 관점으로 설명합니다.',
      flow:['Data Model','B-Tree Index','Query Planner','Transaction','MVCC','Lock','WAL','Replication','Partitioning','pgvector'],
      definition:'데이터베이스는 데이터를 영속화하고 동시 요청 사이의 정합성, 검색 성능, 장애 복구를 계약으로 제공합니다.',
      need:'서비스의 진짜 상태는 DB에 남습니다. 잘못된 트랜잭션 경계나 인덱스는 데이터 오류와 전체 시스템 병목으로 이어집니다.',
      internals:'PostgreSQL은 페이지와 WAL에 변경을 기록하고 MVCC snapshot으로 읽기 일관성을 제공합니다. Planner는 통계와 비용 모델로 scan·join 방식을 선택합니다.',
      advantages:'강한 정합성, 선언적 질의, 복구 가능성, 성숙한 도구를 얻습니다.', disadvantages:'락 경합, write amplification, schema 변경 비용, 수평 확장의 복잡성이 있습니다.',
      tradeoff:'인덱스는 읽기를 빠르게 하지만 쓰기·저장 비용을 늘립니다. 격리 수준은 이상 현상을 줄이지만 동시성을 낮춥니다.',
      practice:'느린 쿼리는 EXPLAIN ANALYZE, 실제/예상 row 차이, buffer hit, lock wait 순으로 보고 bounded query와 복합 인덱스를 검증합니다.',
      incident:'통계가 오래되어 Planner가 nested loop를 선택했고 배치가 API DB pool을 고갈시켰습니다. 통계 갱신, workload 분리, statement timeout으로 복구합니다.',
      answer:'“인덱스는 조건절만 보고 만들지 않습니다. 선택도, 정렬, 조인, write 비율을 함께 보고 실행 계획과 실제 buffer 사용량으로 효과를 검증합니다.”',
      mistakes:['N+1을 데이터가 적을 때 놓친다','긴 외부 호출을 트랜잭션 안에서 수행한다','offset pagination을 무제한 사용한다'], links:['JPA','Redis','Batch','RAG Retrieval']
    },
    'Java & Spring': {
      title:'런타임에서 운영까지', summary:'JVM, Spring 프록시, 트랜잭션과 AI 통합을 하나의 요청 생명주기로 연결합니다.',
      flow:['Bytecode','JIT','Heap','GC','Spring IoC','AOP Proxy','Transaction','JPA','Resilience','Spring AI'],
      definition:'Java는 관리형 런타임을, Spring은 객체 생명주기와 인프라 관심사의 일관된 조립 방식을 제공합니다.',
      need:'비즈니스 로직과 트랜잭션·보안·관측성을 분리하면서도 운영 시 실제 호출 경로를 예측할 수 있어야 합니다.',
      internals:'바이트코드는 JVM에서 해석·JIT 컴파일되고 객체는 GC가 관리합니다. Spring은 Bean graph와 proxy를 구성해 호출 경계에 AOP 기능을 적용합니다.',
      advantages:'생산성, 생태계, 테스트 가능성, 표준 운영 패턴이 강합니다.', disadvantages:'추상화가 실제 비용과 호출 경계를 숨기며 잘못된 자동 설정은 진단을 어렵게 합니다.',
      tradeoff:'JPA는 생산성을 높이지만 SQL 통제력이 낮아질 수 있습니다. WebFlux는 적합한 I/O workload에서 효율적이지만 blocking 혼용 비용이 큽니다.',
      practice:'Controller→Service→Repository 호출에서 timeout budget, transaction boundary, SQL 수, trace context가 어떻게 이어지는지 확인합니다.',
      incident:'@Transactional self-invocation으로 트랜잭션이 적용되지 않아 부분 저장이 발생했습니다. 책임을 별도 Bean으로 분리하고 통합 테스트로 경계를 검증합니다.',
      answer:'“Spring 추상화를 쓰되 프록시 경계와 실제 SQL을 확인합니다. 트랜잭션은 업무 원자성 단위로 짧게 유지하고 외부 I/O는 분리합니다.”',
      mistakes:['어노테이션만 붙이면 동작한다고 가정한다','Entity를 API DTO로 노출한다','재시도와 트랜잭션 순서를 검증하지 않는다'], links:['PostgreSQL','Kafka','OpenTelemetry','AI Agent']
    },
    'Web & React': {
      title:'사용자 경험의 실행 경로', summary:'브라우저 렌더링, 상태, 네트워크, 접근성과 모바일 경험을 함께 설계합니다.',
      flow:['URL','HTTP Cache','HTML','DOM','JavaScript Event Loop','React State','Render','Accessibility','PWA','WebView'],
      definition:'웹은 문서·상태·네트워크를 브라우저 런타임에서 결합해 다양한 장치에 동일한 서비스 계약을 전달합니다.',
      need:'기능이 맞아도 느리거나 접근할 수 없거나 상태가 소실되면 제품은 실패합니다.',
      internals:'브라우저는 resource를 가져와 DOM/CSSOM을 만들고 event loop에서 작업을 실행합니다. React는 상태 변화로 다음 UI tree를 계산하고 필요한 DOM만 반영합니다.',
      advantages:'배포 용이성, 플랫폼 독립성, 빠른 피드백이 장점입니다.', disadvantages:'장치·브라우저 편차, main thread 병목, 복잡한 상태 동기화가 단점입니다.',
      tradeoff:'CSR은 상호작용에 유리하지만 초기 로딩·SEO 비용이 있고, 캐시는 빠르지만 stale data 전략이 필요합니다.',
      practice:'Core Web Vitals, API timing, JS error, 사용자 행동을 동일 release와 연결해 성능을 측정합니다.',
      incident:'5,000문제를 한 번에 DOM에 렌더링해 저가형 모바일에서 멈췄습니다. 검색 index는 메모리에 유지하되 결과 DOM은 제한하고 점진 렌더링합니다.',
      answer:'“상태의 소유자와 서버 상태/클라이언트 상태를 먼저 구분합니다. 렌더 횟수보다 사용자 지연과 데이터 일관성을 기준으로 최적화합니다.”',
      mistakes:['모든 상태를 전역화한다','접근성을 마지막에 추가한다','모바일에서 hover 동작에 의존한다'], links:['HTTP','API Contract','Service Worker','Capacitor']
    },
    'DevOps': {
      title:'변경을 안전하게 운영하는 법', summary:'컨테이너부터 SLO와 관측성까지 배포·장애·복구를 하나의 운영 루프로 학습합니다.',
      flow:['Build','Image','Container','Kubernetes','Deployment','Service','SLO','Metrics','Logs','Traces','Rollback'],
      definition:'DevOps는 개발과 운영을 도구가 아니라 빠르고 안전한 변경 피드백 루프로 통합하는 방식입니다.',
      need:'코드는 배포된 뒤에 가치가 생기며, 모든 변경은 실패 가능하므로 관측·완화·복구가 설계에 포함되어야 합니다.',
      internals:'CI가 재현 가능한 artifact를 만들고 orchestrator가 desired state를 유지합니다. telemetry가 실제 상태를 보여주고 SLO가 대응 우선순위를 정합니다.',
      advantages:'반복 가능한 배포, 빠른 복구, 환경 일관성을 얻습니다.', disadvantages:'플랫폼 복잡성, 비용, 잘못된 자동화의 큰 blast radius가 생깁니다.',
      tradeoff:'자동화는 속도를 높이지만 guardrail이 없으면 실패도 자동화합니다. 높은 가용성은 중복 자원과 운영 복잡성을 요구합니다.',
      practice:'배포 전후 error rate·latency·saturation을 비교하고 canary 중단 기준과 자동 rollback 조건을 명시합니다.',
      incident:'readiness probe가 실제 DB 의존성을 확인하지 않아 트래픽이 준비되지 않은 Pod로 전달됐습니다. startup/readiness/liveness 책임을 분리합니다.',
      answer:'“배포 성공은 프로세스 시작이 아니라 SLO 유지로 판정합니다. 변경 단위를 작게 하고 telemetry와 rollback을 배포 계약에 포함합니다.”',
      mistakes:['latest 태그를 운영에 쓴다','로그만 있고 correlation id가 없다','CPU 사용률 하나로 autoscaling한다'], links:['Docker','Kubernetes','Prometheus','OpenTelemetry']
    },
    'AI & Design': {
      title:'신뢰 가능한 AX 시스템 설계', summary:'RAG, MCP, Agent를 정확도·보안·비용·관측성의 균형으로 설계합니다.',
      flow:['User Intent','Prompt','Embedding','Vector DB','Retrieval','Reranking','LLM','Tool Calling','MCP','Agent Workflow','Evaluation'],
      definition:'AX 시스템은 모델을 단독 사용하지 않고 기업 데이터, 도구, 정책, 평가 체계와 결합해 검증 가능한 업무 결과를 만듭니다.',
      need:'LLM은 확률적이며 최신 사내 상태와 실행 권한을 자체적으로 알지 못합니다. 근거·경계·승인·평가가 있어야 운영할 수 있습니다.',
      internals:'질의를 embedding해 후보를 검색하고 reranker가 정밀도를 높입니다. Agent는 상태와 정책에 따라 도구를 호출하며 MCP는 capability 계약을 표준화합니다.',
      advantages:'자연어 인터페이스, 비정형 지식 활용, 복합 업무 자동화가 가능합니다.', disadvantages:'환각, 비결정성, prompt injection, 비용·지연, 평가 난도가 있습니다.',
      tradeoff:'큰 context는 recall을 높일 수 있지만 비용과 distraction이 늘어납니다. Agent 자율성은 생산성을 높이지만 권한 위험도 키웁니다.',
      practice:'retrieval recall, answer faithfulness, tool success, token cost, end-to-end latency를 분리 측정하고 실패 단계별 fallback을 둡니다.',
      incident:'문서 속 prompt injection이 Agent에게 외부 전송 도구를 호출하게 했습니다. retrieved content를 비신뢰 입력으로 격리하고 allowlist·승인·감사 로그를 적용합니다.',
      answer:'“RAG 품질은 모델만 교체하지 않습니다. query→retrieval→reranking→generation을 분리 평가하고, 근거 인용과 실패 시 답변 거부를 제품 계약으로 둡니다.”',
      mistakes:['LLM 평가를 체감으로 판단한다','검색 결과를 신뢰 명령으로 취급한다','도구 호출을 모델 판단에만 맡긴다'], links:['Spring AI','LangGraph','OpenAI SDK','A2A']
    },
    'AX Scenario': {
      title:'장애를 설계 문제로 전환하기', summary:'복합 장애에서 증거를 모으고 원인을 격리한 뒤 안전하게 복구하는 판단 훈련입니다.',
      flow:['Signal','Triage','Timeline','Hypothesis','Evidence','Mitigation','Verification','Root Cause','Action Item','Learning'],
      definition:'실무 시나리오는 하나의 정답보다 불완전한 정보에서 안전한 다음 행동을 선택하는 훈련입니다.',
      need:'운영 장애는 DB·네트워크·애플리케이션·AI 모델 경계를 넘습니다. 우선순위와 검증 기준이 없으면 성급한 조치가 피해를 키웁니다.',
      internals:'영향도를 먼저 확인하고 변경·지표·로그·trace를 시간축으로 정렬합니다. 가설마다 반증 가능한 증거를 정하고 완화와 근본 해결을 분리합니다.',
      advantages:'의사결정 속도, 재현성, 팀 커뮤니케이션이 향상됩니다.', disadvantages:'훈련 없이 문서만 만들면 의례가 되며 과도한 절차는 초기 완화를 늦춥니다.',
      tradeoff:'빠른 rollback은 피해를 줄이지만 데이터 migration과 호환되지 않을 수 있습니다. 상세 관측은 진단을 돕지만 비용과 개인정보 위험이 있습니다.',
      practice:'“무엇이 언제부터 누구에게 얼마나 영향인가”를 먼저 답하고, reversible action부터 실행하며 각 조치의 성공 지표를 기록합니다.',
      incident:'RAG latency 12초의 원인이 LLM으로 보였지만 trace에서 vector query 8초와 pool wait가 확인됐습니다. HNSW tuning 전에 unbounded metadata filter와 connection pool을 수정합니다.',
      answer:'“먼저 영향도와 최근 변경을 확인하고 Golden Signals로 병목 계층을 좁힙니다. 가역적 완화 후 trace와 실행 계획으로 원인을 검증하고 재발 방지 지표를 추가합니다.”',
      mistakes:['원인 확인 전에 재시작한다','완화와 근본 해결을 혼동한다','사후 조치에 담당자와 기한이 없다'], links:['Incident Command','SLO','Runbook','Audit Log']
    }
  };

  const graph = {
    'MCP':['Capability Discovery','Tool Calling','JSON-RPC','Permission','Sampling','Agent','RAG','Spring AI','LangGraph','A2A','OpenAI SDK'],
    'Process':['Thread','Context Switching','CPU Cache','Deadlock','Lock','CAS','Virtual Thread'],
    'RAG':['Embedding','Chunking','Vector DB','Hybrid Search','Reranking','Evaluation','Prompt Injection','Agent'],
    'PostgreSQL':['Index','Query Planner','MVCC','Lock','WAL','Replication','Partitioning','pgvector'],
    'Kafka':['Partition','Consumer Group','Offset','Idempotency','Exactly Once','Schema Registry','Backpressure'],
    'Kubernetes':['Pod','Deployment','Service','Ingress','Probe','HPA','PDB','Observability'],
    'Spring AI':['ChatModel','EmbeddingModel','VectorStore','Advisor','Tool Calling','MCP','RAG','Evaluation'],
    'AI Agent':['Planning','Tool Calling','State','Memory','Permission','Human Approval','Multi Agent','Evaluation']
  };

  const companies=['Naver','Kakao','Toss','Coupang','Google','OpenAI','Hyundai Motor','Danggeun','LINE'];
  const interviewFrames=[
    ['핵심 개념을 1분 안에 설명해보세요.','정의보다 해결하는 문제와 경계를 먼저 말합니다.'],
    ['이 기술을 선택한 이유와 대안은 무엇인가요?','요구사항, 대안, trade-off, 측정 결과 순서로 답합니다.'],
    ['내부에서는 어떤 순서로 동작하나요?','입력부터 출력까지 상태 변화와 실패 지점을 설명합니다.'],
    ['운영 장애가 나면 무엇부터 확인하나요?','영향도, 최근 변경, Golden Signals, 가설 검증 순서로 답합니다.'],
    ['성능 병목을 어떻게 증명하나요?','프로파일·실행 계획·trace로 계층을 좁히고 전후 수치를 제시합니다.'],
    ['확장 시 첫 번째 한계는 무엇인가요?','CPU·메모리·I/O·락·외부 quota 중 실제 경계를 찾습니다.'],
    ['일관성과 가용성을 어떻게 선택하나요?','업무 불변식과 허용 가능한 stale 범위를 기준으로 답합니다.'],
    ['재시도는 어디에 두어야 하나요?','멱등성, timeout budget, backoff, 중복 부작용을 함께 설명합니다.'],
    ['보안 위협과 방어 경계는 무엇인가요?','신뢰 경계, 최소 권한, 입력 검증, 감사 로그를 답합니다.'],
    ['테스트 전략은 어떻게 구성하나요?','단위·계약·통합·장애 주입의 책임을 나눕니다.'],
    ['관측 가능성을 어떻게 설계하나요?','metric·log·trace를 correlation id와 SLO로 연결합니다.'],
    ['실패 시 degraded mode는 무엇인가요?','핵심 기능을 보존하는 fallback과 복구 조건을 말합니다.'],
    ['데이터가 늘면 무엇이 달라지나요?','알고리즘 복잡도, index, partition, retention을 설명합니다.'],
    ['비용을 어떻게 통제하나요?','단위 요청 비용, cache, quota, workload tier를 말합니다.'],
    ['동시 요청의 정합성을 어떻게 보장하나요?','원자성 경계, lock/CAS, idempotency를 구분합니다.'],
    ['배포와 rollback 전략은 무엇인가요?','호환 가능한 변경, canary, 중단 기준을 말합니다.'],
    ['팀에 이 설계를 어떻게 설명하나요?','context·decision·consequence가 담긴 ADR로 남깁니다.'],
    ['가장 흔한 오해는 무엇인가요?','추상화가 숨긴 비용과 적용되지 않는 조건을 설명합니다.'],
    ['직접 개선한 수치를 말해보세요.','baseline, 변경, 결과, 부작용을 수치로 답합니다.'],
    ['다시 설계한다면 무엇을 바꾸겠나요?','현재 제약에서 얻은 학습과 다음 검증 가설을 말합니다.']
  ];

  Object.entries(chapters).forEach(([category,c])=>{
    c.interviews=interviewFrames.map((frame,i)=>({
      question:`${c.flow[i%c.flow.length]} 관점에서 ${frame[0]}`,
      goodAnswer:frame[1], modelAnswer:`${c.answer} ${frame[1]}`,
      practical:c.practice, followUp:`${c.links[i%c.links.length]}와 연결하면 설계가 어떻게 달라지나요?`,
      tailQuestion:`실패 기준과 검증 metric을 구체적으로 말해보세요.`, tip:'결론 → 근거 → trade-off → 실제 수치 순서로 60~90초 안에 답하세요.'
    }));
  });

  const allGraph={...graph};
  Object.values(chapters).forEach(c=>c.flow.forEach((topic,i)=>{
    allGraph[topic]=[...(allGraph[topic]||[]),c.flow[i-1],c.flow[i+1],...c.links].filter(Boolean);
  }));
  Object.keys(allGraph).forEach(k=>allGraph[k]=[...new Set(allGraph[k])]);

  window.QUESTION_BANK=window.QUESTION_BANK.map((q,i)=>{
    const chapter=chapters[q.category]||chapters['AX Scenario'];
    const topic=q.relatedTopics?.[0]||q.tags?.[0]||chapter.flow[i%chapter.flow.length];
    const company=companies[i%companies.length];
    return {...q,
      metadata:{...(q.metadata||{}),interviewFrequency:i%5===0?'very-high':i%3===0?'high':'medium',importance:i%4===0?'critical':'core',company,techStack:[q.category,...chapter.links].slice(0,4),practicalUsage:i%3===0?'daily':'frequent'},
      relatedTopics:[...new Set([...(q.relatedTopics||[]),...(allGraph[topic]||[]).slice(0,5)])],
      prerequisites:[chapter.flow[Math.max(0,chapter.flow.indexOf(topic)-1)]||chapter.flow[0]],
      nextTopics:[chapter.flow[Math.min(chapter.flow.length-1,chapter.flow.indexOf(topic)+1)]||chapter.flow[1]],
      whyDetails:{origin:chapter.need,better:chapter.tradeoff,when:chapter.practice,avoid:chapter.disadvantages,practice:chapter.incident,interview:chapter.answer}
    };
  });
  window.ATLAS_CHAPTERS=chapters;
  window.ATLAS_GRAPH=allGraph;
  window.ATLAS_COMPANIES=companies;
})();
