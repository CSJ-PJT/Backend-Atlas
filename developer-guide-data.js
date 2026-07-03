(function buildDeveloperGuide(){
  window.ATLAS_REFERENCES={
    'Java & Spring':[
      {title:'Oracle Java Collections API',url:'https://docs.oracle.com/en/java/javase/24/docs/api/java.base/java/util/package-summary.html'},
      {title:'Oracle Stream API',url:'https://docs.oracle.com/en/java/javase/24/docs/api/java.base/java/util/stream/package-summary.html'},
      {title:'MangKyu CS Interview 1-3, 7-8',url:'https://mangkyu.tistory.com/88'},
      {title:'Spring Framework Core',url:'https://docs.spring.io/spring-framework/reference/core.html'},
      {title:'Spring Transaction',url:'https://docs.spring.io/spring-framework/reference/data-access/transaction.html'}],
    'Database':[
      {title:'PostgreSQL MVCC',url:'https://www.postgresql.org/docs/current/mvcc.html'},
      {title:'PostgreSQL Indexes',url:'https://www.postgresql.org/docs/current/indexes.html'},
      {title:'PostgreSQL Query Planning',url:'https://www.postgresql.org/docs/current/using-explain.html'},
      {title:'MangKyu Database Interview 6/8',url:'https://mangkyu.tistory.com/93'},
      {title:'Redis Data Types',url:'https://redis.io/docs/latest/develop/data-types/'}],
    'DevOps':[
      {title:'Docker Concepts',url:'https://docs.docker.com/get-started/docker-concepts/'},
      {title:'Kubernetes Concepts',url:'https://kubernetes.io/docs/concepts/'},
      {title:'OpenTelemetry Signals',url:'https://opentelemetry.io/docs/concepts/signals/'}],
    'AI & Design':[
      {title:'Spring AI API',url:'https://docs.spring.io/spring-ai/reference/api/'},
      {title:'Spring AI Tool Calling',url:'https://docs.spring.io/spring-ai/reference/api/tools.html'},
      {title:'OpenAI Cookbook',url:'https://cookbook.openai.com/'}],
    'OS & Network':[
      {title:'Java Concurrency API',url:'https://docs.oracle.com/en/java/javase/24/docs/api/java.base/java/util/concurrent/package-summary.html'},
      {title:'MangKyu Network & OS Interview 4-5/8',url:'https://mangkyu.tistory.com/91'},
      {title:'Cloudflare Learning Center',url:'https://www.cloudflare.com/learning/'}],
    'Web & React':[
      {title:'MDN Web Docs',url:'https://developer.mozilla.org/docs/Web'},
      {title:'React Learn',url:'https://react.dev/learn'}],
    'AX Scenario':[
      {title:'Google SRE Books',url:'https://sre.google/books/'},
      {title:'OpenTelemetry Concepts',url:'https://opentelemetry.io/docs/concepts/'}]
  };

  const projects={
    'Backend Atlas':{
      github:'https://github.com/CSJ-PJT/Backend-Atlas',
      badge:'Learning Platform',purpose:'AX·Backend 엔지니어가 개념을 연결하고 선택 근거를 설명하도록 돕는 로컬 우선 학습 플랫폼.',
      stack:['HTML5','CSS3','Vanilla JavaScript','JSDOM','Capacitor 8','Android Gradle'],
      directories:[['/','화면·퀴즈·검색 실행 코드'],['assets','브랜드 아이콘'],['scripts','웹 빌드와 JSDOM smoke test'],['android','Capacitor 네이티브 Android shell'],['www','생성되는 WebView bundle(Git 제외)']],
      design:['프레임워크 없이 정적 자산만으로 오프라인 실행','문제 데이터와 커리큘럼·표시 계층 분리','LocalStorage로 학습 기록 유지','Capacitor가 동일 web bundle을 Android WebView에서 실행'],
      flow:['질문/학습 선택','로컬 지식 인덱스','커리큘럼·문제 매칭','Why·비교·연관 개념','LocalStorage 진도 저장'],
      api:'서버 API 없음. 모든 검색과 문제 풀이는 브라우저 내부에서 실행된다.',search:'질문·해설·태그·metadata를 정규화한 메모리 index를 부분 문자열로 검색한다. searchKnowledge 인터페이스를 향후 RAG adapter로 교체할 수 있다.',
      generation:'기본 문제 → 상황 확장 → 5,000개 카테고리 quota → 커리큘럼 품질 문제로 일부 교체 → type·오답 근거 정규화 순서다.',
      rag:'현재 실제 embedding/RAG는 없다. PostgreSQL+pgvector 또는 embedding service를 searchKnowledge 뒤에 연결하는 확장 지점만 제공한다.',
      android:'npm build가 www를 생성하고 cap sync가 Android assets로 복사한다. Gradle assembleDebug가 WebView shell과 web bundle을 APK로 패키징한다.',
      ui:'view 단위 화면, 카드형 curriculum, accordion 상세, 고정 bottom navigation으로 구성된다.',git:'main 기반 단일 제품 저장소. 생성물·환경 파일은 .gitignore로 제외한다.',
      roadmap:['RAG 검색 adapter','문제별 출처 revision 관리','Spaced repetition','서명된 release AAB'],
      diagram:['Operator','Mobile/Web UI','Local Search Index','Curriculum + 5K Questions','Progress Store'],
      sequence:['카테고리 선택','챕터 목록 조회','개념 상세 표시','관련 문제 검색','정답·Why 기록'],
      technologies:['Capacitor','LocalStorage','Knowledge Graph','JSDOM','PWA']
    },
    'Archive Nexus':{
      github:'https://github.com/CSJ-PJT/Archive-Nexus',
      badge:'Manufacturing AX',purpose:'ArchiveOS 위에서 제조 시뮬레이션과 생산·품질·정비·재고·물류 Agent를 실행하는 산업 애플리케이션.',
      stack:['Java 21','Spring Boot 3.5','Spring AI 1.1','Spring Data JPA','PostgreSQL','Flyway','React 19','Vite','Prometheus','Grafana','Docker Compose'],
      directories:[['backend/ai','Orchestrator·Intent Router·전문 Agent'],['backend/archiveos','ArchiveOS status/workflow adapter'],['backend/task','RPA/Task 상태와 실행'],['backend/persistence','시뮬레이터·aggregate 저장'],['frontend/src','운영 dashboard와 AI panel'],['monitoring','Prometheus/Grafana provisioning'],['docs','계약·schema·운영 문서']],
      design:['Domain Service를 Agent가 재사용해 규칙 중복 방지','ArchiveOS 장애를 제조 조회 경로와 격리','PostgreSQL 우선 저장과 snapshot fallback','bounded executor로 Agent 실행 제한','Evidence·CorrelationId 기반 감사 가능성'],
      flow:['Factory Simulator','Domain Service/Repository','Manufacturing Orchestrator','Specialist Agents','Response Composer','ArchiveOS Workflow/Approval','RPA Result Callback'],
      api:'Manufacturing AI, simulator, dashboard, task, scenario, audit, ArchiveOS status REST controller로 분리된다.',
      search:'제조 상태와 실행 이력을 JPA repository의 bounded query로 조회한다.',generation:'Simulator가 tick 기반 제조 데이터를 만들고 projection service가 domain aggregate를 점진적으로 분리한다.',
      rag:'Nexus는 제조 domain 분석을 소유하며 공통 RAG runtime은 ArchiveOS 책임으로 둔다.',android:'Android 앱이 아니라 React 운영 console을 Nginx로 제공한다.',ui:'Overview와 제조 domain 화면, Manufacturing AI, Task Operations panel로 구성된다.',
      git:'기능/수정 branch와 PR 검증 후 main 반영. DB migration은 append-only로 관리한다.',roadmap:['인증·RBAC','Agent 평가 dataset','Kubernetes 배포','원격 Agent 실행 계약'],
      diagram:['Simulator','Domain Services','Manufacturing Orchestrator','Specialist Agents','ArchiveOS Approval','RPA'],
      sequence:['Nexus Event','ArchiveOS Workflow','PM Approval','Nexus Action','Result Callback','ArchiveOS History'],
      technologies:['Spring AI','Multi Agent','PostgreSQL','Prometheus','Grafana','RPA','Workflow']
      ,observability:'Spring Actuator와 Micrometer가 제조·Agent 지표를 노출하고 Prometheus가 수집하며 Grafana provisioned dashboard가 시각화한다.',limitations:'ArchiveOS 원격 실행이 아니라 Nexus 내부 Agent 실행 후 workflow·interaction contract를 기록하는 단계다. 외부 장애는 DEGRADED/UNAVAILABLE로 격리한다.'
    },
    'Archive OS':{
      github:'https://github.com/CSJ-PJT/ArchiveOS',
      badge:'Enterprise AI Runtime',purpose:'Agent·RAG·Batch·Workflow·RPA·승인을 통합 관제하는 공통 AX 실행 플랫폼.',
      stack:['React 18','TypeScript','Vite','Node.js','Express','Java 21','Spring Boot 3.3','Spring AI','Spring Batch','Spring Security','PostgreSQL','pgvector','Docker Compose'],
      directories:[['src/pages','Operator Console'],['backend/src','Node compatibility API·queue·historian'],['archiveos-ai','Spring AI·Batch·RAG runtime'],['supabase','PostgreSQL/pgvector schema'],['docs/contracts','Nexus workflow 계약'],['docs/architecture','RAG·Batch·Approval 설계'],['tools/runtime','통합 실행·검증 script']],
      design:['Node compatibility API와 Java runtime을 점진적으로 분리','RAG key 미설정 시 fake success 대신 disabled/503','위험 작업은 Human Approval 전 실행 금지','Markdown heading·hash 기반 증분 indexing','공통 runtime과 산업 domain application 책임 분리'],
      flow:['Operator Console','Node Compatibility API','Spring AI Runtime','PostgreSQL + pgvector','Workflow/Approval','Slack Notification'],
      api:'Node 4000은 기존 contract와 delegation을, Java 4100은 health·RAG·Batch·RPA 실행을 담당한다.',
      search:'Obsidian Markdown을 heading-aware chunk로 나누고 content hash 변경분만 embedding하여 pgvector similarity search를 수행한다.',
      generation:'Agent/Batch 결과는 evidence와 상태 전이를 포함해 workflow history에 기록된다.',rag:'Markdown Loader → Chunking → Embedding → pgvector → Retrieval → ChatModel → References 흐름이다.',
      android:'Android 대상이 아닌 웹 Operator Console이다.',ui:'Overview, Agents, Workflows, Knowledge, History, Batch, RPA, MCP Registry와 Settings로 구성된다.',
      git:'frontend·Node·Java runtime을 같은 repository에서 contract test로 보호한다.',roadmap:['MCP Tool Registry 고도화','Multi-Agent mesh','RBAC','Kubernetes','Multi-LLM'],
      diagram:['React Console','Node API :4000','Spring AI :4100','PostgreSQL + pgvector','Obsidian/LLM/Slack'],
      sequence:['Markdown 변경','증분 Sync','Embedding 저장','Vector Search','Grounded Answer','Reference 반환'],
      technologies:['RAG','pgvector','Spring AI','MCP','Spring Batch','Human Approval','OpenTelemetry']
      ,observability:'Node compatibility API와 Java runtime의 health, workflow history, execution evidence를 분리해 관측한다.',limitations:'Node 호환 API와 Java runtime의 점진 분리 단계이며 실제 LLM·embedding 자격증명이 없으면 RAG 기능은 명시적으로 disabled 상태가 된다.'
    }
  };
  window.ATLAS_PROJECTS=projects;
})();
