import assert from 'node:assert/strict';
import { buildDailyReport, buildSlackMessage, classifyService, isPublicAddress, parseNginxLine } from '../ops/atlas-access-monitor.mjs';

const line = (ip, timestamp, path, status = 200) => `${ip} - - [${timestamp}] "GET ${path} HTTP/1.1" ${status} 123 "-" "fixture"`;
const parsed = [
  line('198.51.100.10', '25/Aug/2026:14:59:59 +0000', '/learn/'),
  line('198.51.100.10', '25/Aug/2026:15:00:01 +0000', '/learn/'),
  line('203.0.113.20', '25/Aug/2026:15:01:00 +0000', '/jobs/'),
  line('203.0.113.20', '25/Aug/2026:15:02:00 +0000', '/jobs/app.js'),
  line('203.0.113.30', '26/Aug/2026:15:01:00 +0000', '/health/', 404),
  line('127.0.0.1', '25/Aug/2026:15:03:00 +0000', '/health/'),
].map(parseNginxLine);

assert(parsed.every(Boolean), 'combined Nginx lines must parse');
assert.equal(new Date(parsed[1].timestamp).toISOString(), '2026-08-25T15:00:01.000Z');
assert.equal(isPublicAddress('198.51.100.10'), true);
assert.equal(isPublicAddress('127.0.0.1'), false);
assert.equal(isPublicAddress('10.0.0.1'), false);
assert.equal(classifyService('/run'), 'Learn Atlas');
assert.equal(classifyService('/sketchfy/room'), 'Sketchfy Atlas');

const salt = 'fixture-only-monitor-key';
const preliminary = buildDailyReport({ events: parsed, baselineIdentities: new Set(), salt, targetDate: '2026-08-25', startDate: '2026-08-26' });
const baselineDigest = preliminary.identityDigests.find(Boolean);
assert(baselineDigest, 'fixture identity digest must be created');

const firstDay = buildDailyReport({ events: parsed, baselineIdentities: new Set([baselineDigest]), salt, targetDate: '2026-08-26', startDate: '2026-08-26' });
assert.equal(firstDay.externalRequests, 3);
assert.equal(firstDay.baselineRequests, 1);
assert.equal(firstDay.monitoredRequests, 2);
assert.equal(firstDay.monitoredPageRequests, 1);
assert.equal(firstDay.monitoredUniqueIdentities, 1);
assert.equal(firstDay.firstSeenToday, 1);
assert.equal(firstDay.returningPostStart, 0);
assert.equal(firstDay.ignoredPrivateRequests, 1);
assert.equal(firstDay.serviceCounts['Incruit Atlas'], 2);

const nextDay = buildDailyReport({ events: parsed, baselineIdentities: new Set([baselineDigest]), salt, targetDate: '2026-08-27', startDate: '2026-08-26' });
assert.equal(nextDay.monitoredUniqueIdentities, 1);
assert.equal(nextDay.firstSeenToday, 1);
assert.equal(nextDay.statusCounts['4xx'], 1);
assert.equal(nextDay.serviceCounts['Health Atlas'], 1);

const message = buildSlackMessage(firstDay);
assert.match(message, /원 IP는 Slack·일일 보고서에 저장\/전송하지 않으며/);
assert.match(message, /Incruit Atlas 2건/);
assert.doesNotMatch(message, /198\.51\.100\.10|203\.0\.113\.20/);
assert.match(message, /접속-[A-F0-9]{10}/);

console.log('Atlas access monitor privacy and daily aggregation: PASS');
