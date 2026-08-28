import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const assert = (value, message) => { if (!value) throw new Error(message); };
const context = { window: {} };
vm.runInNewContext(await readFile(resolve(root, 'subjective-questions.js'), 'utf8'), context);
const publicBundle = context.window.ATLAS_SUBJECTIVE_QUESTIONS;
assert(publicBundle?.questions?.length === 500, 'review bank must contain exactly 500 backend questions');
assert(publicBundle.questions.every(question => !('companies' in question) && !('roles' in question)), 'public questions must omit employer fields');
assert(publicBundle.answerType === 'single-term-bilingual', 'review bank must use bilingual short answers');
assert(publicBundle.reviewStatus === 'public-reviewed', 'public bank must carry the reviewed release status');
assert(publicBundle.questions.every(question => question.answer && question.acceptedAnswers?.length && question.explanation), 'every public question must have a canonical term and explanation');
assert(publicBundle.questions.every(question => !('answerOutline' in question) && !('followUps' in question)), 'essay-answer fields must not remain in public questions');
assert(new Set(publicBundle.questions.map(question => question.id)).size === publicBundle.questions.length, 'all review question ids must be unique');
assert(new Set(publicBundle.questions.map(question => question.answer)).size === 50, 'the 500-question bank must cover exactly 50 audited backend terms');
const answerCounts = new Map();
for (const question of publicBundle.questions) answerCounts.set(question.answer, (answerCounts.get(question.answer) || 0) + 1);
assert([...answerCounts.values()].every(count => count === 10), 'each audited backend term must have exactly ten question formulations');
assert(publicBundle.questions.every(question => question.koreanAnswers?.some(answer => /[가-힣]/.test(answer))), 'every question must accept a Korean answer');
assert(publicBundle.questions.every(question => question.englishAnswers?.some(answer => /[A-Za-z]/.test(answer))), 'every question must accept an English answer');
assert(publicBundle.questions.every(question => ['system-design','java-algorithm','data-structure','java-concurrency','sql','data-modeling','debug-code-review','live-coding','refactoring'].includes(question.category)), 'every question must belong to an approved backend technical category');
assert(publicBundle.questions.every(question => !/원장|페이싱|광고|결제 금액|배송 단계|정산|지원 동기|STAR/.test(`${question.answer} ${question.question}`)), 'business-domain and behavioral prompts must not remain in the backend term bank');
assert(publicBundle.questions.every(question => !/한 개의 기술 용어|빈칸에 들어갈/.test(question.question)), 'awkward generated prompt variants must not remain');
const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/[\s_+().·-]/g, '');
assert(publicBundle.questions.every(question => question.acceptedAnswers.every(answer => normalize(answer).length <= 2 || !normalize(question.question).includes(normalize(answer)))), 'a prompt must not reveal an accepted answer');
for (const question of publicBundle.questions) {
  for (const answer of question.acceptedAnswers) {
    assert(normalize(answer) === normalize(answer.replace(/[\s-]/g, '')), `spacing or hyphen normalization failed: ${question.id}`);
    assert(normalize(answer) === normalize(answer.toLocaleUpperCase('en-US')), `case normalization failed: ${question.id}`);
  }
}

const sourceContext = { window: {} };
vm.runInNewContext(await readFile(resolve(root, 'interview/data/interview-data.js'), 'utf8'), sourceContext);
const privateBundle = sourceContext.window.INTERVIEW_LAB_DATA;
const output = JSON.stringify(publicBundle).toLocaleLowerCase('ko-KR');
for (const job of privateBundle.jobs || []) {
  assert(!output.includes(String(job.company).toLocaleLowerCase('ko-KR')), `company name leaked: ${job.company}`);
  assert(!output.includes(String(job.role).toLocaleLowerCase('ko-KR')), `role name leaked: ${job.role}`);
}

const html = await readFile(resolve(root, 'index.html'), 'utf8');
assert(/id="navInterviewBtn"[^>]*>주관식 문제</.test(html), 'reviewed subjective navigation must be public');
assert(/id="navQuizBtn"[^>]*>객관식 문제</.test(html), 'objective navigation must be clearly named');
assert(!/id="subjectiveView"[^>]*hidden/.test(html), 'reviewed subjective view must be public');
assert(html.indexOf('id="navQuizBtn"') < html.indexOf('id="navInterviewBtn"') && html.indexOf('id="navInterviewBtn"') < html.indexOf('id="navSearchBtn"'), 'objective and subjective navigation must appear without a blank slot before search');
assert(/id="subjectiveAnswer"[^>]*type="text"/.test(html), 'subjective answer must be a single-line text input');
assert(!/id="subjectiveAnswer"[^>]*textarea/.test(html), 'essay textarea must be removed');
assert(/id="interviewLabView"[^>]*hidden/.test(html), 'private Interview Lab must remain hidden');
console.log(`Public question modes PASS: ${publicBundle.questions.length} single-term short-answer questions plus the existing objective bank.`);
