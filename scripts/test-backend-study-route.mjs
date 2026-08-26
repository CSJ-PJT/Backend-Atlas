import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
await stat(resolve(root, 'backend-study/index.html'));
await stat(resolve(root, 'interview/index.html'));
const [rootHtml, studyHtml, app, build] = await Promise.all([
  readFile(resolve(root, 'index.html'), 'utf8'),
  readFile(resolve(root, 'backend-study/index.html'), 'utf8'),
  readFile(resolve(root, 'app.js'), 'utf8'),
  readFile(resolve(root, 'scripts/build-web.mjs'), 'utf8')
]);
assert.match(rootHtml, /id="backendStudyBtn"/);
assert.match(app, /\.\/backend-study\//);
assert.match(studyHtml, /<title>백엔드 실무 학습/);
assert.match(studyHtml, /href="\.\.\/"/);
assert.match(build, /listFiles\('backend-study'\)/);
assert.match(build, /listFiles\('data\/backend-study'\)/);
assert.doesNotMatch(studyHtml, /희망연봉|지원 현황|채용 지원/);
console.log('Backend Study route PASS: standalone /learn/backend-study/ and root entry contract.');
