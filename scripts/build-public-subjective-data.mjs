import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

globalThis.window = {};
await import('../interview/data/interview-data.js');

const bundle = globalThis.window.INTERVIEW_LAB_DATA;
if (!bundle?.questions?.length) throw new Error('Interview question bundle is unavailable');

const topic = (id, category, difficulty, answer, aliases, clue, hint, example, sourceUrl) => ({ id, category, difficulty, answer, aliases, clue, hint, example, sourceUrl });

// Recurring themes from Korean backend-interview lists, grounded in primary documentation.
const TOPICS = [
  topic('http', 'web-network', 'basic', 'HTTP', ['에이치티티피', 'hypertext transfer protocol'], '웹에서 클라이언트와 서버가 요청과 응답을 주고받기 위한 애플리케이션 계층 프로토콜', '웹 브라우저와 API 서버 사이의 통신 규칙을 떠올려 보세요.', '브라우저가 서버에 문서를 요청하고 상태 코드와 본문을 응답받습니다.', 'https://developer.mozilla.org/en-US/docs/Web/HTTP'),
  topic('https', 'web-network', 'basic', 'HTTPS', ['에이치티티피에스', 'http secure'], '웹 요청과 응답을 TLS로 암호화해 전달하는 프로토콜', '주소창의 자물쇠 표시와 인증서를 떠올려 보세요.', '로그인 정보가 네트워크에서 평문으로 노출되지 않도록 암호화합니다.', 'https://developer.mozilla.org/en-US/docs/Glossary/HTTPS'),
  topic('rest', 'web-network', 'basic', 'REST', ['레스트', 'representational state transfer'], '자원을 URI로 표현하고 표준 메서드로 상태를 주고받는 웹 아키텍처 스타일', '자원 중심 URI와 표준 웹 메서드를 함께 떠올려 보세요.', '사용자 한 명을 /users/42 같은 자원 주소로 표현합니다.', 'https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm'),
  topic('get', 'web-network', 'basic', 'GET', ['겟', '조회 메서드'], '서버의 자원을 조회할 때 주로 사용하며 안전한 것으로 정의된 웹 요청 메서드', '읽기 목적의 요청에 사용하는 메서드입니다.', '프로필 정보를 읽어 오지만 서버 데이터는 변경하지 않습니다.', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/GET'),
  topic('post', 'web-network', 'basic', 'POST', ['포스트', '생성 메서드'], '서버에 데이터를 제출해 처리하거나 새 자원을 만들 때 주로 사용하는 웹 요청 메서드', '요청 본문을 보내 생성이나 처리를 맡기는 메서드입니다.', '회원가입 폼의 데이터를 서버에 보내 새 사용자를 만듭니다.', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/POST'),
  topic('idempotency', 'web-network', 'medium', '멱등성', ['idempotency', '멱등'], '같은 요청을 여러 번 수행해도 최종 결과가 한 번 수행한 것과 같게 유지되는 성질', '네트워크 재시도가 중복 처리를 만들지 않게 하는 성질입니다.', '같은 요청 키로 두 번 전송해도 자원은 하나만 생성됩니다.', 'https://www.rfc-editor.org/rfc/rfc9110#section-9.2.2'),
  topic('cookie', 'web-network', 'basic', '쿠키', ['cookie', '웹 쿠키'], '서버가 브라우저에 저장하도록 보내고 이후 요청에 함께 전달할 수 있는 작은 데이터', '브라우저 쪽에 보관되는 이름-값 데이터를 떠올려 보세요.', '서버가 응답 헤더로 값을 설정하면 브라우저가 다음 요청에 함께 보냅니다.', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies'),
  topic('session', 'web-network', 'basic', '세션', ['session', '서버 세션'], '사용자의 여러 요청을 하나의 로그인 상태로 연결해 서버 측에서 관리하는 방식', '서버가 식별자를 기준으로 사용자 상태를 기억합니다.', '브라우저는 식별자만 보내고 로그인 정보는 서버 저장소에서 찾습니다.', 'https://docs.spring.io/spring-session/reference/'),
  topic('jwt', 'web-network', 'medium', 'JWT', ['제이더블유티', 'json web token'], '클레임을 JSON으로 담고 서명해 전달하는 토큰 형식', '점으로 나뉜 세 부분과 서명을 떠올려 보세요.', '서버가 서명을 검증한 뒤 토큰에 담긴 만료 시각과 권한을 확인합니다.', 'https://www.rfc-editor.org/rfc/rfc7519'),
  topic('cors', 'web-network', 'medium', 'CORS', ['코스', '교차 출처 리소스 공유', 'cross origin resource sharing'], '서버가 응답 헤더로 다른 출처의 브라우저 요청을 허용할지 알리는 웹 메커니즘', '브라우저의 동일 출처 정책과 사전 요청을 떠올려 보세요.', '다른 도메인의 프런트엔드가 API를 호출하기 전에 허용 출처를 확인합니다.', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS'),
  topic('dns', 'web-network', 'basic', 'DNS', ['디엔에스', '도메인 이름 시스템', 'domain name system'], '사람이 읽는 도메인 이름을 서버의 IP 주소 등으로 변환하는 분산 시스템', '전화번호부처럼 이름을 주소로 바꾸는 시스템입니다.', '브라우저가 서비스 도메인에 접속하기 전에 연결할 주소를 조회합니다.', 'https://www.rfc-editor.org/rfc/rfc1034'),
  topic('load-balancer', 'web-network', 'medium', '로드 밸런서', ['load balancer', '부하 분산기'], '들어오는 요청을 여러 서버에 나누어 전달하는 구성 요소', '한 서버에 트래픽이 몰리지 않게 앞단에서 분배합니다.', '세 대의 애플리케이션 서버에 요청을 번갈아 전달합니다.', 'https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/'),

  topic('transaction', 'database-sql', 'basic', '트랜잭션', ['transaction', '거래 단위'], '여러 데이터베이스 작업을 하나의 논리적 실행 단위로 묶는 개념', '모두 성공하거나 모두 취소되어야 하는 작업 묶음입니다.', '두 테이블 갱신 중 하나가 실패하면 둘 다 되돌립니다.', 'https://www.postgresql.org/docs/current/tutorial-transactions.html'),
  topic('acid', 'database-sql', 'basic', 'ACID', ['애시드'], '데이터베이스 트랜잭션이 지켜야 할 원자성·일관성·격리성·지속성의 묶음', '트랜잭션의 네 가지 핵심 성질의 머리글자입니다.', '커밋된 변경은 장애 뒤에도 남고 실패한 작업은 일부만 반영되지 않습니다.', 'https://www.postgresql.org/docs/current/tutorial-transactions.html'),
  topic('index', 'database-sql', 'basic', '인덱스', ['index', '색인'], '테이블의 특정 값을 더 빠르게 찾기 위해 별도로 유지하는 탐색 구조', '책의 찾아보기처럼 검색 범위를 줄여 줍니다.', '이메일 열을 기준으로 사용자를 찾는 조회 속도를 높입니다.', 'https://www.postgresql.org/docs/current/indexes.html'),
  topic('primary-key', 'database-sql', 'basic', '기본 키', ['primary key', '프라이머리 키', '주 키'], '테이블의 각 행을 유일하게 식별하고 NULL을 허용하지 않는 제약', '한 행을 대표하는 중복 없는 식별자입니다.', '사용자 테이블의 id 값은 각 행마다 하나만 존재합니다.', 'https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS'),
  topic('foreign-key', 'database-sql', 'basic', '외래 키', ['foreign key', '포린 키', '참조 키'], '한 테이블의 값이 다른 테이블의 행을 참조하도록 무결성을 보장하는 제약', '부모 행과 자식 행의 관계를 지키는 제약입니다.', '게시글의 작성자 식별자가 실제 사용자 행을 가리키게 합니다.', 'https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK'),
  topic('normalization', 'database-sql', 'basic', '정규화', ['normalization', '데이터 정규화'], '데이터 중복과 갱신 이상을 줄이도록 관계형 테이블을 나누는 과정', '반복되는 값을 별도 테이블로 분리하는 원칙을 떠올려 보세요.', '여러 행에 반복되던 부서 정보를 부서 테이블로 분리합니다.', 'https://www.postgresql.org/docs/current/ddl.html'),
  topic('join', 'database-sql', 'basic', 'JOIN', ['조인', '테이블 결합'], '관련 열을 기준으로 둘 이상의 테이블 행을 결합하는 SQL 연산', '서로 나뉜 테이블의 정보를 한 결과로 연결합니다.', '사용자 행과 그 사용자가 작성한 게시글 행을 함께 조회합니다.', 'https://www.postgresql.org/docs/current/tutorial-join.html'),
  topic('group-by', 'database-sql', 'basic', 'GROUP BY', ['그룹 바이', 'groupby'], '같은 값을 가진 행을 묶어 합계나 개수 같은 집계를 계산하는 SQL 절', '집계 함수와 함께 쓰는 그룹화 절입니다.', '상태별 요청 건수를 한 행씩 계산합니다.', 'https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-GROUP'),
  topic('isolation-level', 'database-sql', 'medium', '격리 수준', ['isolation level', '트랜잭션 격리 수준'], '동시에 실행되는 트랜잭션이 서로의 변경을 어느 정도 볼 수 있는지 정하는 단계', '동시 실행에서 읽기 현상을 제어하는 설정입니다.', '한 작업이 읽는 동안 다른 작업의 커밋을 볼 수 있는 범위를 정합니다.', 'https://www.postgresql.org/docs/current/transaction-iso.html'),
  topic('deadlock', 'database-sql', 'medium', '데드락', ['deadlock', '교착 상태'], '둘 이상의 작업이 서로 가진 잠금을 기다리며 더 진행하지 못하는 상태', '각 작업이 상대방의 자원을 기다리는 순환 구조입니다.', '두 트랜잭션이 서로 반대 순서로 행을 잠가 계속 대기합니다.', 'https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-DEADLOCKS'),
  topic('n-plus-one', 'database-sql', 'medium', 'N+1', ['엔 플러스 원', 'n plus one', 'n+1 query'], '목록을 한 번 조회한 뒤 각 행마다 연관 데이터를 추가 조회하는 문제', '첫 쿼리 뒤에 행 수만큼 쿼리가 반복됩니다.', '게시글 100개를 읽고 작성자를 찾기 위해 100번 더 조회합니다.', 'https://docs.spring.io/spring-data/jpa/reference/repositories/query-methods-details.html'),
  topic('optimistic-lock', 'database-sql', 'medium', '낙관적 락', ['optimistic locking', 'optimistic lock', '낙관적 잠금'], '충돌이 드물다고 가정하고 버전 값을 비교해 동시 수정을 감지하는 방식', '먼저 잠그기보다 저장할 때 버전 충돌을 확인합니다.', '읽을 때 버전이 3이었는데 저장 시 4라면 갱신을 거부합니다.', 'https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2#entity-locking-and-concurrency'),
  topic('connection-pool', 'database-sql', 'medium', '커넥션 풀', ['connection pool', '연결 풀'], '데이터베이스 연결을 미리 만들고 재사용해 연결 생성 비용을 줄이는 구조', '요청마다 새 연결을 만들지 않고 빌려 쓰는 저장소입니다.', '요청이 시작되면 연결 하나를 빌리고 완료 후 다시 반환합니다.', 'https://docs.oracle.com/javase/8/docs/api/javax/sql/ConnectionPoolDataSource.html'),

  topic('jvm', 'java-spring', 'basic', 'JVM', ['제이브이엠', '자바 가상 머신', 'java virtual machine'], '자바 바이트코드를 운영체제와 하드웨어 위에서 실행하는 가상 머신', '자바 프로그램이 플랫폼에 독립적으로 실행되는 기반입니다.', '컴파일된 바이트코드를 현재 운영체제에 맞게 실행합니다.', 'https://docs.oracle.com/en/java/javase/21/vm/java-virtual-machine-technology-overview.html'),
  topic('garbage-collection', 'java-spring', 'basic', '가비지 컬렉션', ['garbage collection', 'GC', '지씨'], '더 이상 참조되지 않는 객체의 메모리를 자동으로 회수하는 과정', '개발자가 직접 해제하지 않은 객체 메모리를 정리합니다.', '도달할 수 없는 객체가 된 뒤 메모리 공간이 회수됩니다.', 'https://docs.oracle.com/en/java/javase/21/gctuning/introduction-garbage-collection-tuning.html'),
  topic('heap-memory', 'java-spring', 'basic', '힙', ['heap', 'heap memory', '힙 메모리'], '프로그램 실행 중 생성된 객체가 주로 저장되는 공유 메모리 영역', 'new로 만든 객체가 놓이는 영역을 떠올려 보세요.', '새 서비스 객체를 만들면 여러 스레드가 접근 가능한 영역에 저장됩니다.', 'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5.3'),
  topic('stack-memory', 'java-spring', 'basic', '스택', ['stack', 'stack memory', '스택 메모리'], '메서드 호출마다 지역 변수와 실행 정보를 프레임으로 쌓는 메모리 영역', '함수가 호출되고 돌아오는 순서와 관련된 영역입니다.', '메서드가 끝나면 해당 호출 프레임이 제거됩니다.', 'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5.2'),
  topic('thread', 'java-spring', 'basic', '스레드', ['thread'], '프로세스 안에서 독립적으로 명령을 실행하는 기본 실행 흐름', '한 프로세스 안에서 동시에 움직이는 실행 단위입니다.', '서버가 여러 요청을 각각의 실행 흐름에서 처리합니다.', 'https://docs.oracle.com/javase/tutorial/essential/concurrency/'),
  topic('thread-pool', 'java-spring', 'medium', '스레드 풀', ['thread pool', '실행자 풀'], '일정 수의 작업 스레드를 미리 유지하고 여러 작업에 재사용하는 구조', '작업마다 새 실행 흐름을 만들지 않고 재사용합니다.', '고정된 작업자들이 큐에서 요청을 하나씩 가져와 처리합니다.', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html'),
  topic('immutable-object', 'java-spring', 'medium', '불변 객체', ['immutable object', '불변 오브젝트'], '생성된 뒤 내부 상태가 바뀌지 않도록 설계한 객체', '수정 메서드 없이 새 값을 새 객체로 표현합니다.', '필드를 최종 값으로 두고 변경이 필요하면 새 인스턴스를 만듭니다.', 'https://docs.oracle.com/javase/tutorial/essential/concurrency/immutable.html'),
  topic('synchronization', 'java-spring', 'medium', '동기화', ['synchronization', '스레드 동기화'], '여러 스레드가 공유 상태에 접근할 때 실행 순서와 가시성을 조정하는 기법', '공유 값의 경쟁 상태를 막는 제어입니다.', '한 번에 한 작업만 공유 카운터를 변경하도록 보호합니다.', 'https://docs.oracle.com/javase/tutorial/essential/concurrency/sync.html'),
  topic('ioc', 'java-spring', 'basic', 'IoC', ['아이오씨', '제어의 역전', 'inversion of control'], '객체 생성과 생명주기의 제어권을 애플리케이션 코드가 아닌 컨테이너가 갖는 원리', '객체를 직접 만들지 않고 프레임워크가 관리합니다.', '프레임워크가 서비스 객체를 생성하고 필요한 시점에 제공합니다.', 'https://docs.spring.io/spring-framework/reference/core/beans/introduction.html'),
  topic('di', 'java-spring', 'basic', 'DI', ['디아이', '의존성 주입', 'dependency injection'], '객체가 필요한 의존 대상을 직접 만들지 않고 외부에서 전달받는 방식', '생성자 매개변수로 협력 객체를 받는 장면을 떠올려 보세요.', '서비스 생성자에 저장소 구현체를 전달합니다.', 'https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html'),
  topic('bean', 'java-spring', 'basic', 'Bean', ['빈', '스프링 빈', 'spring bean'], '스프링 컨테이너가 생성하고 조립하며 생명주기를 관리하는 객체', '컨테이너에 등록되어 관리되는 객체의 이름입니다.', '서비스 클래스가 컨테이너에 등록되어 다른 객체에 주입됩니다.', 'https://docs.spring.io/spring-framework/reference/core/beans/definition.html'),
  topic('aop', 'java-spring', 'medium', 'AOP', ['에이오피', '관점 지향 프로그래밍', 'aspect oriented programming'], '로깅이나 트랜잭션처럼 여러 모듈에 공통인 관심사를 핵심 로직과 분리하는 방식', '여러 메서드 앞뒤에 반복되는 공통 기능을 분리합니다.', '서비스 메서드 실행 전후의 로그 기록을 한 곳에서 적용합니다.', 'https://docs.spring.io/spring-framework/reference/core/aop.html'),
  topic('spring-mvc', 'java-spring', 'medium', 'Spring MVC', ['스프링 MVC', 'spring model view controller'], '요청을 컨트롤러에 연결하고 모델과 응답 생성을 구성하는 스프링 웹 프레임워크', '중앙 서블릿이 요청을 알맞은 컨트롤러로 보냅니다.', '특정 경로의 요청이 컨트롤러 메서드에 매핑되어 응답을 만듭니다.', 'https://docs.spring.io/spring-framework/reference/web/webmvc.html'),
  topic('jpa', 'java-spring', 'basic', 'JPA', ['제이피에이', '자바 영속성 API', 'jakarta persistence'], '자바 객체와 관계형 데이터베이스를 연결하기 위한 영속성 표준 명세', '구현체가 아니라 자바의 영속성 표준을 묻는 문제입니다.', '엔티티 클래스와 테이블의 대응 관계를 표준 애너테이션으로 정의합니다.', 'https://jakarta.ee/specifications/persistence/'),
  topic('orm', 'java-spring', 'basic', 'ORM', ['오알엠', '객체 관계 매핑', 'object relational mapping'], '객체와 관계형 데이터베이스의 테이블을 대응시켜 변환하는 기술', '객체 세계와 테이블 세계 사이를 연결합니다.', '객체의 필드가 테이블의 열에 대응되어 저장됩니다.', 'https://jakarta.ee/specifications/persistence/'),
  topic('lazy-loading', 'java-spring', 'medium', '지연 로딩', ['lazy loading', '레이지 로딩'], '연관 데이터가 실제로 필요해지는 시점까지 조회를 미루는 방식', '처음부터 모두 읽지 않고 접근할 때 가져옵니다.', '목록을 조회할 때는 연관 항목을 읽지 않고 해당 속성을 열 때 조회합니다.', 'https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2#fetching-strategy'),
  topic('transactional', 'java-spring', 'medium', '@Transactional', ['트랜잭셔널', 'transactional', '트랜잭션 애너테이션'], '스프링에서 메서드나 클래스의 트랜잭션 속성을 선언하는 애너테이션', '선언적 트랜잭션 경계를 지정하는 표시입니다.', '서비스 메서드에서 예외가 발생하면 변경을 되돌리도록 경계를 설정합니다.', 'https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html'),

  topic('cache', 'architecture-operations', 'basic', '캐시', ['cache', '캐싱'], '자주 쓰는 데이터를 더 빠른 저장소에 임시 보관해 응답 시간을 줄이는 방식', '원본을 매번 읽지 않고 가까운 곳의 복사본을 사용합니다.', '자주 조회되는 설정 값을 메모리에 잠시 저장합니다.', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching'),
  topic('redis', 'architecture-operations', 'basic', 'Redis', ['레디스', '인메모리 데이터 저장소'], '문자열·해시·목록·집합 등을 메모리 중심으로 다루는 데이터 구조 서버', '빠른 키-값 접근과 만료 시간을 떠올려 보세요.', '짧게 유지할 로그인 상태와 요청 횟수 카운터를 저장합니다.', 'https://redis.io/docs/latest/develop/data-types/'),
  topic('message-queue', 'architecture-operations', 'medium', '메시지 큐', ['message queue', '메시지 대기열'], '생산자와 소비자 사이에 메시지를 보관해 비동기 처리를 연결하는 구조', '보내는 쪽과 처리하는 쪽의 속도를 분리합니다.', 'API는 작업을 넣고 별도 작업자가 나중에 꺼내 처리합니다.', 'https://www.rabbitmq.com/tutorials'),
  topic('docker', 'architecture-operations', 'basic', 'Docker', ['도커', '컨테이너 플랫폼'], '애플리케이션과 실행 환경을 이미지로 묶어 격리된 컨테이너에서 실행하는 플랫폼', '개발과 운영에서 같은 실행 환경을 재현합니다.', '이미지 하나로 노트북과 서버에서 동일한 애플리케이션을 실행합니다.', 'https://docs.docker.com/get-started/docker-overview/'),
  topic('cicd', 'architecture-operations', 'basic', 'CI/CD', ['씨아이씨디', 'cicd', '지속적 통합 지속적 전달', 'continuous integration continuous delivery'], '코드 변경을 자동으로 통합·테스트하고 전달 또는 배포하는 개발 방식', '커밋 이후 테스트와 배포가 자동으로 이어집니다.', '변경을 올리면 테스트를 실행하고 통과한 산출물을 배포합니다.', 'https://docs.github.com/en/actions/about-github-actions/understanding-github-actions'),
  topic('api-gateway', 'architecture-operations', 'medium', 'API 게이트웨이', ['api gateway', '에이피아이 게이트웨이'], '여러 백엔드 서비스 앞에서 인증·라우팅·호출 제한을 공통 처리하는 진입 계층', '클라이언트가 여러 서비스 대신 한 진입점으로 요청합니다.', '한 주소가 인증을 확인한 뒤 요청을 알맞은 내부 서비스로 전달합니다.', 'https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html'),
  topic('circuit-breaker', 'architecture-operations', 'medium', '서킷 브레이커', ['circuit breaker', '회로 차단기'], '외부 서비스 실패가 일정 기준을 넘으면 호출을 잠시 차단해 연쇄 장애를 막는 패턴', '전기 차단기처럼 실패한 대상의 호출을 잠시 끊습니다.', '연속 실패 뒤에는 즉시 실패를 반환하고 시간이 지난 후 일부 호출로 회복을 확인합니다.', 'https://resilience4j.readme.io/docs/circuitbreaker'),
  topic('observability', 'architecture-operations', 'medium', '관측성', ['observability', '옵저버빌리티'], '로그·메트릭·트레이스 같은 출력으로 시스템 내부 상태를 이해하는 능력', '장애 원인을 외부 신호로 질문하고 확인할 수 있어야 합니다.', '한 요청의 추적 정보와 오류 로그, 지연 시간 지표를 함께 확인합니다.', 'https://opentelemetry.io/docs/concepts/observability-primer/'),
];

if (TOPICS.length !== 50) throw new Error(`Curated backend topic count must be exactly 50: ${TOPICS.length}`);

const forbidden = [...new Set((bundle.jobs || []).flatMap(job => [job.company, job.role]).filter(Boolean))];
const frames = [
  clue => `다음 설명에 맞는 백엔드 기술 용어는 무엇인가요? ${clue}`,
  clue => `다음 정의가 가리키는 백엔드 개념을 쓰세요. ${clue}`,
  clue => `다음 특징을 가진 기술을 한국어 또는 영어로 쓰세요. ${clue}`,
  clue => `다음 동작을 설명하는 백엔드 용어는 무엇인가요? ${clue}`,
  clue => `다음 문장의 핵심 기술 용어를 쓰세요. ${clue}`,
  clue => `백엔드 면접 단답형입니다. 다음 개념의 이름은 무엇인가요? ${clue}`,
  clue => `다음 내용을 가장 정확하게 나타내는 용어를 쓰세요. ${clue}`,
  clue => `다음 원리를 지칭하는 백엔드 기술 용어는 무엇인가요? ${clue}`,
  clue => `다음 설명의 제목으로 알맞은 기술 용어를 쓰세요. ${clue}`,
  clue => `다음 개념을 한글 또는 영문 용어로 답하세요. ${clue}`,
];

const questions = TOPICS.flatMap(definition => {
  const acceptedAnswers = [...new Set([definition.answer, ...definition.aliases])];
  const koreanAnswers = acceptedAnswers.filter(answer => /[가-힣]/.test(answer));
  const englishAnswers = acceptedAnswers.filter(answer => /[A-Za-z]/.test(answer));
  if (!koreanAnswers.length || !englishAnswers.length) throw new Error(`Bilingual answers are incomplete for topic: ${definition.id}`);
  return frames.map((frame, variant) => ({
    id: `public-${definition.id}-${variant + 1}`,
    category: definition.category,
    difficulty: definition.difficulty,
    question: frame(definition.clue),
    answer: definition.answer,
    acceptedAnswers,
    koreanAnswers,
    englishAnswers,
    hint: definition.hint,
    example: definition.example,
    explanation: `${definition.answer}: ${definition.clue}`,
    sourceUrl: definition.sourceUrl,
    tags: [definition.category, 'backend-interview'],
  }));
});

if (questions.length !== 500) throw new Error(`Backend short-answer bank must contain exactly 500 questions: ${questions.length}`);
if (questions.some(question => !question.answer || !question.acceptedAnswers.length || !question.hint || !question.example || !question.sourceUrl)) throw new Error('Every public question must have an answer, hint, example, and primary source');

const serialized = JSON.stringify({ schemaVersion: 4, generatedAt: bundle.generatedAt, answerType: 'single-term-bilingual', reviewStatus: 'public-reviewed-with-learning-aids', questions });
for (const value of forbidden) {
  if (value && serialized.toLocaleLowerCase('ko-KR').includes(value.toLocaleLowerCase('ko-KR'))) throw new Error(`Employer-specific value leaked into public short-answer data: ${value}`);
}

await writeFile(resolve(import.meta.dirname, '..', 'subjective-questions.js'), `window.ATLAS_SUBJECTIVE_QUESTIONS=${serialized};\n`, 'utf8');
console.log(`Backend short-answer learning data built: ${questions.length} bilingual questions from ${TOPICS.length} common interview topics with hints, examples, and primary sources.`);
