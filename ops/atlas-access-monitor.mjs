import { createHash, createHmac, randomBytes } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { chmod, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { basename, join } from 'node:path';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const DEFAULT_START_DATE = '2026-08-27';
const DAY_MS = 86_400_000;
const MONTHS = new Map(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((month, index) => [month, index]));
const STATIC_ASSET = /\.(?:avif|css|gif|ico|jpe?g|js|map|png|svg|webmanifest|webp|woff2?|ttf)(?:$|\?)/i;

function requiredDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || Number.isNaN(Date.parse(`${value}T00:00:00+09:00`))) {
    throw new Error(`${label} must be YYYY-MM-DD.`);
  }
  return value;
}

export function kstDate(value) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(value));
  const part = type => parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function dateBefore(value) {
  return kstDate(Date.parse(`${value}T00:00:00+09:00`) - DAY_MS);
}

function parseNginxTime(value) {
  const match = /^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/.exec(value);
  if (!match || !MONTHS.has(match[2])) return Number.NaN;
  const utc = Date.UTC(Number(match[3]), MONTHS.get(match[2]), Number(match[1]), Number(match[4]), Number(match[5]), Number(match[6]));
  const offset = (Number(match[8]) * 60 + Number(match[9])) * 60_000 * (match[7] === '+' ? 1 : -1);
  return utc - offset;
}

export function parseNginxLine(line) {
  const match = /^(\S+) \S+ \S+ \[([^\]]+)] "([^"]*)" (\d{3}) (\S+)/.exec(line);
  if (!match) return null;
  const timestamp = parseNginxTime(match[2]);
  if (!Number.isFinite(timestamp)) return null;
  const request = match[3].trim().split(/\s+/);
  return {
    ip: match[1],
    timestamp,
    method: request[0] || 'UNKNOWN',
    path: request[1]?.startsWith('/') ? request[1] : '/__unparsed-request__',
    status: Number(match[4]),
  };
}

function mappedIpv4(ip) {
  return ip.toLowerCase().startsWith('::ffff:') ? ip.slice(7) : ip;
}

export function isPublicAddress(value) {
  const ip = mappedIpv4(String(value || ''));
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224);
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    return !(normalized === '::' || normalized === '::1' || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('ff'));
  }
  return false;
}

export function classifyService(pathname) {
  const path = String(pathname || '').split('?')[0].toLowerCase();
  if (path === '/run' || path.startsWith('/learn')) return 'Learn Atlas';
  if (path.startsWith('/sketchfy')) return 'Sketchfy Atlas';
  if (path.startsWith('/jobs')) return 'Incruit Atlas';
  if (path.startsWith('/health')) return 'Health Atlas';
  if (path.startsWith('/travel')) return 'Travel Atlas';
  if (path.startsWith('/world')) return 'World Atlas';
  if (path.startsWith('/archive')) return 'Archive';
  return 'Atlas Home/Other';
}

function statusBucket(status) {
  if (status >= 500) return '5xx';
  if (status >= 400) return '4xx';
  if (status >= 300) return '3xx';
  if (status >= 200) return '2xx';
  return 'other';
}

function identity(ip, salt) {
  return createHmac('sha256', salt).update(mappedIpv4(ip)).digest('hex');
}

function alias(digest) {
  return `접속-${digest.slice(0, 10).toUpperCase()}`;
}

