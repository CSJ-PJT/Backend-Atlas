import assert from 'node:assert/strict';
import { buildBaseline, buildDailyReport, buildSlackMessage, classifyService, isPublicAddress, parseNginxLine } from '../ops/atlas-access-monitor.mjs';

const line = (ip, timestamp, path, status = 200) => `${ip} - - [${timestamp}] "GET ${path} HTTP/1.1" ${status} 123 "-" "fixture"`;
const parsed = [
  line('198.51.100.10', '25/Aug/2026:14:59:59 +0000', '/learn/'),
  line('198.51.100.10', '25/Aug/2026:15:00:01 +0000', '/learn/'),
  line('203.0.113.20', '25/Aug/2026:15:01:00 +0000', '/jobs/'),
  line('203.0.113.20', '25/Aug/2026:15:02:00 +0000', '/jobs/app.js'),
  line('198.51.100.10', '26/Aug/2026:15:00:01 +0000', '/learn/'),
  line('203.0.113.30', '26/Aug/2026:15:01:00 +0000', '/health/', 404),
  line('203.0.113.30', '26/Aug/2026:15:02:00 +0000', '/health/app.js'),
  line('127.0.0.1', '26/Aug/2026:15:03:00 +0000', '/health/'),
  line('203.0.113.30', '27/Aug/2026:15:01:00 +0000', '/sketchfy/room'),
  line('203.0.113.40', '27/Aug/2026:15:02:00 +0000', '/jobs/'),
].map(parseNginxLine);

assert(parsed.every(Boolean), 'combined Nginx lines must parse');
const malformedRequest = parseNginxLine('203.0.113.40 - - [25/Aug/2026:15:04:00 +0000] "\\x16\\x03" 400 150 "-" "-"');
assert.equal(malformedRequest.path, '/__unparsed-request__');
assert.equal(malformedRequest.status, 400);
assert.equal(new Date(parsed[1].timestamp).toISOString(), '2026-08-25T15:00:01.000Z');
assert.equal(isPublicAddress('198.51.100.10'), true);
assert.equal(isPublicAddress('127.0.0.1'), false);
assert.equal(isPublicAddress('10.0.0.1'), false);
assert.equal(classifyService('/run'), 'Learn Atlas');
assert.equal(classifyService('/sketchfy/room'), 'Sketchfy Atlas');

const salt = 'fixture-only-monitor-key';
const oldLogs = parsed.filter(event => event.timestamp < Date.parse('2026-08-26T00:00:00+09:00'));
const oldBaseline = buildBaseline({ events: oldLogs, salt, startDate: '2026-08-26' });
const rotatedLogs = parsed.filter(event => event.ip !== '198.51.100.10');
const preservedBaseline = buildBaseline({ events: rotatedLogs, previousBaseline: oldBaseline, salt, startDate: '2026-08-27' });
assert.equal(oldBaseline.identities.every(digest => preservedBaseline.identities.includes(digest)), true, 'rotated-out historical identities must remain excluded');
assert.equal(preservedBaseline.previousIdentityCount, oldBaseline.identities.length);

const preliminary = buildDailyReport({ events: parsed, baselineIdentities: new Set(), salt, targetDate: '2026-08-26', startDate: '2026-08-27' });
const baselineIdentities = new Set(preliminary.identityDigests);
assert.equal(baselineIdentities.size, 2, 'all identities observed before the start date must form the baseline');

const firstDay = buildDailyReport({ events: parsed, baselineIdentities, salt, targetDate: '2026-08-27', startDate: '2026-08-27' });
assert.equal(firstDay.externalRequests, 3);
assert.equal(firstDay.baselineRequests, 1);
assert.equal(firstDay.monitoredRequests, 2);
assert.equal(firstDay.monitoredPageRequests, 1);
assert.equal(firstDay.monitoredUniqueIdentities, 1);
assert.equal(firstDay.firstSeenToday, 1);
assert.equal(firstDay.returningPostStart, 0);
assert.equal(firstDay.ignoredPrivateRequests, 1);
assert.equal(firstDay.serviceCounts['Health Atlas'], 2);

const cohort = Object.fromEntries(firstDay.identityDigests.map(digest => [digest, { firstSeenDate: '2026-08-27' }]));
const nextDay = buildDailyReport({ events: parsed, baselineIdentities, cohort, salt, targetDate: '2026-08-28', startDate: '2026-08-27' });
assert.equal(nextDay.monitoredUniqueIdentities, 2);
assert.equal(nextDay.firstSeenToday, 1);
assert.equal(nextDay.returningPostStart, 1);
assert.equal(nextDay.serviceCounts['Sketchfy Atlas'], 1);
assert.equal(nextDay.serviceCounts['Incruit Atlas'], 1);

const message = buildSlackMessage(firstDay);
assert.match(message, /원 IP와 비식별 식별값은 Slack·일일 보고서에 저장하거나 전송하지 않습니다/);
assert.match(message, /Health Atlas 2건/);
assert.doesNotMatch(message, /198\.51\.100\.10|203\.0\.113\.20/);
assert.doesNotMatch(message, /접속-[A-F0-9]{10}/);
assert.doesNotMatch(message, /오늘 첫 등장|재방문|상위 비식별 접속/);

console.log('Atlas access monitor privacy and daily aggregation: PASS');
