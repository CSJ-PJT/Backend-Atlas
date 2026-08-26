import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const readJson = async name => JSON.parse(await readFile(resolve(root, `data/backend-study/${name}.json`), 'utf8'));
const [curriculum, practices, questions, sources, contract, reviews] = await Promise.all([
  readJson('curriculum'), readJson('practice-bank'), readJson('question-bank'), readJson('source-manifest'), readJson('quality-contract'), readJson('review-manifest')
]);

assert.equal(curriculum.schemaVersion, 1);
assert.equal(curriculum.title, '백엔드 실무 학습');
assert.equal(curriculum.chapters.length, contract.requiredChapterCount);
assert.equal(curriculum.days.length, contract.requiredDayCount);
assert.equal(practices.practices.length, 32);
assert.equal(questions.questions.length, 192);
assert.ok(sources.sources.length >= 50);
assert.equal(reviews.curriculumDays.length, 32);
const dayIds = new Set(curriculum.days.map(day => day.id));
const practiceIds = new Set(practices.practices.map(practice => practice.id));
const questionIds = new Set(questions.questions.map(question => question.id));
const sourceIds = new Set(sources.sources.map(source => source.id));
assert.equal(dayIds.size, 32);
assert.equal(practiceIds.size, 32);
assert.equal(questionIds.size, 192);

for (const day of curriculum.days) {
  assert.match(day.id, /^D(?:0[1-9]|[12]\d|3[0-2])$/);
  for (const field of contract.requiredDaySections) assert.ok(day[field], `${day.id}.${field} is required`);
  for (const field of contract.requiredLearnSections) assert.ok(day.learn[field], `${day.id}.learn.${field} is required`);
  assert.equal(day.reviewStatus, 'reviewed');
  assert.equal(day.guidedPracticeIds.length, 1);
  assert.equal(day.independentPracticeIds.length, 1);
  assert.equal(day.quizIds.length, 6);
  for (const id of [...day.guidedPracticeIds, ...day.independentPracticeIds]) assert.ok(practiceIds.has(id), `${id} is missing`);
  for (const id of day.quizIds) assert.ok(questionIds.has(id), `${id} is missing`);
  for (const id of day.sourceRefs) assert.ok(sourceIds.has(id), `${id} is missing`);
}

for (const practice of practices.practices) {
  assert.ok(dayIds.has(`D${String(practice.day).padStart(2, '0')}`));
  for (const field of ['goal', 'prerequisites', 'environment', 'setup', 'commands', 'steps', 'guidedSteps', 'independentSteps', 'failureInjection', 'observe', 'verify', 'regression', 'completionCriteria', 'rubric', 'sourceRefs']) assert.ok(practice[field], `${practice.id}.${field} is required`);
  assert.equal(Object.values(practice.rubric).reduce((sum, score) => sum + score, 0), 100);
}

for (const question of questions.questions) {
  assert.ok(contract.supportedQuizTypes.includes(question.type));
  assert.ok(question.prompt && question.correctAnswer && question.explanation);
  assert.ok(question.sourceRefs.length && question.officialRefs.length);
  assert.equal(question.reviewStatus, 'reviewed');
}

console.log(`Backend Study schema PASS: ${curriculum.chapters.length} chapters, ${curriculum.days.length} days, ${practices.practices.length} practices, ${questions.questions.length} questions.`);
