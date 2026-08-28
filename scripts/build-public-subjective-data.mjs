import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

globalThis.window = {};
await import('../interview/data/interview-data.js');

const bundle = globalThis.window.INTERVIEW_LAB_DATA;
if (!bundle?.questions?.length) throw new Error('Interview question bundle is unavailable');

const forbidden = [...new Set((bundle.jobs || []).flatMap(job => [job.company, job.role]).filter(Boolean))];
const questions = bundle.questions
  .filter(question => question.scope === 'shared')
  .filter(question => !(question.companies || []).length && !(question.roles || []).length)
  .map(question => ({
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    question: question.question,
    answerOutline: (question.answerOutline || []).slice(0, 5),
    followUps: (question.followUps || []).slice(0, 3),
    tags: (question.tags || []).slice(0, 6),
  }));

if (questions.length < 300) throw new Error(`Too few public subjective questions: ${questions.length}`);
const serialized = JSON.stringify({ schemaVersion: 1, generatedAt: bundle.generatedAt, questions });
for (const value of forbidden) {
  if (value && serialized.toLocaleLowerCase('ko-KR').includes(value.toLocaleLowerCase('ko-KR'))) {
    throw new Error(`Employer-specific value leaked into public subjective data: ${value}`);
  }
}

const output = `window.ATLAS_SUBJECTIVE_QUESTIONS=${serialized};\n`;
await writeFile(resolve(import.meta.dirname, '..', 'subjective-questions.js'), output, 'utf8');
console.log(`Public subjective data built: ${questions.length} shared questions; employer and candidate scopes excluded.`);
