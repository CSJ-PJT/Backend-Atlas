import assert from 'node:assert/strict';
import { analyzeThreats, buildThreatMessage, classifyThreat } from '../ops/atlas-threat-monitor.mjs';
import { parseNginxLine } from '../ops/atlas-access-monitor.mjs';

const line = (ip, method, path, status) => `${ip} - - [28/Aug/2026:01:00:00 +0000] "${method} ${path} HTTP/1.1" ${status} 123 "-" "fixture"`;
const events = [
  line('203.0.113.10', 'GET', '/.env', 200),
  line('203.0.113.10', 'GET', '/wp-login.php', 404),
  line('203.0.113.11', 'GET', '/%2e%2e/%2e%2e/etc/passwd', 400),
  line('203.0.113.12', 'POST', '/atlas-admin-api/session', 401),
  line('127.0.0.1', 'GET', '/.git/HEAD', 404),
  line('203.0.113.13', 'GET', '/learn/', 200),
].map(parseNginxLine);

assert.equal(classifyThreat(events[0]), '민감 경로 탐색');
assert.equal(classifyThreat(events[1]), '민감 경로 탐색');
assert.equal(classifyThreat(events[2]), '경로 순회 탐색');
assert.equal(classifyThreat(events[3]), '관리자 로그인 실패');
assert.equal(classifyThreat(events[5]), null);

const report = analyzeThreats(events);
assert.equal(report.uniqueThreatSources, 3);
assert.equal(report.threatRequests, 4);
assert.equal(report.statusCounts['2xx'], 1);
assert.equal(report.statusCounts['4xx'], 3);
assert.equal(report.serviceCounts['Atlas Home/Other'], 4);

const message = buildThreatMessage(report);
assert.match(message, /고유 비식별 위협 출처: 3개/);
assert.match(message, /위협 요청: 4건/);
assert.doesNotMatch(message, /203\.0\.113|접속-[A-F0-9]+|[a-f0-9]{64}/i);
assert.doesNotMatch(message, /\/\.env|wp-login|passwd/);

console.log('Atlas aggregate-only threat monitor: PASS');
