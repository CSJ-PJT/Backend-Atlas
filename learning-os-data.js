(function buildLearningOsData(){
  const targets={'OS & Network':500,'Database':700,'Java & Spring':800,'Web & React':400,'DevOps':700,'AI & Design':1200,'AX Scenario':700};
  const topicMap={
    'OS & Network':['Process','Thread','Virtual Memory','TCP','HTTP','DNS','Load Balancing','Backpressure','TLS','Connection Pool'],
    'Database':['PostgreSQL','Index','Transaction','MVCC','JPA','Redis','Cache Aside','Batch','Replication','Partitioning','pgvector'],
    'Java & Spring':['JVM','Spring Boot','Spring Transaction','Spring AI','JPA','WebFlux','TaskExecutor','Resilience4j','Batch','API Contract'],
    'Web & React':['React','State','PWA','WebView','CORS','Accessibility','Mobile UX','Cache','Service Worker','Security'],
    'DevOps':['Docker','Kubernetes','OpenTelemetry','Prometheus','Grafana','CI/CD','SLO','Circuit Breaker','Blue Green','Disaster Recovery'],
    'AI & Design':['RAG','Embedding','Vector DB','Reranking','Prompt Injection','MCP','AI Agent','Multi Agent','Function Calling','Spring AI','LangGraph','LLM Evaluation'],
    'AX Scenario':['장애 대응','RAG Latency','Agent Safety','Batch Recovery','DB Performance','LLM Outage','Observability','Approval Workflow','Cost Control','Security Incident']
  };
  const constraints=['트래픽 급증','부분 장애','비용 제한','무중단 배포','다중 tenant','개인정보 처리','대용량 데이터','중복 요청','지역 간 지연','야간 무인 운영','감사 대응','모델 교체','인덱스 전환','DB 부하','외부 API timeout','cache miss 증가','운영 승인 필요','모바일 네트워크','재처리 상황','SLO 위반'];
  const original=[...window.QUESTION_BANK];
  const additions=[];
  Object.entries(targets).forEach(([category,target])=>{
    const sources=original.filter(item=>item.category===category);
    const needed=target-sources.length;
    for(let i=0;i<needed;i++){
      const source=sources[i%sources.length];
      const topic=topicMap[category][i%topicMap[category].length];
      const constraint=constraints[Math.floor(i/topicMap[category].length)%constraints.length];
      const cycle=Math.floor(i/(topicMap[category].length*constraints.length))+1;
      const practical=category==='AX Scenario'||i%3!==0;
      additions.push({
        ...source,
        id:`los-${category.toLowerCase().replace(/[^a-z]+/g,'-')}-${String(i+1).padStart(4,'0')}`,
        q:`[${topic} · ${constraint} · Case ${cycle}] ${source.q}`,
        question:`[${topic} · ${constraint} · Case ${cycle}] ${source.q}`,
        level:i%7<2?'easy':i%7<5?'medium':'hard',difficulty:i%7<2?'easy':i%7<5?'medium':'hard',
        tags:[...new Set([...(source.tags||[]),topic,constraint,practical?'practical':'concept'])],
        metadata:{level:'ax-backend-engineer',topic:topic.toLowerCase(),skill:category,useCase:constraint,source:'learning-os-extension',case:cycle},
        relatedTopics:[...new Set([topic,...topicMap[category].filter(x=>x!==topic).slice(i%5,i%5+4)])],
        whyExplanation:`${source.explanation} 이 원칙은 ${constraint} 상황에서 ${topic} 경계의 실패가 전체 서비스로 전파되는 것을 막기 때문에 중요합니다. 실무에서는 변경 전후 지표, 실패 기준, rollback 조건을 함께 정의해야 합니다.`,
        followUpQuestions:[source.follow||'이 선택의 trade-off는 무엇인가?',`${topic} 적용 전후를 어떤 metric으로 검증할 것인가?`,`${constraint}에서 안전한 fallback은 무엇인가?`],
        interviewPoint:`정의보다 ${constraint} 상황의 진단 순서, 선택 근거, trade-off와 복구 방법을 1분 안에 설명합니다.`,
        practicalScenario:practical?`${constraint} 환경에서 ${topic} 관련 이상 징후가 발생한 운영 상황`:false,
        explanation:`${source.explanation} ${topic} 관점에서는 관측 → 원인 격리 → 안전한 완화 → 검증 → 재발 방지 순으로 답하는 것이 적절합니다.`,
        points:[...(source.points||[]),`${topic}의 운영 지표와 실패 경계 설명`,`${constraint}에서의 rollback과 degraded mode 제시`],
        follow:`${topic} 장애가 downstream에 전파되지 않도록 어떤 경계를 둘 것인가?`
      });
    }
  });
  const normalize=item=>{
    const question=item.question||item.q;
    const difficulty=item.difficulty||item.level||'medium';
    const tags=item.tags||[item.category,'core'];
    const related=item.relatedTopics||tags.filter(t=>typeof t==='string').slice(0,5);
    return {...item,q:question,question,level:difficulty,difficulty,tags,
      metadata:item.metadata||{level:'backend-interview',topic:String(tags[0]||'core').toLowerCase(),skill:item.category,useCase:item.practicalScenario?'operations':'fundamentals',source:'legacy-normalized'},
      relatedTopics:related,
      whyExplanation:item.whyExplanation||`${item.explanation} 이 개념은 장애를 예방하고 설계 선택의 근거를 설명하는 데 중요합니다.`,
      followUpQuestions:item.followUpQuestions||[item.follow||'이 개념의 trade-off는 무엇인가?'],
      interviewPoint:item.interviewPoint||`핵심 정의, 적용 사례, trade-off, 실패 대응 순서로 설명합니다.`,
      practicalScenario:item.practicalScenario??(item.category==='AX Scenario'?item.q:false)};
  };
  window.QUESTION_BANK=[...original,...additions].map(normalize);
  window.LEARNING_PATHS={
    RAG:{prerequisites:['HTTP','REST API','JSON','Spring Boot'],core:['Embedding','Vector DB','Similarity Search','Chunking'],advanced:['Reranking','Hybrid Search','MCP','AI Agent'],practical:['Spring AI','RAG Latency','LLM Evaluation','장애 대응']},
    Redis:{prerequisites:['Network','Data Structure','Database'],core:['Cache Aside','TTL','Eviction'],advanced:['분산락','Replication','Cluster'],practical:['Cache 장애','Hot Key','정합성','Spring Cache']},
    'Spring Transaction':{prerequisites:['ACID','JDBC','Proxy'],core:['Propagation','Isolation','Rollback'],advanced:['Outbox','분산 트랜잭션','Idempotency'],practical:['Service Layer','긴 트랜잭션','Lock','재시도']},
    MCP:{prerequisites:['JSON-RPC','Tool Calling','권한'],core:['Server','Client','Capability'],advanced:['Sampling','Resource','Prompt'],practical:['최소 권한','감사 로그','승인','Agent 연동']},
    'Vector DB':{prerequisites:['Vector','Embedding','Distance'],core:['ANN','Metadata Filter','Index'],advanced:['HNSW','IVFFlat','Hybrid Search'],practical:['pgvector','Milvus','Qdrant','Backup']},
    default:{prerequisites:['기본 CS','HTTP','데이터 구조'],core:['핵심 원리','API 계약','데이터 흐름'],advanced:['확장성','보안','관측성'],practical:['운영 지표','장애 대응','테스트','Rollback']}
  };
  window.INTERVIEW_BANK={
    RAG:[['RAG를 왜 사용했나요?',['최신 지식','근거','모델 재학습 비용']],['검색 품질을 어떻게 측정하나요?',['recall@k','MRR','faithfulness']],['RAG 장애 시 어떻게 degrade하나요?',['timeout','cache','fallback']]],
    Redis:[['왜 Redis를 사용했나요?',['latency','부하 분산','만료']],['Cache Aside 전략은?',['miss','DB 조회','cache 저장']],['Redis 장애 대응은?',['DB fallback','circuit breaker','부하 보호']],['분산락 주의점은?',['lease','fencing token','중복 실행']]],
    'Spring Transaction':[['트랜잭션 경계를 어디에 두나요?',['service layer','업무 단위']],['self invocation 문제는?',['proxy 우회','책임 분리']],['긴 트랜잭션의 위험은?',['connection','lock','외부 I/O']]],
    MCP:[['MCP를 왜 사용하나요?',['도구 표준화','capability discovery']],['보안 경계는?',['최소 권한','allowlist','승인']],['Agent tool 오류를 막는 방법은?',['schema','policy','idempotency']]],
    default:[['이 기술을 선택한 이유는?',['문제','대안','trade-off']],['운영 장애에 어떻게 대응하나요?',['관측','격리','완화','검증']],['확장 시 병목은 무엇인가요?',['측정','자원 경계','backpressure']]]
  };
})();
