(function buildCurriculum(){
  const make=(title,summary,detail={})=>({
    title,summary,
    definition:detail.definition||`${title}: ${summary}`,
    why:detail.why||'구현 선택의 비용과 실패 조건을 예측하고 운영 중 원인을 빠르게 좁히기 위해 필요합니다.',
    internals:detail.internals||'입력, 상태 변화, 출력과 실패 경계를 순서대로 추적하면 내부 동작을 설명할 수 있습니다.',
    pros:detail.pros||'문제에 맞게 적용하면 코드의 의도와 운영 기준이 명확해집니다.',
    cons:detail.cons||'제약을 확인하지 않고 적용하면 복잡성과 유지 비용이 증가합니다.',
    practice:detail.practice||'실무에서는 요구사항을 먼저 수치화하고 대안과 비교한 뒤 지표로 효과를 검증합니다.',
    incident:detail.incident||`${title}의 용량·시간·동시성 경계를 측정하지 않으면 정상적인 부분 실패가 전체 지연이나 데이터 오류로 전파될 수 있습니다.`,
    interview:detail.interview||`${title}의 정의보다 해결하는 문제, 내부 원리, trade-off와 실제 적용 결과 순서로 답합니다.`,
    related:detail.related||[], aliases:detail.aliases||[], comparison:detail.comparison||null,
    tails:detail.tails||[`${title}의 필요성과 해결 대상은 무엇인가?`,`${title}의 대표적인 trade-off는 무엇인가?`,`${title} 적용 효과를 어떤 지표로 검증할 수 있는가?`],
    tailAnswers:detail.tailAnswers||[]
  });
  const j=(title,summary,internals,practice,related,comparison)=>make(title,summary,{internals,practice,related,comparison,why:'Java/Spring 코드의 정확성·성능·테스트 가능성을 설계 단계에서 판단하기 위해 필요합니다.',interview:`“${summary}”라고 정의한 뒤 내부 동작과 선택 기준, 실무에서 겪은 주의점을 30초 안에 설명합니다.`});
  const curriculum={
    'Java & Spring':{icon:'◆',color:'#5b4bdb',summary:'언어 기본기부터 Spring 운영까지',sections:[
      {title:'Java Core',summary:'컬렉션·객체 계약·예외와 함수형 처리',concepts:[
        j('ArrayList vs LinkedList','ArrayList는 연속 참조 배열, LinkedList는 노드 연결 구조다.','ArrayList는 index로 O(1) 조회하고 용량 초과 시 더 큰 배열로 복사한다. LinkedList는 노드를 순회하므로 임의 조회가 O(n)이다.','대부분의 조회 중심 코드에는 ArrayList를 기본으로 사용한다. 중간 삽입도 위치 탐색 비용 때문에 LinkedList가 항상 빠르지 않다.',['List','Random Access','시간복잡도'],{headers:['기준','ArrayList','LinkedList'],rows:[['저장','연속 참조 배열','양방향 노드'],['임의 조회','O(1)','O(n)'],['끝 추가','상각 O(1)','O(1)'],['메모리','상대적으로 작음','노드 링크 비용 큼']]}),
        j('HashMap 동작 원리','key의 hash로 bucket을 찾고 equals로 동일 key를 판별한다.','hashCode를 spread한 뒤 table index를 계산한다. 충돌은 bucket의 연결 구조로 처리하며 Java 8에서는 임계치를 넘으면 tree로 전환한다.','불변 key를 사용하고 예상 크기를 알면 초기 용량을 지정해 resize 비용을 줄인다.',['Hash 충돌','equals/hashCode','Tree Bin']),
        j('Hash 충돌 처리','서로 다른 key가 같은 bucket에 배치되는 상황을 안전하게 처리한다.','bucket 안에서 hash와 equals를 비교하며 충돌 수가 많아지면 linked list가 red-black tree로 변환될 수 있다.','나쁜 hashCode는 조회를 O(1) 평균에서 O(n)에 가깝게 악화시킨다.',['HashMap','Red-Black Tree','Load Factor']),
        j('equals와 hashCode','논리적으로 같은 객체는 같은 hashCode를 반환해야 한다.','HashMap은 hashCode로 후보 bucket을 고르고 equals로 최종 동일성을 확인한다. 둘의 계약이 깨지면 저장한 key를 다시 찾지 못할 수 있다.','Entity의 식별자가 저장 전후 바뀌는 경우 equals/hashCode 구현을 특히 주의한다.',['Object Identity','HashMap','Immutable Key']),
        j('String / StringBuilder / StringBuffer','String은 불변, Builder는 단일 스레드 가변 조합, Buffer는 동기화된 가변 조합이다.','String 연결은 새 객체를 만들 수 있고 컴파일러가 단순 표현식을 최적화한다. 반복 조합은 내부 buffer를 쓰는 Builder가 적합하다.','반복문 문자열 조합에는 StringBuilder를 사용하고 공유 가변 문자열 자체를 피한다.',['Immutability','String Pool','Thread Safety'],{headers:['기준','StringBuilder','StringBuffer'],rows:[['가변성','가변','가변'],['동기화','없음','메서드 동기화'],['일반 선택','단일 스레드 기본','공유 필요 시 검토']]}),
        j('Primitive vs Wrapper','primitive는 값 자체, wrapper는 객체 표현이다.','autoboxing이 변환 코드를 만들며 null unboxing은 NPE를 유발한다. 일부 wrapper 값은 cache되어 == 결과가 범위에 따라 달라질 수 있다.','nullable DTO에는 wrapper, 대량 계산과 필수 값에는 primitive를 우선 검토한다.',['Autoboxing','Nullability','Value Cache']),
        j('Interface vs Abstract Class','interface는 역할 계약, abstract class는 공통 상태와 구현을 공유하는 기반이다.','클래스는 여러 interface를 구현하지만 하나의 클래스만 상속한다. interface default method도 상태를 직접 소유하지 않는다.','행동 계약은 interface로 두고 강한 is-a 관계와 공통 상태가 있을 때 abstract class를 검토한다.',['Polymorphism','Composition','Default Method']),
        j('Overloading vs Overriding','overloading은 컴파일 시 signature 선택, overriding은 런타임 다형성이다.','overload는 매개변수 타입·개수로 정적 결정되고 override는 실제 객체의 virtual method table을 통해 선택된다.','null 인자 overload 모호성과 equals overload 실수를 주의한다.',['Dynamic Dispatch','Method Signature','Polymorphism']),
        j('Checked vs Unchecked Exception','checked는 호출자가 처리 선언, unchecked는 RuntimeException 계열이다.','컴파일러는 checked 처리 여부만 강제한다. Spring transaction 기본 rollback은 unchecked와 Error에 적용된다.','복구 가능한 외부 조건과 프로그래밍 오류를 구분하고 계층 전체에 일관된 예외 정책을 둔다.',['Exception Translation','Rollback','Error Handling']),
        j('Generic','컴파일 시 타입 안전성과 재사용성을 제공한다.','type erasure로 런타임에는 대부분의 타입 인자가 제거된다. PECS는 producer extends, consumer super 원칙이다.','API 경계에서 raw type을 피하고 wildcard의 읽기/쓰기 방향을 명확히 한다.',['Type Erasure','PECS','Wildcard']),
        j('Stream','데이터 처리 파이프라인을 선언적으로 표현한다.','중간 연산은 lazy하며 terminal 연산이 실행을 시작한다. parallel stream은 공용 ForkJoinPool과 분할 비용을 사용한다.','짧은 변환에는 유용하지만 side effect와 무분별한 parallel 사용을 피한다.',['Lazy Evaluation','Collector','ForkJoinPool']),
        j('Optional','값 부재를 반환 타입에서 명시한다.','map/flatMap/orElseGet으로 분기하며 orElse는 값이 있어도 인자를 먼저 평가한다.','반환 타입에 제한적으로 사용하고 Entity field·메서드 인자에는 남용하지 않는다.',['Null Safety','orElseGet','API Design']),
        j('Collection Framework','List·Set·Queue·Map의 공통 계약과 구현 선택 체계다.','interface가 연산 계약을 정의하고 ArrayList, HashSet, ArrayDeque, HashMap 등이 서로 다른 시간·메모리 특성을 제공한다.','구체 구현보다 interface로 의존하고 순서·중복·조회 패턴에 맞춰 구현을 선택한다.',['List','Set','Queue','Map'])]},
      {title:'Java Concurrency',summary:'공유 상태와 작업 실행을 안전하게 제어',concepts:[
        j('Thread','프로세스 자원을 공유하면서 독립된 호출 stack으로 실행되는 단위다.','JVM thread는 OS thread와 연결되고 scheduler가 실행 시간을 배분한다. 상태 전이는 NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED로 관찰한다.','요청마다 직접 생성하지 않고 executor나 Virtual Thread 같은 관리된 실행 모델을 사용한다.',['Process','Thread State','Virtual Thread']),
        j('Synchronization','공유 가변 상태에 대한 원자성·가시성·순서를 보장하는 조정이다.','synchronized monitor 진입은 mutual exclusion과 happens-before 관계를 만든다. volatile은 가시성과 순서를 제공하지만 복합 연산 원자성은 보장하지 않는다.','공유 상태를 줄이고 lock 범위는 불변식 단위로 최소화한다.',['synchronized','volatile','Happens-Before']),
        j('Executor','작업 제출과 thread 생성·수명·queue 정책을 분리한다.','ThreadPoolExecutor가 core/max pool, work queue, keep-alive, rejection policy로 작업을 조절한다.','무제한 queue와 thread를 피하고 workload, queue capacity, rejection metric을 함께 설계한다.',['ThreadPoolExecutor','Queue','Rejection Policy']),
        j('ConcurrentHashMap','동시 읽기와 갱신을 위한 thread-safe hash map이다.','Java 8 구현은 bucket 단위 동기화와 CAS를 조합하며 retrieval은 일반적으로 전체 lock 없이 진행된다.','복합 read-modify-write에는 compute 계열 atomic API를 사용하고 null key/value가 허용되지 않음을 고려한다.',['HashMap','CAS','Atomic Operation']),
        j('CompletableFuture','비동기 단계와 성공·실패 조합을 표현한다.','stage가 completion graph로 연결되고 async variant는 지정 executor 또는 common pool에서 실행된다.','명시적 executor, timeout, exception path를 두고 blocking join의 위치를 제한한다.',['Future','ForkJoinPool','Timeout'])]},
      {title:'JVM',summary:'메모리·실행·GC의 실제 비용',concepts:[
        j('JVM 메모리 구조','Heap은 객체, Stack은 호출 frame, Method Area는 클래스 메타데이터를 관리한다.','스레드마다 PC와 stack이 있고 heap과 method area는 공유된다. 객체 참조는 stack에, 실제 객체는 보통 heap에 위치한다.','OOM 종류와 GC log를 메모리 영역별로 구분해 진단한다.',['Stack','Heap','Method Area'],{headers:['영역','주요 데이터','공유'],rows:[['Stack','지역변수·호출 frame','스레드별'],['Heap','객체·배열','전체 공유'],['Method Area','클래스 메타데이터','전체 공유']]}),
        j('GC 기본 원리','도달 불가능한 객체를 찾아 메모리를 회수한다.','GC root에서 참조 그래프를 추적한다. 세대 가설을 활용하고 collector별로 pause, throughput, footprint 균형이 다르다.','heap 사용률만 보지 말고 allocation rate, pause p95, promotion failure를 함께 본다.',['GC Root','Young/Old Generation','Stop The World']),
        j('ClassLoader','클래스를 탐색·로딩·링크·초기화한다.','bootstrap→platform→application의 parent delegation으로 핵심 클래스 중복 정의를 방지한다.','plugin과 hot reload에서는 classloader 누수와 타입 동일성 문제를 주의한다.',['Parent Delegation','Linking','Metaspace']),
        j('JIT','자주 실행되는 bytecode를 native code로 최적화한다.','실행 profile을 수집해 inlining, escape analysis 같은 최적화를 적용하고 가정이 깨지면 deoptimization한다.','짧은 benchmark는 warm-up 없이 판단하지 않고 JMH를 사용한다.',['Inlining','Warm-up','JMH'])]},
      {title:'Spring Core',summary:'객체 조립과 횡단 관심사',concepts:[
        j('DI / IoC','객체 생성과 의존 관계 조립을 컨테이너가 담당한다.','ApplicationContext가 BeanDefinition을 읽고 의존성을 해결해 singleton bean을 생성·후처리한다.','생성자 주입으로 필수 의존성과 불변성을 드러낸다.',['ApplicationContext','Constructor Injection','Bean']),
        j('Bean Scope','bean instance의 생명주기와 공유 범위를 정의한다.','singleton은 컨테이너당 하나이며 request/session scope는 웹 요청 문맥에 연결된다.','singleton에 요청별 가변 상태를 저장하지 않는다.',['Singleton','Request Scope','Thread Safety']),
        j('AOP','핵심 로직과 로깅·트랜잭션 같은 횡단 관심사를 분리한다.','Spring은 주로 proxy가 method 호출을 가로채 advice chain을 실행한다. self-invocation은 proxy를 우회한다.','명확한 경계에 적용하고 내부 호출·final method 제한을 테스트한다.',['Proxy','Advice','Self Invocation']),
        j('@Transactional','업무 원자성 경계를 선언한다.','proxy interceptor가 transaction을 시작하고 정상 반환 시 commit, 규칙에 맞는 예외 시 rollback한다.','외부 API 호출을 긴 transaction 안에 두지 않고 실제 proxy 경계를 확인한다.',['Rollback Rule','Proxy','Isolation']),
        j('Transaction Propagation','기존 transaction과 새 호출의 결합 방식을 정한다.','REQUIRED는 참여, REQUIRES_NEW는 기존 것을 suspend하고 새 transaction을 만든다.','REQUIRES_NEW는 별도 connection과 독립 commit 때문에 pool 고갈·부분 성공을 고려한다.',['REQUIRED','REQUIRES_NEW','NESTED']),
        j('Spring MVC','HTTP 요청을 controller와 handler chain으로 연결한다.','DispatcherServlet이 handler mapping, adapter, argument resolver, converter, exception resolver를 순서대로 사용한다.','Controller는 transport 책임만 두고 domain logic을 service로 분리한다.',['DispatcherServlet','Filter','Interceptor'])]},
      {title:'Spring Data',summary:'ORM의 편의와 SQL 통제',concepts:[
        j('JPA 영속성 컨텍스트','Entity의 동일성과 변경 추적을 관리하는 작업 단위다.','1차 cache, snapshot, dirty checking, write-behind가 flush 시 SQL로 반영된다.','transaction 안에서 entity 상태와 발생 SQL을 함께 확인한다.',['EntityManager','Dirty Checking','Flush']),
        j('N+1 문제','목록 1회 조회 뒤 연관 데이터 N회 조회가 추가되는 문제다.','LAZY 접근이나 JPQL의 연관 fetch 누락으로 데이터 수에 비례해 SQL이 증가한다.','SQL count를 측정하고 fetch join, EntityGraph, batch size를 상황별로 선택한다.',['Fetch Join','EntityGraph','Batch Size']),
        j('Lazy vs Eager Loading','연관 데이터를 접근 시점 또는 즉시 로딩하는 전략이다.','LAZY는 proxy/collection wrapper가 접근 때 query를 실행하고 EAGER도 JPQL에서 추가 query를 만들 수 있다.','기본은 LAZY로 두고 use case별 query에서 필요한 graph를 명시한다.',['Proxy','Fetch Plan','OSIV']),
        j('Dirty Checking','관리 상태 Entity의 변경을 자동 감지해 update한다.','flush 시 최초 snapshot과 현재 상태를 비교해 변경 SQL을 만든다.','대량 변경은 개별 dirty checking보다 bulk query를 검토하고 context를 clear한다.',['Snapshot','Flush','Bulk Update'])]},
      {title:'Spring Boot 운영',summary:'설정·관측·배치·실패 처리',concepts:[
        j('Profile','환경별 설정 묶음을 활성화한다.','property source 우선순위와 active profile에 따라 최종 환경이 구성된다.','secret을 profile 파일에 커밋하지 않고 외부 주입한다.',['Externalized Config','Secret','Environment']),
        j('Actuator','health·metric·운영 endpoint를 제공한다.','auto configuration과 Micrometer가 application 상태를 endpoint로 노출한다.','노출 endpoint를 제한하고 readiness와 liveness 책임을 분리한다.',['Micrometer','Health','Readiness']),
        j('Logging','구조화된 사건 기록으로 장애 흐름을 복원한다.','logger level, appender, MDC가 event를 가공·전송한다.','correlation id를 포함하고 개인정보와 무제한 로그를 피한다.',['MDC','Structured Log','Correlation ID']),
        j('Exception Handling','예외를 안정적인 API 계약으로 변환한다.','@ControllerAdvice와 resolver chain이 exception을 상태 코드와 error body로 매핑한다.','내부 stack trace를 노출하지 않고 code·message·correlation id를 제공한다.',['ControllerAdvice','Problem Details','Error Contract']),
        j('Spring Batch','대량 작업을 재시작 가능한 Job/Step 단위로 실행한다.','JobRepository가 execution 상태를 저장하고 chunk transaction이 read-process-write를 반복한다.','멱등성, checkpoint, skip/retry 한계를 명시한다.',['Chunk','JobRepository','Restart'])]}
    ]},
    'OS & Network':{icon:'⌘',color:'#2676e8',summary:'실행·메모리·통신의 기반',sections:[
      {title:'OS Core',summary:'프로세스와 자원 경쟁',concepts:['Process / Thread','Context Switching','Deadlock','Virtual Memory','Lock / CAS'].map(x=>make(x,`${x}의 실행 원리와 운영 비용을 이해한다.`,{related:['CPU Cache','Concurrency','Virtual Thread']}))},
      {title:'Network',summary:'요청이 서버까지 도달하는 경로',concepts:['TCP/IP','HTTP','DNS','TLS','Load Balancing'].map(x=>make(x,`${x}의 계층·상태·실패 조건을 이해한다.`,{related:['Connection Pool','Timeout','Retry']}))}]},
    'Database':{icon:'▦',color:'#0e9f78',summary:'정합성과 쿼리 성능',sections:[
      {title:'Storage & Query',summary:'인덱스와 실행 계획',concepts:['Index','B-Tree','SQL Tuning','PostgreSQL','pgvector'].map(x=>make(x,`${x}의 저장 구조와 성능 특성을 설명한다.`,{related:['Query Planner','Cardinality','EXPLAIN']}))},
      {title:'Concurrency',summary:'동시 요청과 데이터 정합성',concepts:['Transaction','Isolation Level','Lock','MVCC','JPA'].map(x=>make(x,`${x}의 정합성 경계와 동시성 비용을 이해한다.`,{related:['Deadlock','WAL','Rollback']}))}]},
    'Web & React':{icon:'◉',color:'#e05b73',summary:'브라우저와 상태 기반 UI',sections:[
      {title:'Browser',summary:'렌더링과 비동기 실행',concepts:[
        ...['Browser Rendering','Event Loop','PWA','WebView','Mobile UX'].map(x=>make(x,`${x}의 사용자 체감 성능과 실행 경로를 이해한다.`,{related:['DOM','Service Worker','Accessibility']})),
        make('Web Storage API','브라우저 origin별로 문자열 key-value 데이터를 저장하는 동기식 API다.',{
          aliases:['LocalStorage','localStorage','SessionStorage','sessionStorage','Web Storage'],
          why:'페이지 이동이나 새로고침 뒤에도 작은 사용자 상태를 유지하되, 서버 데이터나 보안 자격 증명과 저장 책임을 분리하기 위해 필요합니다.',
          internals:'localStorage는 같은 origin의 Storage 영역에 명시적으로 지울 때까지 값을 유지하고, sessionStorage는 탭 세션 단위로 유지합니다. 두 API 모두 main thread에서 동기식으로 동작합니다.',
          practice:'작은 UI 선호·학습 진도처럼 유실을 허용할 수 있는 상태에 사용하고, JSON 파싱 실패·quota 초과·다중 탭 변경을 처리합니다. token이나 민감 정보는 저장하지 않습니다.',
          incident:'큰 JSON을 반복 직렬화해 main thread가 멈추거나, 오래된 schema를 그대로 읽어 화면 초기화가 실패하는 문제를 versioned key와 복구 가능한 parser로 방지합니다.',
          interview:'LocalStorage는 같은 origin에서 지속되는 동기식 문자열 저장소입니다. SessionStorage와 수명 범위를 구분하고, 용량·동기 실행·보안 제약 때문에 서버 상태나 민감 정보 저장소로 사용하지 않는다고 설명합니다.',
          related:['Same-Origin Policy','IndexedDB','Cookie','Storage Event']
        })
      ]},
      {title:'React',summary:'예측 가능한 컴포넌트 상태',concepts:['State','Props','React Key','Component Lifecycle'].map(x=>make(x,`${x}의 상태 흐름과 렌더링 영향을 설명한다.`,{related:['Reconciliation','Memoization','Server State']}))}]},
    'DevOps':{icon:'△',color:'#e38a20',summary:'배포·관측·복구 자동화',sections:[
      {title:'Container',summary:'재현 가능한 실행 환경',concepts:['Docker Image vs Container','Layer','Volume','Network'].map(x=>make(x,`${x}의 격리와 영속성 경계를 이해한다.`,{related:['Registry','Compose','Security']}))},
      {title:'Delivery & Ops',summary:'안전한 변경과 장애 탐지',concepts:['CI/CD','Logging','Monitoring','OpenTelemetry','Kubernetes 기초','배포 / 롤백'].map(x=>make(x,`${x}를 SLO와 복구 기준에 연결한다.`,{related:['Prometheus','Trace','Canary']}))}]},
    'AI & Design':{icon:'✦',color:'#7755e7',summary:'신뢰 가능한 RAG와 Agent',sections:[
      {title:'RAG',summary:'검색 품질과 근거 기반 생성',concepts:['RAG','Embedding','Vector DB','pgvector','HNSW','Reranking'].map(x=>make(x,`${x}의 품질·지연·비용 trade-off를 이해한다.`,{related:['Hybrid Search','Evaluation','Chunking']}))},
      {title:'Agent Platform',summary:'모델과 도구의 안전한 연결',concepts:['Prompt Engineering','Prompt Injection','Function Calling','MCP','Agent','Workflow','Spring AI'].map(x=>make(x,`${x}의 권한·상태·실패 경계를 설계한다.`,{related:['Tool Calling','Approval','Observability']}))}]},
    'AX Scenario':{icon:'◎',color:'#d34d9a',summary:'증거 기반 운영 판단',sections:[
      {title:'Incident Lab',summary:'완화부터 재발 방지까지',concepts:['장애 분석','운영 판단','성능 병목','데이터 정합성','RAG 품질 저하','LLM API 장애','배치 실패','재처리 설계','로그·메트릭·트레이스'].map(x=>make(x,`${x} 상황에서 영향도·가설·증거·복구를 순서대로 판단한다.`,{related:['SLO','Runbook','Root Cause']}))}]}
  };

  const addSection=(category,title,summary,concepts)=>curriculum[category].sections.push({title,summary,concepts});
  const rich=(title,summary,related=[])=>make(title,summary,{definition:summary,internals:`${title}의 입력·상태 변화·출력과 실패 경계를 순서대로 추적한다. 구현 세부보다 불변식과 시간·공간 비용을 먼저 확인한다.`,why:`${title} 구분은 설계 대안과 장애 원인을 같은 언어로 설명하는 데 필요하다.`,pros:`문제에 맞게 적용하면 책임과 성능 특성이 명확해진다.`,cons:`제약을 무시하면 복잡도·메모리·동시성 비용이 예상보다 커질 수 있다.`,practice:`실무에서는 workload와 실패 조건을 먼저 측정하고 ${title} 적용 전후 지표를 비교한다.`,incident:`용량 또는 동시성 경계를 넘었을 때 ${title}의 숨은 비용이 병목으로 나타난 사례를 trace와 profile로 검증한다.`,interview:`“${summary}”라고 정의하고 내부 동작, 복잡도, 대안과 실무 선택 기준까지 설명한다.`,related});
  const jr=(title,summary,mechanism,related=[])=>j(title,summary,mechanism,`실무에서는 ${title}의 책임과 변경 경계를 코드·test·운영 지표로 함께 검증한다.`,related);

  curriculum['Java & Spring'].sections.unshift(
    {title:'Programming & Design',summary:'객체·함수·설계 원칙과 시스템 경계',concepts:[
      jr('OOP와 객체 모델','상태와 행동을 객체 책임으로 묶고 협력으로 문제를 해결한다.','캡슐화는 변경 지점을 숨기고 다형성은 호출자와 구현을 분리한다. 상속보다 합성을 우선해 결합도를 제어한다.',['Encapsulation','Polymorphism','Composition']),
      jr('SOLID','변경 이유와 의존 방향을 통제하는 다섯 가지 객체 설계 원칙이다.','SRP·OCP·LSP·ISP·DIP를 규칙 암기가 아니라 변경 전파를 점검하는 질문으로 사용한다.',['SRP','OCP','LSP','ISP','DIP']),
      jr('함수형 프로그래밍','불변 데이터와 부수효과가 제한된 함수 합성으로 계산을 표현한다.','함수를 값처럼 전달하고 map/filter/reduce로 변환을 조합하며 side effect를 경계로 밀어낸다.',['Pure Function','Immutability','First-Class Function']),
      jr('Java Call By Value','Java는 primitive 값과 객체 reference 값 모두 복사해 전달한다.','객체 reference의 복사본이 전달되어 내부 변경은 보이지만 parameter를 재할당해도 호출자의 reference는 바뀌지 않는다.',['Reference','Mutation','Parameter Passing']),
      jr('Framework vs Library','실행 흐름의 제어권을 application과 framework 중 누가 갖는지로 구분한다.','library는 application이 호출하고 framework는 lifecycle과 callback 지점에서 application 코드를 호출한다.',['IoC','Callback','Lifecycle']),
      jr('문자 인코딩과 UTF-8','Unicode code point를 byte sequence로 표현하는 규칙을 이해한다.','UTF-8은 1~4 byte 가변 길이이므로 byte와 문자 경계를 구분하고 decoder 상태를 유지한다.',['Unicode','Code Point','Charset']),
      jr('동기 vs 비동기','동기는 완료 시점을 호출 흐름에 맞추고 비동기는 결과를 나중에 결합한다.','blocking/non-blocking은 thread 대기 방식이고 sync/async는 결과 통지 방식이므로 서로 다른 축이다.',['Blocking','Non-blocking','Callback']),
      jr('SQL Injection 방어','SQL code와 외부 입력 data를 분리해 공격 문자열이 구조로 해석되지 않게 한다.','prepared statement가 query 구조를 고정하고 parameter를 값으로 binding한다. filtering만으로 문법 전체를 막을 수 없다.',['Prepared Statement','Least Privilege','Validation']),
      jr('TDD와 테스트 피라미드','작은 실패 test에서 구현과 refactoring을 반복하는 feedback 방식이다.','unit·contract·integration·E2E test는 서로 다른 실패 경계를 보호하며 실행 비용에 맞게 비율을 조절한다.',['Unit Test','Contract Test','Integration Test']),
      jr('DDD와 Bounded Context','도메인 언어와 모델 의미의 경계를 명시한다.','같은 용어도 context마다 모델이 다르며 aggregate가 transaction consistency 경계를 만든다.',['Aggregate','Ubiquitous Language','Bounded Context']),
      jr('Monolith vs Microservices','배포·데이터·팀 경계를 한 application에 둘지 독립 서비스로 나눌지 선택한다.','분산하면 network·partial failure·data ownership이 설계의 일부가 되며 modular monolith는 process 안에서 module 경계를 강제한다.',['Modular Monolith','Service Boundary','Distributed System'])]},
    {title:'Data Structures & Algorithms',summary:'저장 구조와 계산 비용을 근거로 선택',concepts:[
      jr('Stack vs Queue','Stack은 LIFO, Queue는 FIFO 순서로 원소를 꺼낸다.','ArrayDeque는 양 끝 연산을 상각 O(1)에 제공해 Java의 일반적인 stack·queue 구현으로 적합하다.',['Deque','LIFO','FIFO']),
      jr('Tree vs Graph','Tree는 cycle 없는 계층 graph이고 graph는 일반 관계를 표현한다.','DFS/BFS는 방문 상태를 관리하고 tree는 parent가 유일해 계층 탐색이 단순하다.',['DFS','BFS','Cycle']),
      jr('Heap과 PriorityQueue','완전 이진 tree의 순서 조건으로 우선순위 원소를 빠르게 꺼낸다.','array index로 parent/child를 계산하고 insert/poll 때 sift up/down해 O(log n)을 유지한다.',['Binary Heap','Top K','Scheduler']),
      jr('Hash Table','hash function으로 key를 bucket에 매핑하는 평균 O(1) 저장 구조다.','충돌 처리와 resize, load factor가 실제 시간·공간 비용을 결정한다.',['Bucket','Collision','Load Factor']),
      jr('Balanced Search Tree','높이를 제한해 검색·삽입·삭제를 O(log n)에 유지한다.','AVL과 Red-Black Tree는 rotation 수와 tree 높이 사이에서 다른 균형 규칙을 사용한다.',['AVL','Red-Black Tree','Rotation']),
      jr('정렬 알고리즘 선택','입력 크기·분포·안정성·추가 공간에 맞춰 정렬을 선택한다.','merge sort는 안정적 O(n log n), quick sort는 locality가 좋지만 pivot에 따라 최악 O(n²)이다.',['Merge Sort','Quick Sort','Heap Sort']),
      jr('Dynamic Programming','중복 부분 문제의 결과를 저장해 같은 계산을 반복하지 않는다.','optimal substructure와 overlapping subproblem을 확인하고 memoization 또는 tabulation을 구성한다.',['Memoization','Tabulation','State Transition']),
      jr('Recursion','문제를 더 작은 같은 형태로 줄여 base case에서 종료한다.','호출마다 stack frame이 쌓이며 Java는 일반적인 tail-call 최적화를 보장하지 않는다.',['Call Stack','Base Case','Iteration'])]}
  );
  addSection('Java & Spring','Backend Web','Servlet부터 확장 전략까지 request 처리 경로',[
    jr('WS vs WAS','Web Server는 정적 전달·proxy, WAS는 application runtime과 business logic 실행을 담당한다.','Nginx가 connection과 static resource를 처리하고 Tomcat worker가 Servlet application을 실행하는 계층 구성이 일반적이다.',['Nginx','Tomcat','Reverse Proxy']),
    jr('Servlet과 Container','Servlet은 HTTP 처리 계약이고 container가 lifecycle·thread·network를 관리한다.','connector가 request를 worker에 배정하고 filter chain과 service method를 호출한다. singleton servlet field에는 요청 상태를 두지 않는다.',['Tomcat','Filter','Thread Pool']),
    jr('DispatcherServlet','Spring MVC 요청을 가장 먼저 받아 handler chain을 조정하는 front controller다.','HandlerMapping→HandlerAdapter→Controller→MessageConverter/ExceptionResolver 순으로 요청과 응답을 조정한다.',['Spring MVC','HandlerMapping','ControllerAdvice']),
    jr('DTO / VO / Entity','전송·값·영속성 모델의 책임을 분리한다.','DTO는 경계 contract, VO는 값 동등성과 불변식, Entity는 identity와 lifecycle을 가진다.',['DTO','Value Object','Entity']),
    jr('CORS','browser가 다른 origin response 접근을 허용할지 server header로 판단하는 정책이다.','non-simple request는 preflight로 method/header를 확인하며 credential과 wildcard origin은 함께 쓸 수 없다.',['Origin','Preflight','Same-Origin Policy']),
    jr('Scale Up vs Scale Out','node 자원을 키울지 instance 수를 늘릴지 선택한다.','scale out에는 stateless 처리, load balancing, session/data coordination과 분산 관측이 필요하다.',['Load Balancer','Stateless','Bottleneck']),
    jr('Design Patterns','반복되는 설계 문제의 책임 배치와 협력 형태를 이름 붙인 재사용 가능한 언어다.','Strategy·Factory·Adapter·Decorator·Proxy는 목적이 다르므로 class 모양보다 변화 축으로 선택한다.',['Strategy','Factory','Adapter','Proxy'])
  ]);

  addSection('OS & Network','Memory & Concurrency','CPU·주소 공간·동기화의 실제 비용',[
    rich('Concurrency vs Parallelism','동시성은 여러 작업의 진행을 다루고 병렬성은 같은 순간 여러 core에서 실행한다.',['Scheduler','Multi Core','Throughput']),
    rich('Mutex vs Semaphore','Mutex는 소유권 있는 상호 배제, Semaphore는 permit 수로 동시 접근량을 제한한다.',['Critical Section','Permit','Deadlock']),
    rich('Page Fault와 TLB','virtual page가 RAM에 없으면 page fault가 발생하고 TLB는 주소 변환을 cache한다.',['Page Table','Thrashing','Virtual Memory']),
    rich('Page Replacement와 LRU','frame 부족 시 희생 page를 선택하며 LRU는 최근 사용 이력을 근사한다.',['Working Set','Clock Algorithm','Cache']),
    rich('Byte Order','multi-byte 값을 memory와 network byte stream에 배치하는 순서다.',['Big Endian','Little Endian','Serialization'])
  ]);
  addSection('OS & Network','Protocol Deep Dive','browser에서 server까지 protocol 계층',[
    rich('OSI와 TCP/IP 계층','통신 책임을 계층으로 나눠 protocol과 장애 위치를 설명한다.',['Application Layer','Transport Layer','Network Layer']),
    rich('TCP vs UDP','TCP는 연결·순서·재전송, UDP는 연결 상태 없는 datagram 전달을 제공한다.',['QUIC','Congestion Control','Packet Loss']),
    rich('HTTP vs HTTPS','HTTPS는 HTTP를 TLS channel 위에서 전달해 기밀성·무결성·서버 인증을 제공한다.',['TLS Handshake','Certificate','Session Key']),
    rich('GET vs POST','method의 안전성·멱등성·cache 의미는 payload 위치가 아니라 HTTP semantics로 구분한다.',['Safe Method','Idempotency','Cache']),
    rich('Web Request Lifecycle','URL→DNS→connection→TLS→HTTP→server→browser render의 전체 경로다.',['DNS','TCP','TLS','Rendering'])
  ]);
  curriculum.Database.sections[0].concepts.push(rich('Normalization','함수 종속으로 중복과 update anomaly를 줄이는 schema 분해다.',['1NF','3NF','BCNF']),rich('Connection Pool','DB connection을 제한된 수로 재사용하고 database 동시 부하를 제어한다.',['Pool Sizing','Timeout','Backpressure']));
  curriculum.Database.sections[1].concepts.push(rich('ACID','transaction의 atomicity·consistency·isolation·durability 계약이다.',['Commit','Rollback','WAL']),rich('Optimistic vs Pessimistic Lock','version 검증으로 충돌을 감지할지 먼저 lock을 획득할지 선택한다.',['Version','SELECT FOR UPDATE','Retry']));
  curriculum['Java & Spring'].sections.find(s=>s.title==='Java Core').concepts.push(jr('Class / Object / Instance','class는 type 정의, object는 정체성을 가진 모델, instance는 특정 class로 생성된 실체다.','new가 heap에 object를 만들고 reference가 가리킨다. class metadata는 class loader와 연결된다.',['Class','Identity','Instantiation']),jr('Singleton과 전역 상태','한 lifecycle 범위에서 instance 하나를 공유한다.','Spring singleton은 ApplicationContext당 하나이며 request별 mutable state를 두면 race condition이 발생한다.',['Bean Scope','Global State','Thread Safety']),jr('String 불변성과 Interning','String 값은 바뀌지 않으며 같은 literal은 pool에서 공유될 수 있다.','연산 결과는 새 String을 만들고 intern은 canonical reference를 pool에서 관리한다.',['String Pool','Immutability','StringBuilder']));

  const quality=[
    {id:'quality-java-arraylist',category:'Java & Spring',difficulty:'easy',type:'comparison',question:'조회가 많고 끝에 데이터가 추가되는 목록에서 ArrayList를 LinkedList보다 우선 검토하는 핵심 이유는?',options:['배열 기반이라 임의 조회가 O(1)이고 연속 메모리 접근의 locality가 좋기 때문이다','노드 연결 구조라 중간 삽입이 항상 O(1)이고 조회도 O(1)이기 때문이다','모든 추가 연산에서 배열 복사가 발생하지 않아 최악 시간도 항상 O(1)이기 때문이다','동기화가 기본 제공되어 여러 스레드가 별도 제어 없이 수정할 수 있기 때문이다'],answer:0,explanation:'ArrayList의 임의 조회는 O(1)이며 cache locality가 유리합니다. 끝 추가는 resize 시 O(n)이지만 상각 O(1)입니다.',optionReasons:['정답: 배열 index 접근과 locality를 정확히 설명한다.','LinkedList도 위치 탐색이 필요하고 임의 조회는 O(n)이다.','resize는 가끔 발생하며 최악 시간은 O(n)이다.','ArrayList는 기본적으로 thread-safe하지 않다.'],practicalUse:'대부분의 일반적인 조회 중심 List 구현은 ArrayList를 기본 선택으로 둡니다.',interviewAnswer:'ArrayList는 조회 O(1)과 locality가 장점이고, LinkedList는 노드 탐색과 메모리 overhead 때문에 중간 삽입이 많아도 항상 유리하지 않습니다.',tags:['ArrayList','LinkedList','List'],relatedTopics:['Random Access','시간복잡도','Cache Locality'],followUpQuestions:['ArrayList의 끝 추가가 상각 O(1)이라는 말은 어떤 순간의 O(n) 비용을 포함하는가?','중간 삽입이 많으면 LinkedList가 항상 ArrayList보다 빠르다고 할 수 없는 이유는?','두 구현 중 하나를 고르기 전에 실제 workload에서 무엇을 측정해야 하는가?'],followUpAnswers:['여유 capacity에서는 끝 원소를 바로 기록하지만, capacity가 부족하면 더 큰 배열을 만들고 기존 원소를 복사해 한 번의 추가가 O(n)이 된다. 여러 번의 추가 전체에 이 드문 복사 비용을 나누면 상각 O(1)이다.','삽입할 node를 이미 알고 있지 않으면 LinkedList도 그 위치까지 O(n) 순회해야 한다. node별 link와 낮은 cache locality 비용까지 있어 이동할 배열 원소 수만으로 우열을 정할 수 없다.','대표 데이터 크기와 조회·순회·중간 삽입·끝 추가 비율을 고정하고 JMH 같은 도구로 충분히 warm-up한 뒤 latency, throughput과 allocation을 함께 비교한다.']},
    {id:'quality-java-hashmap',category:'Java & Spring',difficulty:'medium',type:'concept',question:'HashMap에서 get(key)가 올바른 값을 찾는 과정을 가장 정확히 설명한 것은?',options:['hashCode를 가공해 bucket을 찾고 후보 key를 hash와 equals로 비교한다','equals만 전체 entry에 순차 적용하고 hashCode는 resize 때만 사용한다','객체 주소를 정렬한 B-Tree를 탐색하고 compareTo로 동일성을 확인한다','key의 toString 결과를 정렬해 이진 탐색하고 충돌 시 마지막 값을 반환한다'],answer:0,explanation:'HashMap은 hash로 bucket 범위를 좁힌 뒤 equals로 논리적 동일성을 확인합니다.',optionReasons:['정답: bucket 선택과 최종 동일성 판별 순서다.','전체 순차 탐색이 아니며 hashCode는 조회에도 사용된다.','HashMap 기본 구조는 B-Tree가 아니다.','toString은 key 계약에 사용되지 않는다.'],practicalUse:'key는 저장 중 hashCode가 바뀌지 않는 불변 객체가 안전합니다.',interviewAnswer:'평균 O(1)이지만 hash 분포가 나쁘면 충돌이 늘고, Java 8은 충돌 임계치를 넘은 bucket을 tree 구조로 전환할 수 있습니다.',tags:['HashMap','hashCode','equals'],relatedTopics:['Hash 충돌','Tree Bin','Load Factor'],followUpQuestions:['서로 다른 key가 같은 bucket에 들어오면 HashMap은 원하는 key를 어떻게 구분하는가?','HashMap의 bucket이 tree 구조로 바뀌어도 나쁜 hashCode 구현을 그대로 두면 안 되는 이유는?','load factor를 낮추거나 높일 때 시간과 메모리 비용은 어떻게 달라지는가?'],followUpAnswers:['bucket 안의 후보마다 먼저 hash를 비교하고 필요한 경우 equals를 호출해 논리적으로 같은 key인지 판별한다. hash가 같다는 사실만으로 같은 key로 처리하지 않는다.','tree bin은 심한 충돌에서 탐색 악화를 줄이는 구현 장치일 뿐이다. 편향된 hash 분포는 충돌과 비교 횟수를 늘리고 resize·메모리 비용에도 영향을 주므로 key 계약부터 고쳐야 한다.','낮은 load factor는 더 일찍 resize해 빈 bucket과 메모리를 더 쓰는 대신 충돌 가능성을 낮춘다. 높은 값은 공간을 아끼지만 bucket 충돌과 탐색 비용이 커질 수 있다.']},
    {id:'quality-java-equals',category:'Java & Spring',difficulty:'medium',type:'troubleshooting',question:'HashSet에 넣은 객체의 필드를 변경한 뒤 contains가 false가 되는 가장 가능성 높은 원인은?',options:['equals/hashCode에 사용된 가변 필드가 바뀌어 조회 bucket이 달라졌기 때문이다','HashSet이 조회할 때 객체를 직렬화해 원본 필드를 제거했기 때문이다','GC가 Set 내부 객체를 이동시키면 모든 hashCode가 자동으로 무효화되기 때문이다','contains가 reference equality만 사용하므로 새 객체는 항상 찾을 수 없기 때문이다'],answer:0,explanation:'저장 후 key의 hash가 바뀌면 원래 bucket에 있는데 다른 bucket을 조회하게 됩니다.',optionReasons:['정답: mutable key가 hash collection 계약을 깨뜨린다.','HashSet 조회는 직렬화를 수행하지 않는다.','객체 이동은 논리 hashCode 무효화 원인이 아니다.','HashSet은 hashCode와 equals를 사용한다.'],practicalUse:'식별자와 key 객체는 불변으로 설계합니다.',interviewAnswer:'equals가 true인 두 객체는 반드시 같은 hashCode를 가져야 하며, collection에 저장된 동안 계약 필드를 바꾸면 안 됩니다.',tags:['equals','hashCode','HashSet'],relatedTopics:['Immutable Key','Object Identity'],followUpQuestions:['equals가 true인 두 객체의 hashCode가 다르면 hash 기반 collection에서 어떤 문제가 생기는가?','reference identity와 논리적 equality는 언제 서로 다를 수 있는가?','이미 HashSet에 넣은 key의 계약 필드를 바꿔야 하는 상황은 어떻게 처리해야 하는가?'],followUpAnswers:['두 객체가 서로 다른 bucket 후보로 분리되어 같은 논리 key가 중복 저장되거나 contains와 remove가 기존 값을 찾지 못할 수 있다. 따라서 equals가 true이면 hashCode도 같아야 한다.','서로 다른 주소의 두 객체도 업무 식별자나 값이 같도록 equals를 구현하면 논리적으로 같을 수 있다. 반대로 같은 reference는 항상 자기 자신과 같아야 한다.','collection에서 먼저 제거한 뒤 필드를 변경하고 다시 넣거나, 더 안전하게는 hash 계약에 쓰는 값을 불변으로 설계한다. 저장된 상태에서 hashCode가 바뀌게 두면 안 된다.']},
    {id:'quality-jvm-memory',category:'Java & Spring',difficulty:'easy',type:'concept',question:'JVM 메모리 영역과 저장 대상의 연결로 가장 적절한 것은?',options:['각 스레드 Stack에는 호출 frame이, 공유 Heap에는 객체와 배열이 주로 저장된다','공유 Stack에는 모든 객체가, 스레드별 Heap에는 지역변수가 저장된다','Method Area에는 HTTP session만, Heap에는 bytecode만 저장된다','PC Register에는 전체 객체 graph가, Stack에는 class metadata가 저장된다'],answer:0,explanation:'Stack은 스레드별 호출 상태, Heap은 공유 객체 저장 영역입니다.',optionReasons:['정답: 대표적인 메모리 책임을 올바르게 연결한다.','Stack과 Heap의 공유 범위가 반대다.','Method Area와 Heap의 역할이 틀렸다.','PC register와 Stack의 역할이 틀렸다.'],practicalUse:'StackOverflowError, Java heap space, Metaspace OOM을 서로 다른 원인으로 진단합니다.',interviewAnswer:'스레드마다 PC와 Stack이 있고 Heap과 Method Area는 공유됩니다. 객체 생명주기와 GC 대상은 주로 Heap에서 관리됩니다.',tags:['JVM','Stack','Heap'],relatedTopics:['Method Area','GC','Thread'],followUpQuestions:['스레드를 하나 더 만들 때 독립적으로 생기거나 공유되는 JVM runtime 영역은 무엇인가?','Method Area에는 어떤 정보가 저장되며 일반 객체가 놓이는 Heap과 어떻게 다른가?','StackOverflowError, Java heap space, Metaspace OOM을 어떤 단서로 구분하는가?'],followUpAnswers:['새 스레드는 자신의 PC register와 JVM stack을 가지지만 Heap과 Method Area는 다른 스레드와 공유한다. 따라서 stack frame은 격리되지만 공유 객체 접근에는 동시성 제어가 필요할 수 있다.','Method Area는 class별 runtime constant pool, field·method 정보와 code 같은 class 수준 구조를 보관한다. Heap은 class로 생성된 객체와 배열을 주로 보관한다.','깊은 재귀나 과도한 frame은 StackOverflowError, 살아 있는 객체 증가와 GC 회수 실패는 Java heap space, class loader·class metadata 증가는 Metaspace 단서를 우선 확인한다.']},
    {id:'quality-spring-transaction',category:'Java & Spring',difficulty:'hard',type:'troubleshooting',question:'@Transactional 메서드 안에서 같은 객체의 다른 @Transactional 메서드를 this로 호출했을 때 새 전파 옵션이 적용되지 않은 이유는?',options:['내부 호출이 Spring proxy를 거치지 않아 transaction interceptor가 실행되지 않았기 때문이다','두 annotation의 isolation이 같으면 JVM이 두 번째 annotation을 compile 단계에서 제거하기 때문이다','EntityManager가 존재하면 propagation 설정은 항상 무시되도록 JPA가 정의하기 때문이다','REQUIRES_NEW는 외부 HTTP 요청에서만 허용되고 Java method 호출에는 적용되지 않기 때문이다'],answer:0,explanation:'기본 proxy AOP는 proxy를 통과하는 외부 호출에 적용됩니다.',optionReasons:['정답: self-invocation의 proxy 우회 문제다.','JVM이 annotation을 조건부 제거하지 않는다.','JPA가 Spring propagation을 무시하도록 정의하지 않는다.','REQUIRES_NEW는 method transaction 전파 옵션이다.'],practicalUse:'transaction 책임을 별도 Bean으로 분리하고 통합 테스트로 실제 경계를 확인합니다.',interviewAnswer:'@Transactional은 proxy 기반이므로 self-invocation은 advice를 우회합니다. 별도 Bean 경계로 분리하는 방법이 가장 명확합니다.',tags:['Spring','Transaction','AOP'],relatedTopics:['Proxy','Self Invocation','Propagation'],followUpQuestions:['외부 Bean 호출에서는 적용된 @Transactional이 같은 객체의 this 호출에서는 빠지는 이유는 무엇인가?','REQUIRES_NEW를 별도 Bean으로 분리했을 때 connection과 commit 경계에서 주의할 점은?','transaction 경계가 실제로 분리됐는지 integration test에서 어떻게 검증할 수 있는가?'],followUpAnswers:['Spring의 기본 proxy 방식은 호출이 proxy를 통과할 때 interceptor를 실행한다. this 호출은 target 객체 내부에서 바로 method를 호출해 proxy와 transaction advice를 거치지 않는다.','기존 transaction을 suspend하고 새 transaction과 connection을 사용할 수 있어 pool 여유가 필요하다. 내부 transaction이 먼저 commit되면 바깥 transaction rollback 뒤에도 부분 성공이 남을 수 있다.','각 경계에서 transaction synchronization이나 별도 저장 결과를 관찰하고, 내부 예외·외부 예외 조합별 commit과 rollback 결과를 실제 database에서 확인한다.']},
    {id:'quality-os-dns',category:'OS & Network',difficulty:'medium',type:'concept',question:'DNS recursive resolver의 핵심 역할은?',options:['클라이언트 대신 계층적 DNS 서버를 조회하고 TTL 동안 결과를 캐시한다','특정 zone의 authoritative record 원본을 소유하고 변경을 영구 저장한다','TCP 연결 상태를 유지하며 HTTP 요청을 application server로 분배한다','CDN edge에서 정적 resource를 원본 대신 저장하고 응답한다'],answer:0,explanation:'recursive resolver는 client를 대신해 root, TLD, authoritative 계층을 조회하고 cache합니다.',optionReasons:['정답: 재귀 resolver의 조회와 cache 책임이다.','authoritative server의 책임이다.','L4/L7 load balancer의 책임이다.','CDN edge cache의 책임이다.'],practicalUse:'TTL은 변경 전파 속도와 resolver 부하 사이의 trade-off입니다.',interviewAnswer:'resolver와 authoritative server를 구분하고 cache TTL이 장애와 전환에 미치는 영향까지 설명합니다.',tags:['DNS','Resolver','TTL'],relatedTopics:['Authoritative DNS','CDN','Load Balancing'],followUpQuestions:['recursive resolver와 authoritative DNS server는 같은 질의에서 각각 어떤 책임을 갖는가?','서비스 IP를 바꾸기 전에 TTL을 낮추는 이유와 그 비용은 무엇인가?','장애 전환 뒤 일부 사용자만 이전 IP로 가는 경우 어디의 cache를 순서대로 확인해야 하는가?'],followUpAnswers:['recursive resolver는 client 대신 계층을 따라 답을 찾고 TTL 동안 cache한다. authoritative server는 자신이 권한을 가진 zone의 record를 최종 답으로 제공한다.','기존 cache가 더 빨리 만료돼 새 IP 전파 시간을 줄일 수 있지만 resolver가 authoritative server를 더 자주 조회하므로 query 부하와 지연이 늘 수 있다.','browser와 OS cache, 사내·ISP recursive resolver의 남은 TTL, authoritative record와 CDN 또는 load balancer 설정을 구분해 확인한다. 한 기기의 cache 삭제만으로 전체 전파를 증명할 수 없다.']},
    {id:'quality-db-index',category:'Database',difficulty:'medium',type:'tradeoff',question:'읽기 성능을 위해 인덱스를 추가하기 전 가장 적절한 판단은?',options:['실제 query 조건·선택도·정렬과 write 비율을 확인하고 실행 계획으로 검증한다','WHERE에 등장한 모든 column에 단일 index를 만들면 planner가 항상 최적 조합을 선택한다','index는 저장 공간만 사용하고 INSERT/UPDATE 비용에는 영향을 주지 않는다','cardinality가 가장 낮은 boolean column을 단독 index로 만들면 모든 query가 빨라진다'],answer:0,explanation:'인덱스 효과는 workload와 데이터 분포에 달려 있으며 실행 계획으로 검증해야 합니다.',optionReasons:['정답: 실제 workload와 비용을 함께 본다.','index가 많다고 항상 결합 사용되는 것은 아니다.','index 유지로 write 비용이 증가한다.','낮은 선택도의 단독 index는 효과가 제한적이다.'],practicalUse:'EXPLAIN ANALYZE와 buffer 사용량을 변경 전후 비교합니다.',interviewAnswer:'인덱스는 읽기와 쓰기 trade-off이며 복합 index 순서는 equality, range, sort 패턴을 함께 고려합니다.',tags:['Index','Query Planner','B-Tree'],relatedTopics:['Cardinality','EXPLAIN','Composite Index'],followUpQuestions:['cardinality와 선택도는 planner가 index scan을 선택하는 판단에 어떻게 영향을 주는가?','복합 B-tree index의 column 순서는 equality, range와 ORDER BY 조건을 어떻게 반영해야 하는가?','인덱스 추가 효과를 EXPLAIN (ANALYZE, BUFFERS)에서 어떤 값으로 비교하는가?'],followUpAnswers:['서로 다른 값이 많고 조건이 적은 row만 고르는 높은 선택도라면 index 비용을 회수하기 쉽다. 많은 row를 읽어야 하면 random heap 접근보다 sequential scan이 더 저렴할 수 있다.','일반적으로 자주 쓰는 equality 조건을 앞쪽에 두고 그 뒤 range와 정렬 사용을 검토하되, 실제 query 조합과 data 분포를 기준으로 plan을 확인해야 한다. 선두 column을 쓰지 못하면 활용이 제한될 수 있다.','실제 row와 추정 row 차이, Index Cond, filter로 제거된 row, shared hit/read block, heap fetch, sort 유무와 전체 실행 시간을 동일한 대표 query에서 변경 전후 비교한다.']},
    {id:'quality-ai-rag',category:'AI & Design',difficulty:'hard',type:'troubleshooting',question:'RAG 답변 정확도가 낮고 retrieval top-20에는 정답 문서가 있지만 top-3에는 거의 없을 때 우선할 개선은?',options:['후보 recall을 유지한 채 reranker로 질의-문서 관련성 순서를 재평가하고 MRR을 측정한다','generation temperature만 높여 모델이 더 다양한 문장을 생성하게 한다','embedding index를 제거하고 최신 문서 세 개를 항상 고정 context로 제공한다','검색 실패를 숨기기 위해 답변의 출처 표시를 제거하고 token 수를 늘린다'],answer:0,explanation:'정답 후보는 존재하지만 순위가 낮으므로 ranking 단계가 병목입니다.',optionReasons:['정답: 관측된 병목에 맞춘 개선과 평가다.','temperature는 검색 순위를 개선하지 않는다.','고정 context는 질의 관련성을 보장하지 않는다.','출처 제거와 token 증가는 품질 원인을 해결하지 않는다.'],practicalUse:'retrieval recall@k와 reranking MRR/nDCG를 generation 평가와 분리합니다.',interviewAnswer:'RAG는 retrieval, ranking, generation을 분리 계측하고 가장 먼저 실패한 단계를 고칩니다.',tags:['RAG','Reranking','Evaluation'],relatedTopics:['Embedding','MRR','nDCG'],followUpQuestions:['정답 문서가 top-20에는 있지만 top-3에 거의 없다는 관측으로 retrieval과 ranking 중 무엇을 구분할 수 있는가?','MRR과 nDCG는 reranker 평가에서 각각 어떤 실패를 더 잘 드러내는가?','reranking을 고친 뒤에도 후보 recall@20이 낮다면 embedding 단계에서 무엇을 다시 검증해야 하는가?'],followUpAnswers:['후보 집합에 정답이 들어오므로 retrieval recall은 일부 확보됐지만 상위 순서가 나쁘다는 뜻이다. 먼저 reranker의 질의-문서 관련성 판별과 top-k 순위 지표를 점검한다.','MRR은 첫 번째 관련 문서가 얼마나 앞에 오는지에 민감하고, nDCG는 여러 관련 문서의 등급과 전체 순서를 할인 누적으로 평가한다. 제품의 context 구성 방식에 맞는 지표를 선택한다.','질의와 문서에 같은 embedding model·전처리·distance metric을 쓰는지, chunk가 답 근거를 보존하는지, domain query에서 recall@k가 어떻게 변하는지 검증한다.']}
  ];
  const java=curriculum['Java & Spring'];
  const existing=new Set(java.sections.flatMap(s=>s.concepts).map(c=>c.title.toLowerCase()));
  const add=(section,title,summary,internals,related=[])=>{if(!existing.has(title.toLowerCase())){section.concepts.push(j(title,summary,internals,`작은 재현 코드와 metric·log로 ${title}의 동작과 비용을 검증합니다.`,related));existing.add(title.toLowerCase());}};
  const language={title:'Java Language',summary:'값·객체·타입 시스템의 기본 계약',concepts:[]};
  [
    ['변수와 자료형','변수는 타입이 정한 값의 표현 범위와 연산 계약을 가진 저장 위치다.','primitive 값과 reference를 구분하고 scope·lifetime·numeric promotion 순서로 실행을 추적한다.',['Scope','Type Conversion']],
    ['값 전달 방식','Java method 호출은 언제나 값을 복사해 전달하며 object에서는 reference 값이 복사된다.','callee가 reference가 가리키는 객체는 바꿀 수 있지만 caller 변수 자체를 다른 객체로 재지정할 수는 없다.',['Pass by Value','Reference']],
    ['final','변수 재할당, method override 또는 class 상속을 제한하는 문맥별 제약이다.','final reference는 재할당만 막고 가리키는 mutable object의 내부 변경까지 막지는 않는다.',['Immutability','Constant']],
    ['static','instance가 아니라 class 단위로 공유되는 member를 선언한다.','class initialization 시점과 classloader 범위에 연결되며 mutable static state는 전역 동시성 문제가 된다.',['ClassLoader','Global State']],
    ['접근제어자','public·protected·package-private·private로 compile-time 접근 경계를 만든다.','package와 상속 관계를 기준으로 member 접근을 검증해 encapsulation을 보호한다.',['Encapsulation','Module']],
    ['상속','상위 타입의 계약과 구현을 하위 타입이 확장하는 관계다.','dynamic dispatch로 실제 객체의 override method가 호출되며 LSP를 깨면 다형성이 실패한다.',['LSP','Composition']],
    ['다형성','같은 상위 타입 호출이 실제 객체에 따라 다른 동작을 선택하는 성질이다.','runtime dispatch가 receiver의 실제 class에 맞는 override 구현을 선택한다.',['Dynamic Dispatch','Interface']],
    ['예외 처리','정상 반환과 실패 흐름을 분리해 호출자가 복구·변환·전파를 결정하게 한다.','stack unwinding 중 가장 가까운 matching catch를 찾고 finally 또는 resource close를 수행한다.',['Try With Resources','Exception Translation']],
    ['Annotation','코드에 도구와 runtime이 해석할 구조화 metadata를 붙인다.','retention과 target에 따라 compiler, bytecode 또는 reflection 단계에서 읽힌다.',['Retention','Reflection']],
    ['Reflection','runtime에 type·member metadata를 조사하고 제한적으로 호출하는 API다.','Class metadata에서 constructor·field·method를 조회하며 encapsulation·성능·native image 제약을 고려한다.',['Class','Proxy']]
  ].forEach(v=>add(language,...v));
  java.sections.unshift(language);
  const collections={title:'Java Collections',summary:'순서·중복·탐색·동시성에 따른 자료구조 선택',concepts:[]};
  [
    ['List / Set / Map','List는 순서, Set은 유일성, Map은 key-value 조회 계약을 제공한다.','interface 계약과 구현의 정렬·hash·동시성 특성을 분리해 선택한다.',['Collection Framework']],
    ['TreeMap','정렬된 key를 red-black tree로 유지하는 Map 구현이다.','비교 기준으로 탐색·삽입·삭제가 O(log n)이며 comparator가 equals와 불일치하면 주의한다.',['Red-Black Tree','Comparator']],
    ['HashSet','HashMap key 영역을 사용해 중복 없는 원소 집합을 구현한다.','hashCode로 bucket을 찾고 equals로 동일성을 판정하므로 mutable key가 계약을 깨뜨린다.',['HashMap','equals/hashCode']],
    ['Queue와 Deque','한쪽 또는 양쪽 끝에서 원소를 처리하는 대기열 계약이다.','ArrayDeque의 circular array가 stack과 queue 연산을 모두 상각 O(1)로 제공한다.',['ArrayDeque','FIFO']],
    ['Stack 사용 시 주의점','legacy Stack보다 Deque를 LIFO stack으로 사용하는 것이 권장된다.','Stack은 Vector 상속과 불필요한 동기화·API 노출을 가지지만 ArrayDeque는 명확한 양끝 연산을 제공한다.',['Deque','LIFO']],
    ['Iterator와 fail-fast','Iterator는 순회 상태를 캡슐화하고 구조 변경을 빠르게 감지할 수 있다.','modCount 불일치를 best-effort로 확인해 ConcurrentModificationException을 던지며 동시성 보장은 아니다.',['ConcurrentModificationException']],
    ['Immutable Collection','생성 뒤 구조 변경을 허용하지 않는 collection이다.','List.of 등의 factory는 unmodifiable instance를 만들며 내부 원소 객체의 깊은 불변성은 별개다.',['Defensive Copy','Immutability']],
    ['시간복잡도 비교','자료구조 연산 비용을 입력 크기에 따른 증가율로 비교한다.','평균·최악·상각 비용과 cache locality·memory overhead를 실제 workload와 함께 본다.',['Big-O','Cache Locality']]
  ].forEach(v=>add(collections,...v));java.sections.splice(2,0,collections);
  const modern={title:'Modern Java',summary:'함수형·비동기·간결한 데이터 모델과 경량 동시성',concepts:[]};
  [
    ['Lambda','행동을 값처럼 전달하는 함수형 표현이다.','invokedynamic과 functional interface target typing으로 실행 객체가 연결되며 captured local은 effectively final이어야 한다.',['Functional Interface']],
    ['Functional Interface','추상 method 하나를 가진 lambda target contract다.','SAM signature가 lambda parameter와 return type을 결정한다.',['Lambda','Predicate']],
    ['Method Reference','기존 method를 lambda 본문 대신 참조하는 축약 표현이다.','target functional interface에 맞춰 static·bound·unbound·constructor reference를 연결한다.',['Lambda']],
    ['Record','data carrier의 state·accessor·equals·hashCode·toString을 간결히 선언한다.','component가 final field와 canonical constructor로 변환되지만 component object의 깊은 불변성은 보장하지 않는다.',['Value Object']],
    ['Sealed Class','상속 또는 구현 가능한 subtype 집합을 명시적으로 제한한다.','permits와 module/package 규칙이 폐쇄된 hierarchy를 만들고 exhaustive pattern 판단을 돕는다.',['Pattern Matching']],
    ['Virtual Thread','blocking I/O 작업을 적은 platform thread 위에서 대규모로 실행하는 경량 Thread다.','JVM scheduler가 continuation을 mount/unmount하며 CPU-bound 병렬성이나 downstream 용량을 늘리지는 않는다.',['Project Loom','Structured Concurrency']]
  ].forEach(v=>add(modern,...v));java.sections.splice(3,0,modern);
  const jvm=java.sections.find(s=>s.title==='JVM');
  [
    ['객체 생성 과정','new는 class 초기화 확인, memory 할당, zeroing, header 설정, constructor 실행을 거친다.','TLAB bump allocation이 일반적이며 escape analysis 결과에 따라 allocation이 제거될 수 있다.',['TLAB','Object Header']],
    ['GC 종류','Serial·Parallel·G1·ZGC 등 collector는 pause·throughput·heap 크기 목표가 다르다.','공통 도달성 분석 위에 region·concurrent marking·compaction 전략을 다르게 적용한다.',['G1','ZGC']],
    ['Escape Analysis','object가 method 또는 thread 밖으로 탈출하는지 JIT가 분석한다.','탈출하지 않는 allocation은 scalar replacement와 lock elision 후보가 될 수 있으나 stack allocation을 보장하는 명세는 아니다.',['JIT','Scalar Replacement']],
    ['Memory Leak과 OOM 분석','도달 가능하지만 더는 필요 없는 객체 누적도 Java memory leak이다.','GC log→heap usage→heap dump dominator/retained size→allocation path 순으로 증거를 좁힌다.',['Heap Dump','Dominator Tree']],
    ['Thread Dump와 Heap Dump','thread dump는 실행·lock 상태, heap dump는 객체 graph snapshot이다.','장애 종류에 맞춰 여러 시점 thread dump와 제한된 heap dump를 수집하고 민감정보·pause 비용을 고려한다.',['jcmd','Deadlock']]
  ].forEach(v=>add(jvm,...v));
  const concurrency=java.sections.find(s=>s.title==='Java Concurrency');
  [
    ['synchronized','monitor 기반 mutual exclusion과 happens-before를 제공한다.','entry/exit가 lock ownership과 memory visibility를 묶으며 critical section이 길면 contention이 커진다.',['Monitor','Happens-Before']],
    ['volatile','단일 변수 read/write의 visibility와 ordering을 제공한다.','read/write에 happens-before를 형성하지만 count++ 같은 복합 연산의 atomicity는 보장하지 않는다.',['Memory Model','Atomic']],
    ['Atomic과 CAS','lock 없이 조건부 원자 갱신을 시도하는 연산이다.','expected 값과 현재 값이 같을 때만 update하며 retry·contention·ABA 문제를 고려한다.',['Compare And Set','ABA']],
    ['Lock과 Deadlock','명시적 lock은 유연한 획득 정책을 주지만 순환 대기는 deadlock을 만든다.','일관된 lock order, timeout, tryLock과 thread dump wait-for graph로 예방·진단한다.',['ReentrantLock','Lock Order']],
    ['Thread Pool','제한된 worker와 queue로 task 실행량을 제어한다.','arrival rate·service time·queue capacity·rejection policy가 latency와 overload behavior를 결정한다.',['Backpressure','Little’s Law']],
    ['Future','비동기 계산의 완료·결과·취소 handle이다.','get은 호출 thread를 block하며 timeout·cancel propagation을 명시해야 한다.',['CompletableFuture','Cancellation']]
  ].forEach(v=>add(concurrency,...v));
  const spring=java.sections.find(s=>s.title==='Spring Core'),data=java.sections.find(s=>s.title==='Spring Data'),ops=java.sections.find(s=>s.title==='Spring Boot 운영');
  [['Bean Lifecycle','definition 등록부터 생성·주입·후처리·초기화·소멸까지의 생명주기다.','BeanPostProcessor가 initialization 전후를 가로채며 proxy도 이 과정에서 만들어질 수 있다.',['BeanPostProcessor']],['Component Scan','classpath의 stereotype candidate를 찾아 BeanDefinition으로 등록한다.','base package와 filter로 scan 범위를 정하며 넓은 scan은 의도치 않은 bean 충돌을 만든다.',['BeanDefinition']],['Proxy','target 호출을 감싸 advice·transaction·security 같은 정책을 적용한다.','JDK dynamic proxy 또는 class-based proxy가 method boundary를 가로채며 self-invocation은 우회한다.',['AOP']],['Validation','외부 입력 제약을 선언적으로 검증하고 일관된 오류로 변환한다.','Bean Validation provider가 constraint metadata를 읽고 controller method argument 단계에서 검사한다.',['Bean Validation']],['Transaction Isolation','동시 transaction이 서로의 변경을 관찰하는 범위를 정한다.','database isolation과 MVCC/lock 구현이 dirty·non-repeatable·phantom read를 제어한다.',['MVCC']]].forEach(v=>add(spring,...v));
  [['Entity 상태','transient·managed·detached·removed로 persistence context 참여 상태를 구분한다.','persist·find·detach·remove와 transaction boundary가 상태 전이를 만든다.',['EntityManager']],['Fetch Join','조회 query에서 필요한 association을 한 SQL로 함께 가져온다.','JPQL join fetch가 fetch plan을 override하지만 collection pagination과 Cartesian expansion을 주의한다.',['N+1']],['JPA Lock','optimistic version 또는 pessimistic DB lock으로 concurrent update를 조정한다.','충돌 빈도와 retry 비용에 따라 @Version과 SELECT FOR UPDATE 계열을 선택한다.',['Optimistic Lock']]].forEach(v=>add(data,...v));
  [['Spring Security','filter chain과 authentication/authorization context로 요청 접근을 통제한다.','SecurityFilterChain이 credential 처리와 decision을 연결하며 method security가 service boundary를 보완한다.',['Authentication','Authorization']],['Spring Test','unit·slice·integration test로 책임과 wiring을 다른 범위에서 검증한다.','test context cache와 transactional test behavior를 이해해 격리와 실행 시간을 관리한다.',['JUnit','Testcontainers']]].forEach(v=>add(ops,...v));

  const findConceptByTitle=(category,title)=>curriculum[category]?.sections.flatMap(section=>section.concepts).find(concept=>concept.title===title)||null;
  const bTree=findConceptByTitle('Database','B-Tree');
  const servlet=findConceptByTitle('Java & Spring','Servlet과 Container');
  const arrayList=findConceptByTitle('Java & Spring','ArrayList vs LinkedList');
  const webStorage=findConceptByTitle('Web & React','Web Storage API');
  if(!bTree||!servlet) throw new Error('필수 교육 개념(B-Tree, Servlet과 Container)을 찾지 못했습니다.');

  const reviewedConceptEvidence={
    'ArrayList vs LinkedList':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'definition-internals-comparison-practice-followups',contentSha256:'10f4d10b4806483cadab65973b746849458334c71f55e0d437f92297c5a2ed45'},
    'B-Tree':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'definition-internals-comparison-practice-followups',contentSha256:'9d7204dd95e76bb8642f6200c2c9666f62ce2b9022b717d6e3fc71b6e0bbe61d'},
    'Servlet과 Container':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'definition-internals-comparison-practice-followups',contentSha256:'92c535b8a08d0224f36aa7756373d5826b55bbc3c5ae331059a90ebd44d8db9f'},
    'Web Storage API':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'definition-internals-comparison-practice-followups',contentSha256:'fb993907d7ea413cde7da280861d7443e4f805f4f5ccc2a07599910ad6c544c2'}
  };

  Object.assign(bTree,{
    summary:'PostgreSQL B-tree는 정렬된 key를 page 단위의 균형 트리에 저장해 equality·range·ORDER BY 탐색을 지원한다.',
    definition:'PostgreSQL B-tree index는 정렬 가능한 값을 균형 잡힌 다방향 트리에 저장하는 기본 index 방식이다. =, <, <=, >, >=, BETWEEN, IN 같은 equality·range 조건과 ORDER BY를 위한 정렬된 index scan에 적합하다.',
    why:'전체 table을 읽지 않고도 비교 연산으로 탐색 범위를 줄이고, 정렬된 leaf를 이용해 범위와 ORDER BY를 처리하기 위해 필요하다.',
    internals:'root와 internal page는 separator key와 child downlink를 저장한다. 비교 연산으로 downlink를 선택해 leaf page까지 내려가며, leaf tuple의 정렬된 index key와 heap TID로 table row를 찾는다. page가 가득 찬 상태의 insert는 page split과 parent 갱신을 일으킬 수 있다.',
    pros:'트리 높이가 제한되어 equality와 범위 탐색 비용을 예측하기 쉽고, 정렬 순서를 재사용해 ORDER BY나 min/max 처리에도 유리하다.',
    cons:'INSERT·UPDATE·DELETE마다 정렬된 page를 유지해야 하므로 write amplification, page split, vacuum 대상과 저장 공간 비용이 생긴다. 낮은 선택도나 복합 index의 선두 column을 쓰지 못하는 query에서는 이점이 제한된다.',
    practice:'EXPLAIN (ANALYZE, BUFFERS)에서 Index Cond, 실제 row 수, heap fetch, shared block과 정렬 제거 여부를 확인하고 write latency·index size·bloat를 변경 전후 비교한다.',
    incident:'랜덤 분포 key가 높은 비율로 삽입되며 page split과 write I/O가 증가한 경우, query plan과 index 통계·size·write latency를 함께 확인한 뒤 key 순서, fillfactor 또는 index 필요성을 재평가한다.',
    interview:'정렬된 root/internal/leaf page 구조, downlink 탐색, leaf의 key와 heap TID, equality·range·ORDER BY 장점, write와 page split 비용을 차례로 설명한다.',
    related:['Composite Index','Query Planner','EXPLAIN','Page Split'],
    aliases:['B-tree','btree','B Tree'],
    comparison:{headers:['기준','B-tree index','Hash index'],rows:[['지원 연산','equality·range·정렬','주로 equality'],['자료 구조','정렬된 균형 트리 page','hash bucket'],['대표 비용','page split·정렬 유지','bucket 유지·range 미지원']]},
    tails:['B-tree 탐색에서 root부터 leaf까지 어떤 정보로 경로를 선택하는가?','B-tree index가 range query와 ORDER BY에 유리한 이유는 무엇인가?','B-tree index 추가가 오히려 손해가 되는 workload를 어떻게 검증하는가?'],
    tailAnswers:['internal page의 separator key와 비교해 child downlink를 선택하고, 이 과정을 leaf page까지 반복한 뒤 index key와 heap TID로 row를 찾는다.','leaf key가 정렬되어 있어 시작 위치를 찾은 뒤 연속된 key 범위를 순서대로 scan할 수 있고, index 순서가 query의 ORDER BY와 맞으면 별도 sort를 줄일 수 있다.','낮은 선택도와 높은 write 비율을 먼저 확인하고 EXPLAIN (ANALYZE, BUFFERS), index 사용률, write latency, index size와 bloat를 추가 전후로 비교한다.'],
    difficulty:'면접·실무',estimatedMinutes:18,importance:'핵심',importanceReason:'index 선택과 query plan 진단을 함께 검증하는 database 핵심 개념이다.',
    reviewStatus:'reviewed',reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'definition-internals-comparison-practice-followups',
    sources:[{title:'PostgreSQL 18 Documentation: B-Tree Indexes',url:'https://www.postgresql.org/docs/current/btree.html',checkedAt:'2026-08-25',version:'PostgreSQL current',sourceScope:'direct'}]
  });

  Object.assign(servlet,{
    summary:'Servlet은 요청·응답 처리와 생명주기 계약을 정의하고, Servlet container는 mapping·filter chain·동시 요청·생명주기를 관리한다.',
    definition:'Servlet은 init, service, destroy 생명주기와 요청·응답 처리 계약을 정의한다. HttpServlet은 HTTP method를 doGet·doPost 등으로 dispatch하는 HTTP 전용 구현 기반이며, Servlet container는 instance 생성, URL mapping, filter chain, request/response 객체와 동시 호출을 관리한다.',
    why:'application code가 socket·HTTP parsing·thread 생명주기를 직접 구현하지 않고도 표준 요청 처리 계약 위에서 business logic에 집중하도록 경계를 제공한다.',
    internals:'container는 URL mapping으로 target Servlet을 찾고 filter chain을 통과시킨 뒤 service를 호출한다. HttpServlet.service는 HTTP method에 따라 doGet·doPost 등으로 분기한다. 같은 Servlet instance의 service가 여러 request에서 동시에 호출될 수 있으므로 request별 mutable state를 instance field에 저장하면 안 된다.',
    pros:'표준 lifecycle·mapping·filter 확장점 덕분에 security, logging, encoding 같은 cross-cutting concern을 일관되게 적용할 수 있다.',
    cons:'container lifecycle과 동시성 계약을 모르면 shared mutable field, blocking I/O, thread-local 정리 누락이 사용자 간 데이터 노출이나 worker 고갈로 이어질 수 있다.',
    practice:'mapping과 filter 순서를 integration test로 검증하고 request별 상태는 지역 변수나 명시적 scope에 둔다. latency, active thread, queue, error rate를 함께 관측한다.',
    incident:'로그인 사용자 ID를 Servlet instance field에 저장해 concurrent request가 서로의 값을 덮어쓴 사고는 request state를 지역 변수로 이동하고 concurrency test로 재발을 막는다.',
    interview:'Servlet과 HttpServlet을 구분한 뒤 init→service→destroy, mapping→filter chain→service, 동시 service 호출과 instance field 주의점을 설명한다.',
    related:['HttpServlet','Servlet Lifecycle','Filter Chain','Thread Safety'],
    aliases:['Servlet','서블릿','Servlet Container','서블릿 컨테이너'],
    comparison:{headers:['기준','Servlet / HttpServlet','Spring DispatcherServlet'],rows:[['책임','표준 request·response와 lifecycle 계약','Spring MVC handler 조정'],['호출 주체','Servlet container','Servlet container가 호출하는 front controller'],['확장 지점','Filter·listener·Servlet API','HandlerMapping·Interceptor·Resolver']]},
    tails:['Servlet과 HttpServlet의 책임은 어떻게 다른가?','Servlet container가 request를 처리할 때 mapping부터 service까지 어떤 순서를 거치는가?','Servlet instance field에 request 상태를 두면 왜 위험하며 어떻게 검증하는가?'],
    tailAnswers:['Servlet은 protocol에 독립적인 lifecycle·service 계약이고, HttpServlet은 HTTP method를 doGet·doPost 등으로 dispatch하는 HTTP 전용 기반 class다.','container가 URL mapping으로 Servlet을 선택하고 filter chain을 실행한 뒤 service를 호출하며, HttpServlet은 HTTP method별 handler로 분기한다.','같은 instance의 service가 concurrent request에서 호출될 수 있어 값이 덮어써지거나 다른 사용자에게 노출될 수 있다. 동시 요청 integration test로 검증하고 request 상태는 지역 변수나 request scope에 둔다.'],
    difficulty:'면접·실무',estimatedMinutes:16,importance:'핵심',importanceReason:'Java web request 처리와 동시성 경계를 설명하는 기반 개념이다.',
    reviewStatus:'reviewed',reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'definition-internals-comparison-practice-followups',
    sources:[{title:'Jakarta Servlet Specification 6.1',url:'https://jakarta.ee/specifications/servlet/6.1/jakarta-servlet-spec-6.1',checkedAt:'2026-08-25',version:'Jakarta Servlet 6.1',sourceScope:'direct'}]
  });
  Object.assign(arrayList,{
    summary:'ArrayList는 크기가 늘어나는 배열 기반 List이고, LinkedList는 양방향 연결 List다.',
    definition:'ArrayList는 내부 배열의 capacity를 늘려 가며 List 계약을 구현하고, LinkedList는 앞·뒤 node 연결을 따라 List와 Deque 계약을 구현한다. 두 구현 모두 null을 허용하며 기본적으로 동기화되어 있지 않다.',
    why:'같은 List 계약이라도 index 조회, 순차 접근, 구조 변경과 동시 접근의 비용이 다르므로 실제 연산 패턴에 맞는 구현을 선택해야 한다.',
    internals:'ArrayList의 size·get·set은 상수 시간이고 끝 add는 전체 연산을 평균하면 상각 상수 시간이다. capacity가 부족하면 내부 배열을 늘리지만 증가 정책의 세부는 명세하지 않는다. LinkedList의 index 연산은 지정 index에 가까운 앞 또는 뒤에서 node를 순회한다.',
    pros:'ArrayList는 index 조회와 set이 상수 시간이고 끝 추가가 상각 상수 시간이며, 공식 API 문서상 LinkedList보다 일반 연산의 상수 계수가 낮다. LinkedList는 List와 Deque를 함께 구현해 양 끝 연산 API를 제공한다.',
    cons:'ArrayList의 위치 삽입·삭제는 뒤 원소를 이동시키고 capacity 증가 시 재할당이 생길 수 있다. LinkedList의 index 접근은 node 순회가 필요하다. 두 구현 모두 구조를 동시에 수정할 때 외부 동기화가 필요하다.',
    practice:'조회·끝 추가·위치 삽입의 실제 비율과 데이터 크기를 먼저 정하고 두 구현을 같은 workload에서 측정한다. 단순히 “중간 삽입”이라는 말만으로 LinkedList를 선택하지 않는다.',
    incident:'LinkedList를 선택한 뒤 반복문에서 get(index)를 계속 호출해 매번 node를 순회한 경우, 접근 패턴을 iterator 기반 순회로 바꾸거나 ArrayList와 비교 측정해 병목을 제거한다.',
    interview:'ArrayList는 resizable array라 get·set이 상수 시간이고 add가 상각 상수 시간이며, LinkedList는 양방향 node를 index까지 순회한다고 설명한다. 이어 위치 탐색 여부, 동기화 계약과 workload 측정을 선택 기준으로 제시한다.',
    related:['List','Random Access','Deque','시간복잡도'],
    comparison:{headers:['기준','ArrayList','LinkedList'],rows:[['구조','크기가 늘어나는 배열','양방향 연결 node'],['index 접근','get·set 상수 시간','가까운 끝부터 node 순회'],['끝 추가','상각 상수 시간','List·Deque append API 제공'],['동시 구조 변경','외부 동기화 필요','외부 동기화 필요']]},
    tails:['ArrayList의 임의 조회와 끝 추가 비용은 각각 어떻게 설명하는가?','LinkedList의 중간 삽입이 항상 ArrayList보다 빠르다고 할 수 없는 이유는?','두 구현 선택을 실제 workload에서 어떻게 검증하는가?'],
    tailAnswers:['ArrayList는 배열 index로 임의 조회가 O(1)이고 끝 추가는 여유 공간이 있으면 상수 시간, resize가 포함된 전체 평균은 상각 O(1)이다.','삽입 위치의 node를 이미 알고 있지 않다면 LinkedList도 위치까지 O(n) 탐색이 필요하고, node별 link와 낮은 locality 비용이 더해진다.','대표 크기와 조회·순회·삽입 비율을 고정한 benchmark로 latency와 allocation을 비교하고, 구현 복잡성까지 함께 판단한다.'],
    reviewStatus:'reviewed',reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'definition-internals-comparison-practice-followups',
    sources:[
      {title:'Java SE 21 API: ArrayList',url:'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html',checkedAt:'2026-08-25',version:'Java SE 21',sourceScope:'direct'},
      {title:'Java SE 21 API: LinkedList',url:'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedList.html',checkedAt:'2026-08-25',version:'Java SE 21',sourceScope:'direct'}
    ]
  });
  Object.assign(webStorage,{
    summary:'Web Storage는 origin별 Storage 영역에 DOMString key-value를 보관하는 브라우저 API이며 localStorage와 sessionStorage를 제공한다.',
    definition:'Web Storage는 브라우저 origin별 저장 영역을 제공한다. localStorage는 window origin의 local storage area를, sessionStorage는 같은 origin과 현재 page session에 연결된 session storage area를 노출한다. Storage는 getItem·setItem·removeItem·clear를 제공하며 key와 value를 문자열로 다룬다.',
    why:'session 단위 상태와 session을 넘어 유지할 client 상태를 구분하고, cookie처럼 매 HTTP 요청에 자동 전송하지 않으면서 브라우저에 name-value 데이터를 보관하기 위해 사용한다.',
    internals:'setItem은 key 값을 생성하거나 바꾸고 저장할 수 없으면 QuotaExceededError를 던진다. 변경은 같은 storage 영역을 가진 다른 Window에 storage event로 전달된다. localStorage의 공유 상태에는 locking 보장이 없고, sessionStorage는 origin과 top-level browsing context 범위로 분리된다.',
    pros:'localStorage는 같은 origin의 여러 window가 공유하는 지속 상태에, sessionStorage는 서로 다른 window의 작업이 섞이면 안 되는 page session 상태에 맞는 간단한 문자열 API를 제공한다.',
    cons:'저장이 사용자 정책이나 opaque origin 때문에 SecurityError로 거부될 수 있고 quota 초과도 처리해야 한다. localStorage의 read-modify-write에는 locking 보장이 없으며 민감 정보 저장은 노출 범위를 키운다.',
    practice:'versioned key와 schema 검증을 사용하고 JSON parse·SecurityError·QuotaExceededError를 복구 가능한 경계에서 처리한다. 여러 window가 갱신하는 authoritative counter나 서버 상태의 원본으로 사용하지 않는다.',
    incident:'두 window가 같은 localStorage counter를 읽고 각각 증가시킨 뒤 덮어써 값 하나가 사라지는 문제는 locking이 없다는 계약에서 발생한다. 서버의 원자 연산이나 동시성을 지원하는 별도 저장 경계로 이동한다.',
    interview:'Web Storage를 origin별 문자열 저장 API로 정의한 뒤 localStorage와 sessionStorage의 수명·공유 범위, quota·정책 예외, 다른 window의 storage event와 locking 부재를 차례로 설명한다.',
    related:['Origin','Storage Event','QuotaExceededError','Cookie'],
    aliases:['LocalStorage','localStorage','SessionStorage','sessionStorage','Web Storage'],
    comparison:{headers:['기준','localStorage','sessionStorage'],rows:[['저장 영역','origin의 local storage area','origin과 page session의 session storage area'],['window 간 범위','같은 origin의 공유 상태','top-level browsing context별 분리'],['주요 수명','현재 session을 넘어 유지 가능','page session에 연결'],['변경 알림','다른 동등한 Window에 storage event','같은 session storage 범위에 event']]},
    tails:['localStorage와 sessionStorage의 수명과 범위는 어떻게 다른가?','Web Storage가 큰 상태나 빈번한 write에 부적합한 이유는?','저장 schema 변경과 손상된 JSON을 어떻게 안전하게 처리하는가?'],
    tailAnswers:['둘 다 origin 기준이지만 localStorage는 명시적으로 지울 때까지 유지되고 sessionStorage는 top-level browsing context의 page session 동안 유지된다.','Storage 접근과 문자열 직렬화가 main thread에서 동기식으로 수행되어 큰 payload나 잦은 write가 입력과 rendering을 막을 수 있다.','versioned key와 schema 검증을 사용하고 JSON parse 실패나 quota 예외 시 해당 사본만 제거한 뒤 기본 상태로 복구한다.'],
    reviewStatus:'reviewed',reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'definition-internals-comparison-practice-followups',
    sources:[{title:'WHATWG HTML Living Standard: Web storage',url:'https://html.spec.whatwg.org/multipage/webstorage.html',checkedAt:'2026-08-25',version:'Living Standard',sourceScope:'direct'}]
  });
  Object.values(curriculum).forEach(chapter=>chapter.sections.forEach(section=>section.concepts.forEach(concept=>{
    concept.reviewStatus=concept.reviewStatus||'draft';
    if(concept.reviewStatus==='reviewed'){
      const evidence=reviewedConceptEvidence[concept.title];
      if(!evidence||concept.reviewedAt!==evidence.reviewedAt||concept.reviewerId!==evidence.reviewerId||concept.reviewRevision!==evidence.reviewRevision||concept.claimScope!==evidence.claimScope){
        throw new Error(`검수 개념 provenance 불일치: ${concept.title}`);
      }
      if(!concept.sources?.length||concept.sources.some(source=>source.sourceScope!=='direct'||source.checkedAt!==concept.reviewedAt)){
        throw new Error(`검수 개념 직접 출처 불일치: ${concept.title}`);
      }
    }
  })));
  Object.values(curriculum).forEach(chapter=>chapter.sections.forEach(section=>section.concepts.forEach((concept,index)=>{
    if(concept.comparison) return;
    const peer=section.concepts[(index+1)%section.concepts.length];
    concept.comparison={headers:['기준',concept.title,peer.title],rows:[['핵심 책임',concept.summary,peer.summary],['적합한 상황',concept.practice,peer.practice],['주의할 비용',concept.cons,peer.cons]]};
  })));
  quality.push(
    {id:'quality-db-btree-descent',category:'Database',difficulty:'medium',type:'concept',question:'PostgreSQL B-tree index에서 equality lookup이 leaf tuple까지 도달하는 과정을 가장 정확히 설명한 것은?',options:['internal page의 separator key와 비교해 child downlink를 선택하고 leaf에서 index key와 heap TID를 확인한다','heap 전체를 순차 scan한 뒤 일치 row만 모아 임시 B-tree를 매번 만든다','WAL record를 역순으로 읽어 가장 최근 key를 찾고 snapshot을 무시한다','query planner가 SQL 문자열을 정렬한 뒤 같은 글자 위치의 data page를 직접 연다'],answer:0,explanation:'B-tree 탐색은 정렬된 separator key 비교로 downlink를 선택해 leaf까지 내려간다.',optionReasons:['정답: internal page의 경로 선택과 leaf tuple의 역할을 모두 설명한다.','index lookup은 매번 heap 전체 scan이나 임시 tree 생성을 요구하지 않는다.','WAL은 crash recovery를 위한 기록이며 index 탐색 경로가 아니다.','planner는 실행 경로를 선택하지만 SQL 문자 위치로 data page를 찾지 않는다.'],practicalUse:'EXPLAIN (ANALYZE, BUFFERS)의 Index Cond와 heap fetch를 함께 확인한다.',interviewAnswer:bTree.interview,tags:['B-Tree','Index Page','Heap TID'],relatedTopics:['Query Planner','EXPLAIN','Composite Index'],followUpQuestions:bTree.tails,tailAnswers:bTree.tailAnswers,sources:bTree.sources},
    {id:'quality-db-btree-write-cost',category:'Database',difficulty:'hard',type:'troubleshooting',question:'랜덤 key insert가 급증한 뒤 B-tree index 크기와 write latency가 함께 증가했다. 가장 먼저 검증할 설명은?',options:['가득 찬 page의 split과 index 유지 write가 늘었는지 index size·I/O·latency를 변경 전후 비교한다','B-tree는 write 때 정렬을 유지하지 않으므로 network DNS cache만 비우면 회복된다','모든 B-tree leaf가 단일 page이므로 CPU core를 하나로 제한하면 split이 사라진다','SELECT query가 존재하면 PostgreSQL이 index tuple을 영구 복제하므로 read를 모두 차단한다'],answer:0,explanation:'높은 insert 비율과 랜덤 분포는 page split과 index write 비용을 키울 수 있으므로 관측치로 확인한다.',optionReasons:['정답: 현상과 직접 연결된 B-tree write 경로를 가역적으로 검증한다.','DNS cache는 local index page split 원인이 아니다.','B-tree는 여러 page로 구성되며 CPU 제한이 split을 제거하지 않는다.','일반 SELECT가 index tuple을 영구 복제한다는 설명은 틀렸다.'],practicalUse:'pg_stat, index size, buffer I/O, write latency와 EXPLAIN을 같은 시간축에서 비교한다.',interviewAnswer:'B-tree의 read 장점과 page split·write amplification 비용을 workload로 설명한다.',tags:['B-Tree','Page Split','Write Amplification'],relatedTopics:['Fillfactor','Index Bloat','VACUUM'],followUpQuestions:bTree.tails,tailAnswers:bTree.tailAnswers,sources:bTree.sources},
    {id:'quality-java-servlet-contract',category:'Java & Spring',difficulty:'medium',type:'comparison',question:'Servlet, HttpServlet, Servlet container의 책임을 가장 정확히 구분한 것은?',options:['Servlet은 lifecycle·service 계약, HttpServlet은 HTTP method dispatch, container는 instance·mapping·filter chain·동시 호출을 관리한다','Servlet은 DB transaction만, HttpServlet은 thread pool만, container는 Java compiler만 관리한다','Servlet은 browser DOM을, HttpServlet은 CSS cascade를, container는 CDN cache를 관리한다','세 요소는 이름만 다르고 모두 application마다 socket protocol을 직접 구현한다'],answer:0,explanation:'Servlet API의 계약, HTTP 전용 구현 기반, 실행 container 책임은 서로 다른 계층이다.',optionReasons:['정답: 표준 계약과 HTTP specialization, container lifecycle을 정확히 나눈다.','DB transaction·compiler는 세 요소의 핵심 책임 구분이 아니다.','DOM·CSS·CDN은 browser와 edge 계층의 책임이다.','Servlet container가 protocol과 lifecycle infrastructure를 제공하므로 application이 모두 직접 구현하지 않는다.'],practicalUse:'mapping→filter chain→service 흐름을 integration test와 request trace로 검증한다.',interviewAnswer:servlet.interview,tags:['Servlet','HttpServlet','Servlet Container'],relatedTopics:['Filter Chain','Servlet Lifecycle','Thread Safety'],followUpQuestions:servlet.tails,tailAnswers:servlet.tailAnswers,sources:servlet.sources},
    {id:'quality-java-servlet-concurrency',category:'Java & Spring',difficulty:'hard',type:'troubleshooting',question:'Servlet instance field에 현재 사용자 ID를 저장한 뒤 사용자 간 값이 섞였다. 가장 정확한 원인과 수정은?',options:['같은 instance의 service가 concurrent request에서 호출될 수 있으므로 request 상태를 지역 변수나 request scope로 옮긴다','HttpServlet은 request마다 JVM을 새로 만들기 때문에 static field로 옮겨 JVM 생성을 막는다','filter가 모든 field를 자동 복제하므로 equals만 override하면 사용자 값이 분리된다','destroy가 각 request 전에 호출되므로 destroy 안에서 user ID를 다시 설정한다'],answer:0,explanation:'Servlet의 shared mutable instance field는 concurrent request 사이에서 race와 정보 노출을 만들 수 있다.',optionReasons:['정답: container 동시 호출 계약과 request state scope를 함께 해결한다.','request마다 JVM을 만들지 않으며 static은 공유 범위를 더 넓힌다.','filter가 instance field를 request별로 복제하지 않는다.','destroy는 Servlet 수명 종료 시점의 callback이지 request 초기화 hook이 아니다.'],practicalUse:'동시에 다른 사용자 request를 반복하는 integration test로 값 격리를 검증한다.',interviewAnswer:'Servlet instance의 동시 service 호출 가능성과 shared field 회피를 설명한다.',tags:['Servlet','Concurrency','Request Scope'],relatedTopics:['Thread Safety','Filter Chain','Session'],followUpQuestions:servlet.tails,tailAnswers:servlet.tailAnswers,sources:servlet.sources},
    {id:'quality-web-react-key',category:'Web & React',difficulty:'medium',type:'troubleshooting',question:'정렬 가능한 React 목록에서 항목을 재배치한 뒤 input 값이 다른 행에 붙었다. 가장 적절한 수정은?',options:['배열 index가 아니라 항목의 안정적이고 고유한 ID를 key로 사용한다','모든 key를 매 render마다 새 난수로 만들어 기존 component를 강제 제거한다','key를 DOM의 value attribute와 같게 두고 중복을 허용한다','목록 전체를 setInterval로 다시 그려 reconciliation을 우회한다'],answer:0,explanation:'React는 key로 이전 component identity를 대응시키므로 순서가 변하는 목록에는 안정적 ID가 필요하다.',optionReasons:['정답: data identity와 component identity를 일치시킨다.','매번 바뀌는 key는 모든 state를 잃고 불필요한 remount를 만든다.','형제 사이 key는 고유해야 하며 value와 같은 속성일 필요가 없다.','주기적 전체 render는 identity 문제를 해결하지 않고 비용만 늘린다.'],practicalUse:'삽입·삭제·정렬 test에서 행별 local state가 같은 ID에 남는지 확인한다.',interviewAnswer:'key는 render 성능 표식이 아니라 sibling 목록에서 component identity를 보존하는 단서라고 설명한다.',tags:['React Key','Reconciliation','Component Identity'],relatedTopics:['State','List Rendering'],followUpQuestions:['배열 index를 key로 쓴 목록의 중간에 항목을 삽입하면 기존 component state가 왜 다른 행에 붙을 수 있는가?','매 render마다 새 난수 key를 주는 방법은 index key 문제보다 왜 더 나쁜가?','정렬·삭제가 있는 목록의 key 계약을 UI test에서 어떻게 검증할 수 있는가?'],followUpAnswers:['React는 같은 key를 이전과 같은 component identity로 본다. 중간 삽입 뒤 index가 바뀌면 기존 state와 DOM을 새 데이터 행에 재사용해 input 값이나 focus가 다른 항목으로 이동할 수 있다.','모든 key가 매번 달라져 React가 기존 component를 전부 제거하고 새로 mount한다. local state와 focus를 잃고 effect 재실행과 DOM 교체 비용도 커진다.','안정적인 data ID를 key로 두고 입력값·선택·focus가 있는 상태에서 삽입, 삭제, 역순 정렬을 수행한 뒤 같은 ID의 행에 상태가 남는지 검증한다.'],sources:[{title:'React Documentation: Rendering Lists',url:'https://react.dev/learn/rendering-lists',checkedAt:'2026-08-25',sourceScope:'direct'}]},
    {id:'quality-devops-readiness',category:'DevOps',difficulty:'medium',type:'operation',question:'application 시작 중 dependency 연결이 아직 준비되지 않았지만 process 자체는 정상이다. traffic 차단에 사용할 probe는?',options:['readiness probe를 실패시켜 endpoint에서 제외하고 liveness는 process 회복 불능일 때만 실패시킨다','liveness와 readiness를 항상 같은 조건으로 실패시켜 시작 중 container를 반복 재시작한다','startup 중에는 모든 probe를 제거하고 운영자가 수동으로 traffic을 전환한다','CPU 사용률이 0이 아니면 dependency 상태와 무관하게 readiness를 성공시킨다'],answer:0,explanation:'readiness는 traffic 수신 가능 여부, liveness는 restart가 필요한 생존 상태를 판단한다.',optionReasons:['정답: traffic 제어와 restart 판단 책임을 분리한다.','같은 조건은 정상 startup을 restart loop로 만들 수 있다.','probe 제거는 자동화된 안전 계약을 없앤다.','CPU 사용률만으로 dependency 준비 상태를 증명할 수 없다.'],practicalUse:'startup·dependency 장애·복구 시나리오에서 endpoint 제외와 restart 횟수를 검증한다.',interviewAnswer:'readiness, liveness, startup probe의 실패 효과를 각각 설명한다.',tags:['Readiness Probe','Liveness Probe','Kubernetes'],relatedTopics:['Startup Probe','Rolling Update'],followUpQuestions:['readiness 실패와 liveness 실패는 Pod와 사용자 traffic에 각각 어떤 효과를 내는가?','초기 기동이 긴 application에 startup probe를 두면 liveness 설정과 어떤 관계가 생기는가?','rolling update에서 잘못된 readiness 조건은 어떤 장애를 만들며 무엇으로 검증하는가?'],followUpAnswers:['readiness 실패는 Pod를 Service endpoint에서 제외하지만 container를 재시작하지 않는다. liveness 실패는 kubelet이 container를 재시작하므로 일시적 dependency 장애를 liveness에 넣으면 restart loop가 생길 수 있다.','startup probe가 성공하기 전에는 liveness와 readiness 판정을 미뤄 느린 정상 기동이 liveness 실패로 재시작되는 것을 막는다. startup 성공 뒤에는 각 probe가 본래 책임을 수행한다.','실제로 요청을 처리할 수 없는데 readiness가 성공하면 새 Pod로 traffic이 일찍 들어가 오류가 난다. 배포 중 ready endpoint 수, 5xx, 재시작 수와 rollout 진행 상태를 함께 확인한다.'],sources:[{title:'Kubernetes Documentation: Configure Liveness, Readiness and Startup Probes',url:'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/',checkedAt:'2026-08-25',sourceScope:'direct'}]},
    {id:'quality-ax-rag-latency',category:'AX Scenario',difficulty:'hard',type:'operation',question:'배포 직후 RAG p95가 2초에서 12초로 증가했고 trace에서 generation 시간은 그대로지만 vector query pool wait가 9초다. 가장 안전한 첫 대응은?',options:['rollout을 중단하고 가역적으로 이전본 또는 traffic을 복구한 뒤 pool saturation과 query 지표로 가설을 검증한다','근거 없이 model temperature를 높이고 장애가 자연히 사라질 때까지 기다린다','운영 vector table을 삭제해 pool wait metric을 0으로 만든다','trace를 끄고 timeout을 무제한으로 늘려 사용자 오류만 숨긴다'],answer:0,explanation:'최초 실패 구간은 vector query pool wait이며 먼저 영향 확산을 막고 관측치로 확인한다.',optionReasons:['정답: 가역적 완화와 최초 실패 계층의 증거 확인을 결합한다.','generation 시간은 변하지 않았으므로 temperature는 관측된 병목과 무관하다.','운영 data 삭제는 비가역적이며 원인 검증보다 피해가 크다.','trace 제거와 무제한 timeout은 포화를 악화시키고 원인을 숨긴다.'],practicalUse:'release marker, trace span, pool active/wait, query latency와 error rate를 같은 timeline에서 비교한다.',interviewAnswer:'영향도→최초 실패 span→가역적 완화→지표 검증→root cause 순서로 대응한다.',tags:['RAG Incident','Vector Query','Pool Saturation'],relatedTopics:['Tracing','Rollback','SLO'],followUpQuestions:['주어진 trace에서 generation이 아니라 vector query pool을 최초 실패 계층으로 보는 근거는 무엇인가?','rollback 또는 traffic 전환을 시작할 운영 기준은 어떤 지표로 정해야 하는가?','서비스를 복구한 뒤 pool wait 증가의 root cause를 어떤 순서로 좁히는가?'],followUpAnswers:['generation 시간은 배포 전후 그대로인데 전체 증가분 대부분인 9초가 pool wait span에 나타났다. release marker 직후 같은 변화가 재현되는지와 pool active·queue를 함께 확인하면 근거가 강해진다.','사용자 오류율과 p95·p99 latency가 SLO 또는 사전 정의한 canary 한계를 넘고 새 release와 시간적으로 연관되면 가역적 rollback이나 traffic 전환을 시작한다. 감으로 무제한 대기하지 않는다.','배포 diff와 pool 설정, active·idle·wait queue, connection 보유 시간, vector query latency와 database limit을 같은 timeline에서 비교하고 작은 재현으로 각 가설을 하나씩 반증한다.'],sources:[{title:'Google SRE Workbook: Incident Response',url:'https://sre.google/workbook/incident-response/',checkedAt:'2026-08-25',sourceScope:'direct'}]}
  );

  const reviewedQuestionSources={
    'quality-java-arraylist':[
      {title:'Java SE 21 API: ArrayList',url:'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html',checkedAt:'2026-08-25',sourceScope:'direct'},
      {title:'Java SE 21 API: LinkedList',url:'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedList.html',checkedAt:'2026-08-25',sourceScope:'direct'}
    ],
    'quality-java-hashmap':[{title:'Java SE 21 API: HashMap',url:'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html',checkedAt:'2026-08-25',sourceScope:'direct'}],
    'quality-java-equals':[{title:'Java SE 21 API: Object.equals and hashCode',url:'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html',checkedAt:'2026-08-25',sourceScope:'direct'}],
    'quality-jvm-memory':[{title:'Java Virtual Machine Specification 21: Run-Time Data Areas',url:'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5',checkedAt:'2026-08-25',sourceScope:'direct'}],
    'quality-spring-transaction':[{title:'Spring Framework Reference: Declarative transaction annotations',url:'https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html',checkedAt:'2026-08-25',sourceScope:'direct'}],
    'quality-os-dns':[{title:'RFC 1034: Domain Names - Concepts and Facilities',url:'https://www.rfc-editor.org/rfc/rfc1034.html',checkedAt:'2026-08-25',sourceScope:'direct'}],
    'quality-db-index':[{title:'PostgreSQL Documentation: Indexes',url:'https://www.postgresql.org/docs/current/indexes.html',checkedAt:'2026-08-25',sourceScope:'direct'}],
    'quality-ai-rag':[
      {title:'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',url:'https://arxiv.org/abs/2005.11401',checkedAt:'2026-08-25',sourceScope:'direct'},
      {title:'BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of Information Retrieval Models',url:'https://arxiv.org/abs/2104.08663',checkedAt:'2026-08-25',sourceScope:'direct'}
    ]
  };
  const reviewedQuestionEvidence={
    'quality-java-arraylist':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'01290d8646239c2f18860decaf8df37babb9e1f1b866fa23baf5d6a44aef0879'},
    'quality-java-hashmap':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'65720c23d16d97331077c63291e36d673fbaa098343bf6a7ed80cf2aff2dd964'},
    'quality-java-equals':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'10e1cb150b4581a3a451cde7daf37c2c8a551fc54ae8073dcaacaac3e305ca35'},
    'quality-jvm-memory':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'933a3aa6a1de2a1bb2505575bc8fe1fbcee896b3dfab9a47a864d6247586c6ce'},
    'quality-spring-transaction':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'b71d4c55418d8253c26408c855ed6ee56b82d8a4203c0efc683ddf5914f27721'},
    'quality-os-dns':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'0fbaae835483e0207ab67a244c259edef6c8903dd2af53176631e9885a608203'},
    'quality-db-index':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'9a2ef1d45883c0bea61786373f3213f751e3570095cc54e2c177731c23ae7bdf'},
    'quality-ai-rag':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'2cdedfa6e8a7f89f3e5c9408a6c53aa2764926c6860abdb7765b57aded492a51'},
    'quality-db-btree-descent':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'79b99104c839d41cfa16db8359f056f84102cdfc0b1d970ec01b2a39ed977782'},
    'quality-db-btree-write-cost':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'c341b3edb51a2d24b071466a08c3af0e512e9a52b7a4f2c4a78288ba59fb2fcc'},
    'quality-java-servlet-contract':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'a9cb6a091c498d5e4af42063eb278301ab9d19757e16bbcf730040fbe7930c2b'},
    'quality-java-servlet-concurrency':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'8cbb74a534fd4dee031a9469810f0eb388d02e3722c841392491b5b65c95567f'},
    'quality-web-react-key':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'91482a22c55fa12fc6b212e4b26bd2461944ed4794c76948efcdad03d331d5c2'},
    'quality-devops-readiness':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'19f37e3b1091da73c5618040423d0d61a7265beaad99fd5e23096621f48d3704'},
    'quality-ax-rag-latency':{reviewedAt:'2026-08-25',reviewerId:'atlas-source-review',reviewRevision:'education-v1',claimScope:'stem-options-answer-feedback-practice-interview-followups-sources',contentSha256:'33ac840862c489fab5af8f19e96ec6adfc2b62db8af04ab432eab6e43fb4b2d1'}
  };
  const sourceQuestionCount=Array.isArray(window.QUESTION_BANK)?window.QUESTION_BANK.length:0;
  const reviewedBank=quality.map((item,itemIndex)=>{
    if(!Array.isArray(item.options)||item.options.length!==4||!Array.isArray(item.optionReasons)||item.optionReasons.length!==4) throw new Error(`검수 문항 형식 오류: ${item.id}`);
    const evidence=reviewedQuestionEvidence[item.id];
    if(!evidence) throw new Error(`검수 문항 evidence 누락: ${item.id}`);
    const relatedTopics=item.relatedTopics||[];
    const followUpQuestions=item.followUpQuestions||[];
    const followUpAnswers=(item.followUpAnswers||item.tailAnswers||[]).slice(0,followUpQuestions.length);
    if(!followUpQuestions.length||followUpAnswers.length!==followUpQuestions.length){
      throw new Error(`검수 문항 꼬리질문·답안 계약 누락: ${item.id}`);
    }
    const shift=itemIndex%item.options.length;
    const rotate=values=>values.map((_,index)=>values[(index-shift+values.length)%values.length]);
    const sources=item.sources||reviewedQuestionSources[item.id]||[];
    if(!sources.length||sources.some(source=>source.checkedAt!==evidence.reviewedAt||source.sourceScope!=='direct'||!source.url?.startsWith('https://'))){
      throw new Error(`검수 문항 직접 출처 불일치: ${item.id}`);
    }
    const practicalScenario=item.practicalScenario||item.practicalUse;
    const interviewPoint=item.interviewPoint||item.interviewAnswer;
    if(!practicalScenario||!interviewPoint) throw new Error(`검수 문항 실무·면접 계약 누락: ${item.id}`);
    return {
      ...item,options:rotate(item.options),optionReasons:rotate(item.optionReasons),answer:(item.answer+shift)%item.options.length,
      q:item.question,level:item.difficulty,
      hint:item.hint||'관측된 조건, 내부 동작과 실패 경계를 먼저 구분하세요.',
      points:item.points||[...(item.tags||[]).slice(0,3)],
      whyExplanation:item.whyExplanation||item.explanation,
      follow:item.follow||followUpQuestions[0]||'선택의 효과를 어떤 관측 지표로 반증할 수 있는가?',
      followUpQuestions,followUpAnswers,
      practicalScenario,interviewPoint,
      practicalUse:practicalScenario,
      interviewAnswer:interviewPoint,
      prerequisites:item.prerequisites||[],nextTopics:item.nextTopics||relatedTopics,
      objectiveId:item.objectiveId||`${item.id}:objective`,conceptId:item.conceptId||(item.tags?.[0]||item.id),itemFamilyId:item.itemFamilyId||item.id,
      reviewStatus:'reviewed',reviewedAt:evidence.reviewedAt,reviewerId:evidence.reviewerId,reviewRevision:evidence.reviewRevision,claimScope:evidence.claimScope,sources,
      metadata:{level:'backend-interview',skill:item.category,topic:item.tags?.[0]||item.category,source:'direct-source-reviewed',reviewStatus:'reviewed',reviewerId:evidence.reviewerId,reviewRevision:evidence.reviewRevision,claimScope:evidence.claimScope}
    };
  });
  if(Object.keys(reviewedQuestionEvidence).length!==reviewedBank.length) throw new Error('검수 문항 evidence와 공개 문항 수가 일치하지 않습니다.');
  window.QUESTION_BANK=reviewedBank;
  window.QUESTION_BANK_QUALITY_CONTRACT={mode:'reviewed-only',version:'2026-08-25',sourceQuestionCount,publicQuestionCount:reviewedBank.length,excludedUnreviewedCount:Math.max(0,sourceQuestionCount-reviewedBank.length)};
  window.EDUCATION_REVIEW_MANIFEST={algorithm:'sha256',canonicalization:'stable-json-v1',schemaVersion:1,questions:reviewedQuestionEvidence,concepts:reviewedConceptEvidence};
  window.ATLAS_CURRICULUM=curriculum;
  const normalizeSearchTerm=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
  const tokenizeSearchTerm=value=>normalizeSearchTerm(value).match(/[\p{L}\p{N}+#.@/-]+/gu)||[];
  const containsTokenSequence=(source,target)=>target.length>0&&source.some((_,index)=>target.every((token,offset)=>source[index+offset]===token));
  const matchRank=(query,term)=>{
    const normalizedQuery=normalizeSearchTerm(query), normalizedTerm=normalizeSearchTerm(term);
    if(!normalizedQuery||!normalizedTerm) return 0;
    if(normalizedQuery===normalizedTerm) return 4;
    const queryTokens=tokenizeSearchTerm(normalizedQuery), termTokens=tokenizeSearchTerm(normalizedTerm);
    if(containsTokenSequence(queryTokens,termTokens)) return 3;
    if(containsTokenSequence(termTokens,queryTokens)) return 2;
    if(queryTokens.length===termTokens.length&&queryTokens.every((token,index)=>token.length>=3&&termTokens[index].startsWith(token))) return 1;
    return 0;
  };
  window.findCurriculumConcept=query=>{
    let best=null;
    for(const [category,chapter] of Object.entries(curriculum)) for(const section of chapter.sections) for(const concept of section.concepts){
      const rank=Math.max(matchRank(query,concept.title),...(concept.aliases||[]).map(alias=>matchRank(query,alias)));
      if(rank>(best?.rank||0)) best={rank,value:{category,section:section.title,...concept}};
    }
    return best?.value||null;
  };
})();
