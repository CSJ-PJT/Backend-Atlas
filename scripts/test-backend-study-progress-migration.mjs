import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const root = resolve(import.meta.dirname, '..');
const source = await readFile(resolve(root, 'backend-study/backend-study-state.js'), 'utf8');
const dom = new JSDOM('<!doctype html>', { url: 'https://example.test/learn/backend-study/', runScripts: 'outside-only' });
dom.window.eval(source);
const api = dom.window.BackendStudyState;
assert.equal(api.SCHEMA_VERSION, 1);

const migrated = api.normalizeState({ schemaVersion: 0, completedDays: ['D01', 'D32', 'D99'], wrongAnswers: ['D01-Q01', 'bad'], answer: 'must-not-survive' });
assert.deepEqual(Object.keys(migrated.days), ['D01', 'D32']);
assert.deepEqual([...migrated.wrong], ['D01-Q01']);
assert.equal(JSON.stringify(migrated).includes('must-not-survive'), false);

const dirty = api.normalizeState({ schemaVersion: 1, days: { D01: { sections: { learn: true, '<script>': true } }, BAD: {} }, lastVisited: 'javascript:alert(1)', reviewQueue: [{ questionId: 'D01-Q01', dueAt: 'bad' }] });
assert.deepEqual(Object.keys(dirty.days), ['D01']);
assert.equal(dirty.lastVisited, null);
assert.equal(dirty.reviewQueue.length, 0);

const memory = new Map();
const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
const persisted = api.write(api.completeDay(api.createInitialState(), 'D01'), storage);
assert.ok(persisted.days.D01.completedAt);
assert.ok(api.read(storage).days.D01.completedAt);
console.log('Backend Study progress migration PASS: v0 migration, corrupt recovery, answer exclusion.');
