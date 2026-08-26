import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dataRoot = resolve(root, 'data/backend-study');
const output = resolve(root, 'backend-study/data/backend-study-data.js');
const names = ['curriculum', 'question-bank', 'practice-bank', 'source-manifest', 'quality-contract', 'review-manifest'];
const values = {};
for (const name of names) values[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = JSON.parse(await readFile(resolve(dataRoot, `${name}.json`), 'utf8'));

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `window.BACKEND_STUDY_DATA = Object.freeze(${JSON.stringify(values, null, 2)});\n`, 'utf8');
console.log(`Backend Study web data built: ${values.curriculum.chapters.length} chapters, ${values.curriculum.days.length} days, ${values.questionBank.questions.length} questions.`);
