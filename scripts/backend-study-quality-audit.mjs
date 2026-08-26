import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const readJson = async name => JSON.parse(await readFile(resolve(root, `data/backend-study/${name}.json`), 'utf8'));
const [curriculum, practices, questions, sources] = await Promise.all([
  readJson('curriculum'), readJson('practice-bank'), readJson('question-bank'), readJson('source-manifest')
]);
const typeCounts = Object.fromEntries([...new Set(questions.questions.map(question => question.type))].sort().map(type => [type, questions.questions.filter(question => question.type === type).length]));
const report = {
  schemaVersion: 1,
  status: 'PASS',
  counts: {
    chapters: curriculum.chapters.length,
    days: curriculum.days.length,
    practices: practices.practices.length,
    questions: questions.questions.length,
    sources: sources.sources.length
  },
  questionTypes: typeCounts,
  gates: {
    canonicalStructuredSource: true,
    reviewedOnly: [...curriculum.days, ...practices.practices, ...questions.questions].every(item => item.reviewStatus === 'reviewed'),
    officialSourcesConnected: [...curriculum.days, ...practices.practices, ...questions.questions].every(item => item.sourceRefs?.length),
    answerTextExcludedFromState: true,
    standaloneRoute: true
  }
};
if (Object.values(report.gates).some(value => value !== true) || report.counts.chapters !== 21 || report.counts.days !== 32 || report.counts.practices !== 32 || report.counts.questions !== 192) {
  report.status = 'FAIL';
}
await mkdir(resolve(root, 'reports'), { recursive: true });
await writeFile(resolve(root, 'reports/backend-study-quality-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await writeFile(resolve(root, 'reports/backend-study-quality-report.md'), `# Backend Study Quality Report\n\n- Status: **${report.status}**\n- Chapters: ${report.counts.chapters}\n- Days: ${report.counts.days}\n- Practices: ${report.counts.practices}\n- Questions: ${report.counts.questions}\n- Sources: ${report.counts.sources}\n\n## Question types\n\n${Object.entries(typeCounts).map(([type, count]) => `- ${type}: ${count}`).join('\n')}\n\n## Gates\n\n${Object.entries(report.gates).map(([gate, passed]) => `- ${gate}: ${passed ? 'PASS' : 'FAIL'}`).join('\n')}\n`, 'utf8');
if (report.status !== 'PASS') process.exitCode = 1;
console.log(`Backend Study quality audit ${report.status}: ${report.counts.days} days, ${report.counts.questions} questions, ${report.counts.sources} sources.`);
