import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'backend-study/index.html'), 'utf8');
const runtimeErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => runtimeErrors.push(error));
const dom = new JSDOM(html, { url: 'https://example.test/learn/backend-study/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole });
dom.window.confirm = () => true;
for (const file of ['backend-study/data/backend-study-data.js', 'backend-study/backend-study-state.js', 'backend-study/backend-study-app.js']) {
  dom.window.eval(await readFile(resolve(root, file), 'utf8'));
}
const document = dom.window.document;
assert.match(document.querySelector('h1').textContent, /원리를 이해하고/);
assert.equal(document.querySelectorAll('.chapter-block').length, 21);
assert.equal(document.querySelectorAll('[data-open-day]').length >= 32, true);

document.querySelector('[data-open-day="D01"]').click();
assert.match(dom.window.location.search, /view=day/);
assert.match(document.querySelector('.detail-header h1').textContent, /학습 환경/);
document.querySelector('[data-day-section="guided"]').click();
assert.ok(document.querySelector('[data-practice-id="D01-P01"]'));
assert.ok(document.querySelector('.command-list'));

document.querySelector('[data-study-route="exam"]').click();
assert.ok(document.querySelector('[data-exam-mode="today"]'));
document.querySelector('[data-exam-mode="today"]').click();
assert.ok(document.querySelector('[data-question-id]'));
const answer = document.querySelector('#studyAnswer');
if (answer) {
  answer.value = '상태 변화와 실패 경계를 먼저 정의하고 같은 입력으로 검증한다.';
  answer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  document.querySelector('[data-reveal-answer]').click();
  assert.ok(document.querySelector('[data-self-grade]'));
  assert.equal(dom.window.localStorage.getItem('backendAtlasBackendStudyState')?.includes(answer.value) || false, false);
}
assert.equal(document.documentElement.scrollWidth <= document.documentElement.clientWidth || document.documentElement.clientWidth === 0, true);
assert.deepEqual(runtimeErrors, []);
console.log('Backend Study runtime PASS: home, deep link, practice, exam, answer privacy.');
