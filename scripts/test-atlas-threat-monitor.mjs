import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyzeThreats, buildThreatMessage, classifyThreat } from '../ops/atlas-threat-monitor.mjs';
import { parseNginxLine } from '../ops/atlas-access-monitor.mjs';

const hiddenLocationConfig = await readFile(new URL('../ops/nginx/atlas-deny-hidden-locations.conf', import.meta.url), 'utf8');
const httpServerConfig = await readFile(new URL('../ops/nginx/route-atlas-http.conf', import.meta.url), 'utf8');

const line = (ip, method, path, status) => `${ip} - - [28/Aug/2026:01:00:00 +0000] "${method} ${path} HTTP/1.1" ${status} 123 "-" "fixture"`;
const events = [
  line('203.0.113.10', 'GET', '/.env', 200),
  line('203.0.113.10', 'GET', '/wp-login.php', 404),
  line('203.0.113.11', 'GET', '/%2e%2e/%2e%2e/etc/passwd', 400),
  line('203.0.113.12', 'POST', '/atlas-admin-api/session', 401),
  line('203.0.113.14', 'GET', '/.env.production', 301),
  line('127.0.0.1', 'GET', '/.git/HEAD', 404),
  line('203.0.113.13', 'GET', '/learn/', 200),
].map(parseNginxLine);

assert.equal(classifyThreat(events[0]), '민감 경로 탐색');
assert.equal(classifyThreat(events[1]), '민감 경로 탐색');
assert.equal(classifyThreat(events[2]), '경로 순회 탐색');
assert.equal(classifyThreat(events[3]), '관리자 로그인 실패');
assert.equal(classifyThreat(events[6]), null);

const report = analyzeThreats(events);
assert.equal(report.uniqueThreatSources, 4);
assert.equal(report.threatRequests, 5);
assert.equal(report.statusCounts['2xx'], 1);
assert.equal(report.statusCounts['4xx'], 3);
assert.equal(report.statusCounts['3xx'], 1);
assert.equal(report.serviceCounts['Atlas Home/Other'], 5);

const message = buildThreatMessage(report);
assert.match(message, /고유 비식별 위협 출처: 4개/);
assert.match(message, /위협 요청: 5건/);
assert.match(message, /처리 해석: 차단 3 · 리다이렉트 1 · 2xx 응답 1 · 서버 오류 0/);
assert.doesNotMatch(message, /203\.0\.113|접속-[A-F0-9]+|[a-f0-9]{64}/i);
assert.doesNotMatch(message, /\/\.env|wp-login|passwd/);

assert.match(hiddenLocationConfig, /location \^~ \/\.env[\s\S]*return 404/);
assert.match(hiddenLocationConfig, /location \^~ \/\.git[\s\S]*return 404/);
assert.match(httpServerConfig, /include \/etc\/nginx\/snippets\/atlas-deny-hidden-locations\.conf/);
assert.ok(httpServerConfig.indexOf('atlas-deny-hidden-locations.conf') < httpServerConfig.indexOf('return 301'));

console.log('Atlas aggregate-only threat monitor: PASS');
