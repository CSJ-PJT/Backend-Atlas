import { open } from 'node:fs/promises';
import { chmod, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyService, isPublicAddress, parseNginxLine } from './atlas-access-monitor.mjs';

const SENSITIVE_PATH = /(?:^|\/)(?:\.env(?:\.|\/|$)|\.git(?:\/|$)|\.svn(?:\/|$)|\.hg(?:\/|$)|wp-admin(?:\/|$)|wp-login\.php$|xmlrpc\.php$|phpmyadmin(?:\/|$)|adminer\.php$|actuator(?:\/|$)|server-status$|nginx_status$|vendor\/phpunit(?:\/|$)|boaform(?:\/|$)|cgi-bin(?:\/|$))/i;
const TRAVERSAL = /(?:\.\.\/|%2e%2e|%252e%252e|etc(?:%2f|\/)passwd)/i;
const PHP_PROBE = /\.php(?:$|\?)/i;
const SUSPICIOUS_METHODS = new Set(['TRACE', 'CONNECT']);

function statusBucket(status) {
  if (status >= 500) return '5xx';
  if (status >= 400) return '4xx';
  if (status >= 300) return '3xx';
  return '2xx';
}

export function classifyThreat(event) {
  const path = String(event?.path || '').toLowerCase();
  if (SUSPICIOUS_METHODS.has(event?.method)) return '비정상 HTTP 메서드';
  if (TRAVERSAL.test(path)) return '경로 순회 탐색';
  if (SENSITIVE_PATH.test(path)) return '민감 경로 탐색';
  if (PHP_PROBE.test(path)) return '비사용 PHP 탐색';
  if (path.split('?')[0] === '/atlas-admin-api/session' && event?.method === 'POST' && [401, 403, 429].includes(event?.status)) {
    return '관리자 로그인 실패';
  }
  return null;
}

export function analyzeThreats(events) {
  const sources = new Set();
  const categories = {};
  const services = {};
  const statuses = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
  let requests = 0;
  for (const event of events) {
    if (!event || !isPublicAddress(event.ip)) continue;
    const category = classifyThreat(event);
    if (!category) continue;
    requests += 1;
    sources.add(event.ip);
    categories[category] = (categories[category] || 0) + 1;
    const service = classifyService(event.path);
    services[service] = (services[service] || 0) + 1;
    statuses[statusBucket(event.status)] += 1;
  }
  const sorted = value => Object.fromEntries(Object.entries(value).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
  return {
    uniqueThreatSources: sources.size,
    threatRequests: requests,
    categoryCounts: sorted(categories),
    serviceCounts: sorted(services),
    statusCounts: statuses,
  };
}

export function buildThreatMessage(report) {
  const categories = Object.entries(report.categoryCounts).map(([name, count]) => `${name} ${count}건`).join(' · ') || '없음';
  const services = Object.entries(report.serviceCounts).map(([name, count]) => `${name} ${count}건`).join(' · ') || '없음';
  return [
    '🚨 [Archive Alert] Atlas 비식별 보안 위협 탐지',
    `고유 비식별 위협 출처: ${report.uniqueThreatSources}개`,
    `위협 요청: ${report.threatRequests}건`,
    `유형: ${categories}`,
    `서비스: ${services}`,
    `응답: 2xx ${report.statusCounts['2xx']} · 3xx ${report.statusCounts['3xx']} · 4xx ${report.statusCounts['4xx']} · 5xx ${report.statusCounts['5xx']}`,
    `처리 해석: 차단 ${report.statusCounts['4xx']} · 리다이렉트 ${report.statusCounts['3xx']} · 2xx 응답 ${report.statusCounts['2xx']} · 서버 오류 ${report.statusCounts['5xx']}`,
    '개인정보 보호: 원 IP와 비식별 식별값은 Slack·상태 파일에 저장하거나 전송하지 않습니다.',
  ].join('\n');
}

async function atomicJson(path, value) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await chmod(temporary, 0o600);
  await rename(temporary, path);
}

async function loadJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error?.code === 'ENOENT') return fallback; throw error; }
}

async function readNewLines(path, previous) {
  const metadata = await stat(path);
  const inode = String(metadata.ino);
  if (!previous) return { initialized: true, inode, offset: metadata.size, lines: [] };
  const offset = previous.inode === inode && Number(previous.offset) <= metadata.size ? Number(previous.offset) : 0;
  if (offset === metadata.size) return { initialized: false, inode, offset, lines: [] };
  const handle = await open(path, 'r');
  try {
    const length = metadata.size - offset;
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, offset);
    const complete = buffer.subarray(0, bytesRead);
    const lastNewline = complete.lastIndexOf(0x0a);
    if (lastNewline < 0) return { initialized: false, inode, offset, lines: [] };
    const text = complete.subarray(0, lastNewline + 1).toString('utf8');
    const lines = text.split(/\r?\n/);
    if (lines.at(-1) === '') lines.pop();
    return { initialized: false, inode, offset: offset + lastNewline + 1, lines };
  } finally {
    await handle.close();
  }
}

async function sendSlack(text, env = process.env) {
  const token = String(env.SLACK_BOT_TOKEN || '').trim();
  const channel = String(env.SLACK_CHANNEL || '').trim();
  if (!token || !channel) throw new Error('Archive Alert Slack configuration is missing.');
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ channel, text, unfurl_links: false, unfurl_media: false }),
  });
  if (!response.ok) throw new Error(`Archive Alert HTTP ${response.status}.`);
  const body = await response.json();
  if (!body?.ok) throw new Error(`Archive Alert rejected: ${body?.error || 'unknown_error'}.`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const send = process.argv.includes('--send');
  const stateDir = process.env.ATLAS_THREAT_STATE_DIR || '/var/lib/atlas-threat-monitor';
  const logPath = process.env.ATLAS_NGINX_ACCESS_LOG || '/var/log/nginx/access.log';
  const statePath = join(stateDir, 'state.json');
  const previous = await loadJson(statePath, null);
  const batch = await readNewLines(logPath, previous);
  if (batch.initialized) {
    if (!dryRun) await atomicJson(statePath, { schemaVersion: 1, inode: batch.inode, offset: batch.offset, updatedAt: new Date().toISOString() });
    console.log(JSON.stringify({ mode: 'threat-scan', initialized: true, threatRequests: 0 }));
    return;
  }
  const events = batch.lines.map(parseNginxLine).filter(Boolean);
  const report = analyzeThreats(events);
  const message = buildThreatMessage(report);
  if (send && report.threatRequests > 0) await sendSlack(message);
  if (!dryRun) await atomicJson(statePath, { schemaVersion: 1, inode: batch.inode, offset: batch.offset, updatedAt: new Date().toISOString() });
  console.log(JSON.stringify({
    mode: 'threat-scan',
    initialized: false,
    delivered: Boolean(send && report.threatRequests > 0),
    uniqueThreatSources: report.uniqueThreatSources,
    threatRequests: report.threatRequests,
    categoryCounts: report.categoryCounts,
    serviceCounts: report.serviceCounts,
    statusCounts: report.statusCounts,
  }));
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) main().catch(error => { console.error(`atlas-threat-monitor: ${error.message}`); process.exitCode = 1; });
