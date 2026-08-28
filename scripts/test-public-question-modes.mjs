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
assert(publicBundle.answerType === 'single-term', 'public subjective bank must use short answers');
assert(publicBundle.questions.every(question => question.answer && question.acceptedAnswers?.length && question.explanation), 'every public question must have a canonical term and explanation');
assert(publicBundle.questions.every(question => !('answerOutline' in question) && !('followUps' in question)), 'essay-answer fields must not remain in public questions');
const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/[\s_+().·-]/g, '');
assert(publicBundle.questions.every(question => question.acceptedAnswers.every(answer => normalize(answer).length <= 2 || !normalize(question.question).includes(normalize(answer)))), 'a prompt must not reveal an accepted answer');

const sourceContext = { window: {} };
vm.runInNewContext(await readFile(resolve(root, 'interview/data/interview-data.js'), 'utf8'), sourceContext);
const privateBundle = sourceContext.window.INTERVIEW_LAB_DATA;
const output = JSON.stringify(publicBundle).toLocaleLowerCase('ko-KR');
for (const job of privateBundle.jobs || []) {
  assert(!output.includes(String(job.company).toLocaleLowerCase('ko-KR')), `company name leaked: ${job.company}`);
  assert(!output.includes(String(job.role).toLocaleLowerCase('ko-KR')), `role name leaked: ${job.role}`);
}

const html = await readFile(resolve(root, 'index.html'), 'utf8');
assert(/id="navInterviewBtn"[^>]*hidden[^>]*aria-hidden="true"[^>]*>주관식 문제</.test(html), 'subjective navigation must stay private while the bank is under review');
assert(/id="navQuizBtn"[^>]*>객관식 문제</.test(html), 'objective navigation must be clearly named');
assert(/id="subjectiveView"[^>]*hidden[^>]*aria-hidden="true"/.test(html), 'subjective view must stay hidden while the bank is under review');
assert(/id="subjectiveAnswer"[^>]*type="text"/.test(html), 'subjective answer must be a single-line text input');
assert(!/id="subjectiveAnswer"[^>]*textarea/.test(html), 'essay textarea must be removed');
assert(/id="interviewLabView"[^>]*hidden/.test(html), 'private Interview Lab must remain hidden');
console.log(`Public question modes PASS: ${publicBundle.questions.length} single-term short-answer questions plus the existing objective bank.`);
