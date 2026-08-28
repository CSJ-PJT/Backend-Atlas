import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const assert = (value, message) => { if (!value) throw new Error(message); };
const context = { window: {} };
vm.runInNewContext(await readFile(resolve(root, 'subjective-questions.js'), 'utf8'), context);
const publicBundle = context.window.ATLAS_SUBJECTIVE_QUESTIONS;
assert(publicBundle?.questions?.length >= 300, 'public subjective bank must contain the reviewed shared questions');
assert(publicBundle.questions.every(question => !('companies' in question) && !('roles' in question)), 'public questions must omit employer fields');

const sourceContext = { window: {} };
vm.runInNewContext(await readFile(resolve(root, 'interview/data/interview-data.js'), 'utf8'), sourceContext);
const privateBundle = sourceContext.window.INTERVIEW_LAB_DATA;
const output = JSON.stringify(publicBundle).toLocaleLowerCase('ko-KR');
for (const job of privateBundle.jobs || []) {
  assert(!output.includes(String(job.company).toLocaleLowerCase('ko-KR')), `company name leaked: ${job.company}`);
  assert(!output.includes(String(job.role).toLocaleLowerCase('ko-KR')), `role name leaked: ${job.role}`);
}

const html = await readFile(resolve(root, 'index.html'), 'utf8');
assert(/id="navInterviewBtn"[^>]*>주관식 문제</.test(html), 'subjective navigation must be public');
assert(/id="navQuizBtn"[^>]*>객관식 문제</.test(html), 'objective navigation must be clearly named');
assert(html.indexOf('id="navInterviewBtn"') < html.indexOf('id="navQuizBtn"') && html.indexOf('id="navQuizBtn"') < html.indexOf('id="navSearchBtn"'), 'question modes must sit together before search');
assert(/id="interviewLabView"[^>]*hidden/.test(html), 'private Interview Lab must remain hidden');
console.log(`Public question modes PASS: ${publicBundle.questions.length} anonymous subjective questions plus the existing objective bank.`);