export function buildDailyReport({ events, baselineIdentities, cohort = {}, salt, targetDate, startDate = DEFAULT_START_DATE }) {
  requiredDate(targetDate, 'targetDate');
  requiredDate(startDate, 'startDate');
  const targetStart = Date.parse(`${targetDate}T00:00:00+09:00`);
  const targetEnd = targetStart + DAY_MS;
  const cutoff = Date.parse(`${startDate}T00:00:00+09:00`);
  const baseline = baselineIdentities instanceof Set ? baselineIdentities : new Set(baselineIdentities || []);
  const priorPostStart = new Set(Object.keys(cohort || {}));
  const target = [];
  let ignoredPrivateRequests = 0;
  for (const event of events) {
    if (!isPublicAddress(event.ip)) {
      if (event.timestamp >= targetStart && event.timestamp < targetEnd) ignoredPrivateRequests += 1;
      continue;
    }
    const digest = identity(event.ip, salt);
    if (event.timestamp >= cutoff && event.timestamp < targetStart && !baseline.has(digest)) priorPostStart.add(digest);
    if (event.timestamp >= targetStart && event.timestamp < targetEnd) target.push({ ...event, digest });
  }
  const baselineRequests = target.filter(event => baseline.has(event.digest)).length;
  const newCohortEvents = target.filter(event => !baseline.has(event.digest));
  const grouped = new Map();
  for (const event of newCohortEvents) {
    const item = grouped.get(event.digest) || { requests: 0, pageRequests: 0, statuses: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 0 }, services: {} };
    item.requests += 1;
    if ((event.method === 'GET' || event.method === 'HEAD') && !STATIC_ASSET.test(event.path)) item.pageRequests += 1;
    item.statuses[statusBucket(event.status)] += 1;
    const service = classifyService(event.path);
    item.services[service] = (item.services[service] || 0) + 1;
    grouped.set(event.digest, item);
  }
  const firstSeenToday = [...grouped.keys()].filter(digest => !priorPostStart.has(digest));
  const returning = [...grouped.keys()].filter(digest => priorPostStart.has(digest));
  const statusCounts = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 0 };
  const serviceCounts = {};
  let pageRequests = 0;
  for (const item of grouped.values()) {
    pageRequests += item.pageRequests;
    for (const [key, count] of Object.entries(item.statuses)) statusCounts[key] += count;
    for (const [key, count] of Object.entries(item.services)) serviceCounts[key] = (serviceCounts[key] || 0) + count;
  }
  const topIdentities = [...grouped.entries()].map(([digest, item]) => ({ alias: alias(digest), requests: item.requests, pageRequests: item.pageRequests, firstSeenToday: !priorPostStart.has(digest) })).sort((a, b) => b.requests - a.requests || a.alias.localeCompare(b.alias)).slice(0, 10);
  return {
    schemaVersion: 1,
    targetDate,
    baselineCutoff: `${startDate}T00:00:00+09:00`,
    baselineIdentityCount: baseline.size,
    externalRequests: target.length,
    baselineRequests,
    monitoredRequests: newCohortEvents.length,
    monitoredPageRequests: pageRequests,
    monitoredUniqueIdentities: grouped.size,
    firstSeenToday: firstSeenToday.length,
    returningPostStart: returning.length,
    ignoredPrivateRequests,
    statusCounts,
    serviceCounts: Object.fromEntries(Object.entries(serviceCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
    topIdentities,
    identityDigests: [...grouped.keys()].sort(),
  };
}

export function buildSlackMessage(report) {
  const services = Object.entries(report.serviceCounts).map(([name, count]) => `${name} ${count}건`).join(' · ') || '기준 외 접속 없음';
  const top = report.topIdentities.length ? report.topIdentities.slice(0, 5).map(item => `• ${item.alias}: ${item.requests}건${item.firstSeenToday ? ' · 오늘 첫 등장' : ' · 재방문'}`).join('\n') : '• 기준 외 식별자 0건';
  return [
    '🛡️ [Archive Alert] Atlas 비식별 접속 일일 모니터링',
    `기준일: ${report.targetDate} KST`,
    `기준: ${report.baselineCutoff} 이전 관측 IP ${report.baselineIdentityCount}개 제외`,
    `기준 외 식별자: ${report.monitoredUniqueIdentities}개 · 오늘 첫 등장 ${report.firstSeenToday}개 · 재방문 ${report.returningPostStart}개`,
    `요청: ${report.monitoredRequests}건 · 페이지 요청 ${report.monitoredPageRequests}건 · 기존 기준 IP 요청 ${report.baselineRequests}건`,
    `응답: 2xx ${report.statusCounts['2xx']} · 3xx ${report.statusCounts['3xx']} · 4xx ${report.statusCounts['4xx']} · 5xx ${report.statusCounts['5xx']}`,
    `서비스: ${services}`,
    '상위 비식별 접속:',
    top,
    '개인정보 보호: 원 IP는 Slack·일일 보고서에 저장/전송하지 않으며 서버 내부 HMAC 비교에만 사용합니다.',
  ].join('\n');
}

async function atomicJson(path, value) {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await chmod(temporary, 0o600);
  await rename(temporary, path);
}

async function loadJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error?.code === 'ENOENT') return fallback; throw error; }
}

async function logFiles(logDir) {
  const names = await readdir(logDir);
  return names.filter(name => /^access\.log(?:-|$)/.test(name)).sort().map(name => join(logDir, name));
}

async function readEvents(logDir) {
  const events = [];
  let malformedLines = 0;
  for (const path of await logFiles(logDir)) {
    const source = createReadStream(path);
    const input = path.endsWith('.gz') ? source.pipe(createGunzip()) : source;
    const lines = createInterface({ input, crlfDelay: Infinity });
    for await (const line of lines) {
      const event = parseNginxLine(line);
      if (event) events.push(event); else malformedLines += 1;
    }
  }
  return { events, malformedLines };
}

