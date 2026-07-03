(function buildCurriculum(){
  const make=(title,summary,detail={})=>({
    title,summary,
    definition:detail.definition||`${title}은(는) ${summary}`,
    why:detail.why||'구현 선택의 비용과 실패 조건을 예측하고 운영 중 원인을 빠르게 좁히기 위해 필요합니다.',
    internals:detail.internals||'입력, 상태 변화, 출력과 실패 경계를 순서대로 추적하면 내부 동작을 설명할 수 있습니다.',
    pros:detail.pros||'문제에 맞게 적용하면 코드의 의도와 운영 기준이 명확해집니다.',
    cons:detail.cons||'제약을 확인하지 않고 적용하면 복잡성과 유지 비용이 증가합니다.',
    practice:detail.practice||'실무에서는 요구사항을 먼저 수치화하고 대안과 비교한 뒤 지표로 효과를 검증합니다.',
    incident:detail.incident||`${title}의 용량·시간·동시성 경계를 측정하지 않으면 정상적인 부분 실패가 전체 지연이나 데이터 오류로 전파될 수 있습니다.`,
    interview:detail.interview||`${title}의 정의보다 해결하는 문제, 내부 원리, trade-off와 실제 적용 결과 순서로 답합니다.`,
    related:detail.related||[], comparison:detail.comparison||null,
    tails:detail.tails||[`왜 ${title}이(가) 필요한가?`,`${title}의 대표적인 trade-off는?`,`${title} 적용 여부를 어떤 지표로 검증할까?`]
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
      {title:'Browser',summary:'렌더링과 비동기 실행',concepts:['Browser Rendering','Event Loop','PWA','WebView','Mobile UX'].map(x=>make(x,`${x}의 사용자 체감 성능과 실행 경로를 이해한다.`,{related:['DOM','Service Worker','Accessibility']}))},
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
  const rich=(title,summary,related=[])=>make(title,summary,{definition:summary,internals:`${title}의 입력·상태 변화·출력과 실패 경계를 순서대로 추적한다. 구현 세부보다 불변식과 시간·공간 비용을 먼저 확인한다.`,why:`${title}을(를) 구분해야 설계 대안과 장애 원인을 같은 언어로 설명할 수 있다.`,pros:`문제에 맞게 적용하면 책임과 성능 특성이 명확해진다.`,cons:`제약을 무시하면 복잡도·메모리·동시성 비용이 예상보다 커질 수 있다.`,practice:`실무에서는 workload와 실패 조건을 먼저 측정하고 ${title} 적용 전후 지표를 비교한다.`,incident:`용량 또는 동시성 경계를 넘었을 때 ${title}의 숨은 비용이 병목으로 나타난 사례를 trace와 profile로 검증한다.`,interview:`“${summary}”라고 정의하고 내부 동작, 복잡도, 대안과 실무 선택 기준까지 설명한다.`,related});
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
    {id:'quality-java-arraylist',category:'Java & Spring',difficulty:'easy',type:'comparison',question:'조회가 많고 끝에 데이터가 추가되는 목록에서 ArrayList를 LinkedList보다 우선 검토하는 핵심 이유는?',options:['배열 기반이라 임의 조회가 O(1)이고 연속 메모리 접근의 locality가 좋기 때문이다','노드 연결 구조라 중간 삽입이 항상 O(1)이고 조회도 O(1)이기 때문이다','모든 추가 연산에서 배열 복사가 발생하지 않아 최악 시간도 항상 O(1)이기 때문이다','동기화가 기본 제공되어 여러 스레드가 별도 제어 없이 수정할 수 있기 때문이다'],answer:0,explanation:'ArrayList의 임의 조회는 O(1)이며 cache locality가 유리합니다. 끝 추가는 resize 시 O(n)이지만 상각 O(1)입니다.',optionReasons:['정답: 배열 index 접근과 locality를 정확히 설명한다.','LinkedList도 위치 탐색이 필요하고 임의 조회는 O(n)이다.','resize는 가끔 발생하며 최악 시간은 O(n)이다.','ArrayList는 기본적으로 thread-safe하지 않다.'],practicalUse:'대부분의 일반적인 조회 중심 List 구현은 ArrayList를 기본 선택으로 둡니다.',interviewAnswer:'ArrayList는 조회 O(1)과 locality가 장점이고, LinkedList는 노드 탐색과 메모리 overhead 때문에 중간 삽입이 많아도 항상 유리하지 않습니다.',tags:['ArrayList','LinkedList','List'],relatedTopics:['Random Access','시간복잡도','Cache Locality']},
    {id:'quality-java-hashmap',category:'Java & Spring',difficulty:'medium',type:'concept',question:'HashMap에서 get(key)가 올바른 값을 찾는 과정을 가장 정확히 설명한 것은?',options:['hashCode를 가공해 bucket을 찾고 후보 key를 hash와 equals로 비교한다','equals만 전체 entry에 순차 적용하고 hashCode는 resize 때만 사용한다','객체 주소를 정렬한 B-Tree를 탐색하고 compareTo로 동일성을 확인한다','key의 toString 결과를 정렬해 이진 탐색하고 충돌 시 마지막 값을 반환한다'],answer:0,explanation:'HashMap은 hash로 bucket 범위를 좁힌 뒤 equals로 논리적 동일성을 확인합니다.',optionReasons:['정답: bucket 선택과 최종 동일성 판별 순서다.','전체 순차 탐색이 아니며 hashCode는 조회에도 사용된다.','HashMap 기본 구조는 B-Tree가 아니다.','toString은 key 계약에 사용되지 않는다.'],practicalUse:'key는 저장 중 hashCode가 바뀌지 않는 불변 객체가 안전합니다.',interviewAnswer:'평균 O(1)이지만 hash 분포가 나쁘면 충돌이 늘고, Java 8은 충돌 임계치를 넘은 bucket을 tree 구조로 전환할 수 있습니다.',tags:['HashMap','hashCode','equals'],relatedTopics:['Hash 충돌','Tree Bin','Load Factor']},
    {id:'quality-java-equals',category:'Java & Spring',difficulty:'medium',type:'troubleshooting',question:'HashSet에 넣은 객체의 필드를 변경한 뒤 contains가 false가 되는 가장 가능성 높은 원인은?',options:['equals/hashCode에 사용된 가변 필드가 바뀌어 조회 bucket이 달라졌기 때문이다','HashSet이 조회할 때 객체를 직렬화해 원본 필드를 제거했기 때문이다','GC가 Set 내부 객체를 이동시키면 모든 hashCode가 자동으로 무효화되기 때문이다','contains가 reference equality만 사용하므로 새 객체는 항상 찾을 수 없기 때문이다'],answer:0,explanation:'저장 후 key의 hash가 바뀌면 원래 bucket에 있는데 다른 bucket을 조회하게 됩니다.',optionReasons:['정답: mutable key가 hash collection 계약을 깨뜨린다.','HashSet 조회는 직렬화를 수행하지 않는다.','객체 이동은 논리 hashCode 무효화 원인이 아니다.','HashSet은 hashCode와 equals를 사용한다.'],practicalUse:'식별자와 key 객체는 불변으로 설계합니다.',interviewAnswer:'equals가 true인 두 객체는 반드시 같은 hashCode를 가져야 하며, collection에 저장된 동안 계약 필드를 바꾸면 안 됩니다.',tags:['equals','hashCode','HashSet'],relatedTopics:['Immutable Key','Object Identity']},
    {id:'quality-jvm-memory',category:'Java & Spring',difficulty:'easy',type:'concept',question:'JVM 메모리 영역과 저장 대상의 연결로 가장 적절한 것은?',options:['각 스레드 Stack에는 호출 frame이, 공유 Heap에는 객체와 배열이 주로 저장된다','공유 Stack에는 모든 객체가, 스레드별 Heap에는 지역변수가 저장된다','Method Area에는 HTTP session만, Heap에는 bytecode만 저장된다','PC Register에는 전체 객체 graph가, Stack에는 class metadata가 저장된다'],answer:0,explanation:'Stack은 스레드별 호출 상태, Heap은 공유 객체 저장 영역입니다.',optionReasons:['정답: 대표적인 메모리 책임을 올바르게 연결한다.','Stack과 Heap의 공유 범위가 반대다.','Method Area와 Heap의 역할이 틀렸다.','PC register와 Stack의 역할이 틀렸다.'],practicalUse:'StackOverflowError, Java heap space, Metaspace OOM을 서로 다른 원인으로 진단합니다.',interviewAnswer:'스레드마다 PC와 Stack이 있고 Heap과 Method Area는 공유됩니다. 객체 생명주기와 GC 대상은 주로 Heap에서 관리됩니다.',tags:['JVM','Stack','Heap'],relatedTopics:['Method Area','GC','Thread']},
    {id:'quality-spring-transaction',category:'Java & Spring',difficulty:'hard',type:'troubleshooting',question:'@Transactional 메서드 안에서 같은 객체의 다른 @Transactional 메서드를 this로 호출했을 때 새 전파 옵션이 적용되지 않은 이유는?',options:['내부 호출이 Spring proxy를 거치지 않아 transaction interceptor가 실행되지 않았기 때문이다','두 annotation의 isolation이 같으면 JVM이 두 번째 annotation을 compile 단계에서 제거하기 때문이다','EntityManager가 존재하면 propagation 설정은 항상 무시되도록 JPA가 정의하기 때문이다','REQUIRES_NEW는 외부 HTTP 요청에서만 허용되고 Java method 호출에는 적용되지 않기 때문이다'],answer:0,explanation:'기본 proxy AOP는 proxy를 통과하는 외부 호출에 적용됩니다.',optionReasons:['정답: self-invocation의 proxy 우회 문제다.','JVM이 annotation을 조건부 제거하지 않는다.','JPA가 Spring propagation을 무시하도록 정의하지 않는다.','REQUIRES_NEW는 method transaction 전파 옵션이다.'],practicalUse:'transaction 책임을 별도 Bean으로 분리하고 통합 테스트로 실제 경계를 확인합니다.',interviewAnswer:'@Transactional은 proxy 기반이므로 self-invocation은 advice를 우회합니다. 별도 Bean 경계로 분리하는 방법이 가장 명확합니다.',tags:['Spring','Transaction','AOP'],relatedTopics:['Proxy','Self Invocation','Propagation']},
    {id:'quality-os-dns',category:'OS & Network',difficulty:'medium',type:'concept',question:'DNS recursive resolver의 핵심 역할은?',options:['클라이언트 대신 계층적 DNS 서버를 조회하고 TTL 동안 결과를 캐시한다','특정 zone의 authoritative record 원본을 소유하고 변경을 영구 저장한다','TCP 연결 상태를 유지하며 HTTP 요청을 application server로 분배한다','CDN edge에서 정적 resource를 원본 대신 저장하고 응답한다'],answer:0,explanation:'recursive resolver는 client를 대신해 root, TLD, authoritative 계층을 조회하고 cache합니다.',optionReasons:['정답: 재귀 resolver의 조회와 cache 책임이다.','authoritative server의 책임이다.','L4/L7 load balancer의 책임이다.','CDN edge cache의 책임이다.'],practicalUse:'TTL은 변경 전파 속도와 resolver 부하 사이의 trade-off입니다.',interviewAnswer:'resolver와 authoritative server를 구분하고 cache TTL이 장애와 전환에 미치는 영향까지 설명합니다.',tags:['DNS','Resolver','TTL'],relatedTopics:['Authoritative DNS','CDN','Load Balancing']},
    {id:'quality-db-index',category:'Database',difficulty:'medium',type:'tradeoff',question:'읽기 성능을 위해 인덱스를 추가하기 전 가장 적절한 판단은?',options:['실제 query 조건·선택도·정렬과 write 비율을 확인하고 실행 계획으로 검증한다','WHERE에 등장한 모든 column에 단일 index를 만들면 planner가 항상 최적 조합을 선택한다','index는 저장 공간만 사용하고 INSERT/UPDATE 비용에는 영향을 주지 않는다','cardinality가 가장 낮은 boolean column을 단독 index로 만들면 모든 query가 빨라진다'],answer:0,explanation:'인덱스 효과는 workload와 데이터 분포에 달려 있으며 실행 계획으로 검증해야 합니다.',optionReasons:['정답: 실제 workload와 비용을 함께 본다.','index가 많다고 항상 결합 사용되는 것은 아니다.','index 유지로 write 비용이 증가한다.','낮은 선택도의 단독 index는 효과가 제한적이다.'],practicalUse:'EXPLAIN ANALYZE와 buffer 사용량을 변경 전후 비교합니다.',interviewAnswer:'인덱스는 읽기와 쓰기 trade-off이며 복합 index 순서는 equality, range, sort 패턴을 함께 고려합니다.',tags:['Index','Query Planner','B-Tree'],relatedTopics:['Cardinality','EXPLAIN','Composite Index']},
    {id:'quality-ai-rag',category:'AI & Design',difficulty:'hard',type:'troubleshooting',question:'RAG 답변 정확도가 낮고 retrieval top-20에는 정답 문서가 있지만 top-3에는 거의 없을 때 우선할 개선은?',options:['후보 recall을 유지한 채 reranker로 질의-문서 관련성 순서를 재평가하고 MRR을 측정한다','generation temperature만 높여 모델이 더 다양한 문장을 생성하게 한다','embedding index를 제거하고 최신 문서 세 개를 항상 고정 context로 제공한다','검색 실패를 숨기기 위해 답변의 출처 표시를 제거하고 token 수를 늘린다'],answer:0,explanation:'정답 후보는 존재하지만 순위가 낮으므로 ranking 단계가 병목입니다.',optionReasons:['정답: 관측된 병목에 맞춘 개선과 평가다.','temperature는 검색 순위를 개선하지 않는다.','고정 context는 질의 관련성을 보장하지 않는다.','출처 제거와 token 증가는 품질 원인을 해결하지 않는다.'],practicalUse:'retrieval recall@k와 reranking MRR/nDCG를 generation 평가와 분리합니다.',interviewAnswer:'RAG는 retrieval, ranking, generation을 분리 계측하고 가장 먼저 실패한 단계를 고칩니다.',tags:['RAG','Reranking','Evaluation'],relatedTopics:['Embedding','MRR','nDCG']}
  ];
  const domainDepth={
    'OS & Network':{why:'CPU·메모리·소켓은 유한하며 부분 실패와 경쟁 상태가 애플리케이션 지연으로 나타나므로 실행 계층을 이해해야 합니다.',internals:'kernel scheduler, memory hierarchy, protocol state machine과 queue를 따라 입력이 어떤 상태 전이를 거치는지 확인합니다.',pros:'격리와 표준 protocol 경계를 통해 서로 다른 실행 주체를 안전하게 연결합니다.',cons:'context switch, lock contention, buffering, retransmission과 timeout 비용이 생깁니다.',practice:'thread dump, socket 상태, retransmission, connection pool과 p95/p99를 같은 시간축에서 비교합니다.',incident:'timeout 없는 외부 호출이 worker와 connection pool을 점유해 정상 endpoint까지 연쇄적으로 지연시킨 사례를 분석합니다.'},
    'Database':{why:'동시 요청에서도 업무 불변식을 지키면서 데이터가 증가해도 예측 가능한 query 성능을 유지해야 합니다.',internals:'page·index·planner·snapshot·WAL·lock의 순서로 read/write가 저장되고 가시화되는 과정을 추적합니다.',pros:'transaction, declarative query와 crash recovery로 중요한 상태를 일관되게 관리합니다.',cons:'index write amplification, lock wait, bloat, stale statistics와 schema migration 비용이 있습니다.',practice:'EXPLAIN ANALYZE의 estimate/actual row, buffer, lock wait와 transaction 시간을 변경 전후 비교합니다.',incident:'오래된 통계와 unbounded query가 잘못된 join plan을 선택해 connection pool을 고갈시킨 사례를 진단합니다.'},
    'Web & React':{why:'사용자가 느끼는 응답성은 API뿐 아니라 browser main thread, render, state와 network cache의 합으로 결정됩니다.',internals:'network fetch → event loop → state update → reconciliation → DOM/style/layout/paint 흐름과 비동기 task queue를 추적합니다.',pros:'컴포넌트와 선언적 상태로 복잡한 화면을 예측 가능한 단위로 나눕니다.',cons:'불필요한 render, stale state, 큰 bundle과 main-thread blocking이 모바일 체감 성능을 악화시킵니다.',practice:'Web Vitals, resource timing, JS error와 사용자 동작을 release·trace에 연결합니다.',incident:'대량 목록을 한 번에 DOM에 렌더링해 저사양 모바일 main thread가 멈춘 사례를 virtualization과 결과 제한으로 해결합니다.'},
    'DevOps':{why:'모든 변경은 실패할 수 있으므로 artifact부터 배포·관측·rollback까지 재현 가능한 계약이 필요합니다.',internals:'source → immutable artifact → runtime desired state → health signal → rollout decision의 control loop로 동작을 이해합니다.',pros:'환경 차이를 줄이고 작고 반복 가능한 변경과 빠른 복구를 가능하게 합니다.',cons:'자동화 오류의 blast radius, platform 복잡성, telemetry 저장 비용이 커질 수 있습니다.',practice:'배포 전후 error rate·latency·saturation을 비교하고 canary 중단 및 rollback 기준을 명시합니다.',incident:'부정확한 readiness probe가 준비되지 않은 instance에 traffic을 보내 오류가 급증한 사례에서 probe 책임을 분리합니다.'},
    'AI & Design':{why:'LLM은 확률적이고 외부 데이터·권한을 스스로 검증하지 못하므로 근거·정책·평가 경계가 필요합니다.',internals:'intent → retrieval/tool selection → policy → model inference → evidence validation → action/approval 단계를 각각 계측합니다.',pros:'비정형 지식 탐색과 자연어 기반 복합 업무 자동화를 가능하게 합니다.',cons:'환각, prompt injection, 비결정성, token 비용, 지연과 평가 dataset 유지 비용이 있습니다.',practice:'retrieval recall, ranking MRR, faithfulness, tool success, token cost와 end-to-end latency를 분리 측정합니다.',incident:'검색 문서의 prompt injection이 고권한 tool 호출로 이어질 뻔한 사례를 입력 격리·allowlist·승인 gate로 차단합니다.'},
    'AX Scenario':{why:'실제 장애는 여러 계층을 넘으므로 불완전한 정보에서 가장 안전한 다음 행동을 선택하는 훈련이 필요합니다.',internals:'영향도 → timeline → 가설 → 반증 evidence → 가역적 완화 → 검증 → root cause와 재발 방지 순서로 진행합니다.',pros:'개인의 직감 대신 재현 가능한 evidence와 복구 기준으로 협업할 수 있습니다.',cons:'관측 신호가 부족하거나 runbook이 의례화되면 잘못된 확신과 대응 지연이 생깁니다.',practice:'로그·metric·trace를 correlation id와 배포 시점으로 정렬하고 각 조치의 성공 지표를 기록합니다.',incident:'RAG 12초 지연을 모델 문제로 추정했지만 trace에서 vector query pool wait가 원인임을 확인한 사례처럼 가설을 evidence로 검증합니다.'}
  };
  Object.entries(curriculum).forEach(([category,chapter])=>chapter.sections.forEach(section=>section.concepts.forEach(concept=>{
    const depth=domainDepth[category]; if(!depth) return;
    Object.entries(depth).forEach(([key,value])=>concept[key]=`${concept.title}: ${value}`);
  })));
  Object.values(curriculum).forEach(chapter=>chapter.sections.forEach(section=>section.concepts.forEach((concept,index)=>{
    if(concept.comparison) return;
    const peer=section.concepts[(index+1)%section.concepts.length];
    concept.comparison={headers:['기준',concept.title,peer.title],rows:[['핵심 책임',concept.summary,peer.summary],['적합한 상황',concept.practice,peer.practice],['주의할 비용',concept.cons,peer.cons]]};
  })));
  const typeCycle=['concept','comparison','troubleshooting','design','tradeoff','interview','code','operation'];
  Object.entries(curriculum).forEach(([category,chapter])=>chapter.sections.forEach((section,sectionIndex)=>section.concepts.forEach((concept,conceptIndex)=>{
    if(quality.some(q=>(q.tags||[]).includes(concept.title))) return;
    const peers=section.concepts.filter(x=>x!==concept);
    const distractors=[0,1,2].map(offset=>peers[(conceptIndex+offset)%peers.length]?.definition||chapter.sections[(sectionIndex+1)%chapter.sections.length].concepts[offset].definition);
    const answer=(conceptIndex+sectionIndex)%4;
    const options=[...distractors]; options.splice(answer,0,concept.definition);
    quality.push({id:`curriculum-${category.toLowerCase().replace(/[^a-z]+/g,'-')}-${sectionIndex}-${conceptIndex}`,category,difficulty:conceptIndex%4===0?'easy':conceptIndex%4===3?'hard':'medium',type:typeCycle[(conceptIndex+sectionIndex)%typeCycle.length],question:`${concept.title}을(를) 같은 분야의 인접 개념과 구분해 가장 정확히 설명한 것은?`,options,answer,explanation:concept.definition,optionReasons:options.map((option,i)=>i===answer?`정답: ${concept.title}의 책임과 동작을 정확히 설명합니다.`:`오답: 같은 ${section.title} 영역의 관련 설명이지만 ${concept.title}이 아니라 다른 인접 개념의 책임입니다.`),practicalUse:concept.practice,interviewAnswer:concept.interview,tags:[concept.title,...concept.related],relatedTopics:concept.related,whyExplanation:concept.why,followUpQuestions:concept.tails});
  })));
  const normalized=window.QUESTION_BANK.map((q,i)=>({
    ...q,type:q.type||typeCycle[i%typeCycle.length],
    optionReasons:q.optionReasons||q.options.map((option,index)=>index===q.answer?'정답: 핵심 조건과 원리를 가장 정확하게 충족합니다.':`오답: ${option}은(는) 일부 관련 맥락은 있지만 질문의 핵심 조건이나 책임 경계를 충족하지 못합니다.`),
    practicalUse:q.practicalUse||q.practicalScenario||`${q.category} 실무에서는 적용 전후 지표와 실패 조건을 함께 정의합니다.`,
    interviewAnswer:q.interviewAnswer||q.interviewPoint||'정의, 내부 원리, 선택 기준, trade-off, 실무 사례 순서로 답합니다.'
  }));
  quality.forEach(item=>{
    const index=normalized.findIndex(q=>q.category===item.category&&String(q.id).startsWith('los-'));
    if(index>=0) normalized[index]={...normalized[index],...item,q:item.question,level:item.difficulty,hint:'정의뿐 아니라 내부 구조와 trade-off를 비교하세요.',points:[...(item.tags||[]).slice(0,3)],whyExplanation:item.whyExplanation||item.explanation,follow:item.followUpQuestions?.[0]||`${item.relatedTopics[0]}와 연결하면 어떤 trade-off가 생기는가?`,followUpQuestions:item.followUpQuestions||item.relatedTopics.map(x=>`${x}와 연결하면 어떤 trade-off가 생기는가?`),metadata:{...normalized[index].metadata,importance:'critical',interviewFrequency:'very-high'}};
  });
  window.QUESTION_BANK=normalized;
  window.ATLAS_CURRICULUM=curriculum;
  window.findCurriculumConcept=query=>{
    const needle=String(query||'').toLowerCase();
    for(const [category,chapter] of Object.entries(curriculum)) for(const section of chapter.sections) for(const concept of section.concepts){
      if(concept.title.toLowerCase().includes(needle)||needle.includes(concept.title.toLowerCase())) return {category,section:section.title,...concept};
    }
    return null;
  };
})();
