import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const scanRoots = ['backend-study', 'data/backend-study'];
const files = [];
async function walk(relative) {
  for (const entry of await readdir(resolve(root, relative), { withFileTypes: true })) {
    const child = `${relative}/${entry.name}`;
    if (entry.isDirectory()) await walk(child);
    else files.push(child);
  }
}
for (const directory of scanRoots) await walk(directory);
const patterns = [
  /BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY/i,
  /service[_-]?role/i,
  /(?:api[_-]?key|password)\s*[:=]\s*["'][^"']{6,}/i,
  /(?:sk|sbp)_[A-Za-z0-9_-]{20,}/,
  /\b(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/,
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  /희망연봉|지원 현황|입사|채용 지원/
];
for (const file of files) {
  // The quality contract intentionally contains the forbidden marker strings;
  // all of its upstream content files are scanned independently below.
  if (file.endsWith('quality-contract.json') || file.endsWith('backend-study-data.js')) continue;
  const text = (await readFile(resolve(root, file), 'utf8')).replaceAll('127.0.0.1', 'LOOPBACK');
  for (const pattern of patterns) assert.equal(pattern.test(text), false, `${file} matched ${pattern}`);
}
console.log(`Backend Study secret/privacy scan PASS: ${files.length} files.`);
