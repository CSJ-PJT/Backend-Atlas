import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const readJson = async name => JSON.parse(await readFile(resolve(root, `data/backend-study/${name}.json`), 'utf8'));
const [curriculum, practices, questions, manifest, reviews] = await Promise.all([
  readJson('curriculum'), readJson('practice-bank'), readJson('question-bank'), readJson('source-manifest'), readJson('review-manifest')
]);
const sources = new Map(manifest.sources.map(source => [source.id, source]));
const used = new Set();
const assertRefs = item => {
  assert.ok(item.sourceRefs?.length, `${item.id} has no sources`);
  for (const id of item.sourceRefs) {
    const source = sources.get(id);
    assert.ok(source, `${item.id} references missing ${id}`);
    assert.match(source.url, /^https:\/\//);
    assert.equal(source.reviewStatus, 'reviewed');
    assert.ok(['official-primary', 'authoritative-secondary', 'peer-reviewed-direct'].includes(source.authority));
    used.add(id);
  }
};
[...curriculum.days, ...practices.practices, ...questions.questions].forEach(assertRefs);
assert.equal(reviews.curriculumDays.filter(item => item.reviewStatus === 'reviewed').length, 32);
assert.equal(reviews.practices.filter(item => item.reviewStatus === 'reviewed').length, 32);
assert.equal(reviews.questions.filter(item => item.reviewStatus === 'reviewed').length, 192);
assert.ok(used.size >= 40, `Only ${used.size} sources are used`);
console.log(`Backend Study source coverage PASS: ${used.size}/${sources.size} reviewed sources used.`);