async function loadOrCreateSalt(path, persist) {
  if (existsSync(path)) return (await readFile(path, 'utf8')).trim();
  const salt = randomBytes(32).toString('hex');
  if (persist) {
    await writeFile(path, `${salt}\n`, { mode: 0o600 });
    await chmod(path, 0o600);
  }
  return salt;
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

function flags(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith('--')) continue;
    const key = argv[index].slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) { values.set(key, next); index += 1; }
    else values.set(key, true);
  }
  return values;
}

async function main() {
  const command = process.argv[2] || 'report';
  const options = flags(process.argv.slice(3));
  const dryRun = options.has('dry-run');
  const send = options.has('send');
  const stateDir = process.env.ATLAS_ACCESS_STATE_DIR || '/var/lib/atlas-access-monitor';
  const logDir = process.env.ATLAS_NGINX_LOG_DIR || '/var/log/nginx';
  const startDate = requiredDate(process.env.ATLAS_ACCESS_START_DATE || DEFAULT_START_DATE, 'ATLAS_ACCESS_START_DATE');
  const baselinePath = join(stateDir, 'baseline.json');
  const saltPath = join(stateDir, 'identity.key');
  const cohortPath = join(stateDir, 'post-start-identities.json');
  const reportsDir = join(stateDir, 'reports');
  if (!dryRun) { await mkdir(reportsDir, { recursive: true, mode: 0o700 }); await chmod(stateDir, 0o700); await chmod(reportsDir, 0o700); }
  const salt = await loadOrCreateSalt(saltPath, !dryRun);
  const { events, malformedLines } = await readEvents(logDir);
  if (command === 'baseline') {
    const cutoff = Date.parse(`${startDate}T00:00:00+09:00`);
    const identities = [...new Set(events.filter(event => event.timestamp < cutoff && isPublicAddress(event.ip)).map(event => identity(event.ip, salt)))].sort();
    const baseline = { schemaVersion: 1, cutoff: `${startDate}T00:00:00+09:00`, identityCount: identities.length, identities, source: 'retained nginx access logs', malformedLines, createdAt: new Date().toISOString() };
    if (!dryRun) await atomicJson(baselinePath, baseline);
    console.log(JSON.stringify({ mode: 'baseline', dryRun, cutoff: baseline.cutoff, identityCount: baseline.identityCount, malformedLines }, null, 2));
    return;
  }
  if (command !== 'report') throw new Error(`Unknown command: ${command}`);
  const targetDate = requiredDate(String(options.get('date') || dateBefore(kstDate(Date.now()))), '--date');
  if (targetDate < startDate) {
    console.log(JSON.stringify({ mode: 'report', skipped: true, reason: 'before monitoring start', targetDate, startDate }, null, 2));
    return;
  }
  const reportPath = join(reportsDir, `${targetDate}.json`);
  const existing = await loadJson(reportPath, null);
  if (existing?.delivered && !options.has('force')) {
    console.log(JSON.stringify({ mode: 'report', skipped: true, reason: 'already delivered', targetDate }, null, 2));
    return;
  }
  const baseline = await loadJson(baselinePath, null);
  if (!baseline || baseline.cutoff !== `${startDate}T00:00:00+09:00`) throw new Error('Finalized baseline is missing or has the wrong cutoff.');
  const cohortState = await loadJson(cohortPath, { schemaVersion: 1, identities: {} });
  const report = buildDailyReport({ events, baselineIdentities: new Set(baseline.identities), cohort: cohortState.identities, salt, targetDate, startDate });
  const message = buildSlackMessage(report);
  const publicReport = { ...report, identityDigests: undefined, malformedLines, messageSha256: createHash('sha256').update(message).digest('hex'), delivered: false, generatedAt: new Date().toISOString() };
  if (dryRun) {
    console.log(JSON.stringify({ mode: 'report', dryRun: true, report: publicReport, message }, null, 2));
    return;
  }
  if (send) await sendSlack(message);
  const nextCohort = { ...cohortState.identities };
  for (const digest of report.identityDigests) if (!nextCohort[digest]) nextCohort[digest] = { firstSeenDate: targetDate };
  await atomicJson(cohortPath, { schemaVersion: 1, updatedAt: new Date().toISOString(), identities: nextCohort });
  publicReport.delivered = send;
  publicReport.deliveredAt = send ? new Date().toISOString() : null;
  await atomicJson(reportPath, publicReport);
  console.log(JSON.stringify({ mode: 'report', targetDate, delivered: send, monitoredUniqueIdentities: report.monitoredUniqueIdentities, monitoredRequests: report.monitoredRequests, malformedLines }, null, 2));
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) main().catch(error => { console.error(`atlas-access-monitor: ${error.message}`); process.exitCode = 1; });
