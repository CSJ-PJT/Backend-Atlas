import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const auditScript = resolve(root, 'scripts', 'content-quality-audit.mjs');
const reportJson = resolve(root, 'reports', 'content-quality-report.json');
const reportMarkdown = resolve(root, 'reports', 'content-quality-report.md');

async function auditSnapshot() {
  await execFileAsync(process.execPath, [auditScript], { cwd: root, windowsHide: true });
  return {
    json: await readFile(reportJson, 'utf8'),
    markdown: await readFile(reportMarkdown, 'utf8')
  };
}

const first = await auditSnapshot();
const second = await auditSnapshot();
assert.equal(second.json, first.json, 'JSON quality report must be byte-for-byte deterministic');
assert.equal(second.markdown, first.markdown, 'Markdown quality report must be byte-for-byte deterministic');

const parsed = JSON.parse(second.json);
assert.match(parsed.generatedAt, /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/, 'report timestamp must derive from the versioned review contract');
assert.ok(second.markdown.includes(`Generated: ${parsed.generatedAt}`), 'Markdown and JSON report versions must agree');

console.log(`Content quality audit determinism PASS: ${parsed.generatedAt}`);
