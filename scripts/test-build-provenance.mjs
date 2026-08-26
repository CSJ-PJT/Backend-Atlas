import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'www');
const buildScript = resolve(root, 'scripts', 'build-web.mjs');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const releaseMode = process.argv.slice(2).includes('--release');

async function buildSnapshot() {
  await execFileAsync(process.execPath, [buildScript, ...(releaseMode ? ['--release'] : [])], { cwd: root, windowsHide: true });
  return {
    manifest: await readFile(resolve(out, 'asset-manifest.json'), 'utf8'),
    buildInfo: await readFile(resolve(out, 'build-info.json'), 'utf8')
  };
}

const first = await buildSnapshot();
const second = await buildSnapshot();
assert.equal(second.manifest, first.manifest, 'asset manifest must be byte-for-byte deterministic');
assert.equal(second.buildInfo, first.buildInfo, 'build info must be byte-for-byte deterministic');

const manifest = JSON.parse(second.manifest);
const buildInfo = JSON.parse(second.buildInfo);
assert.equal(manifest.schemaVersion, 1);
assert.equal(buildInfo.schemaVersion, 1);
assert.deepEqual(Object.keys(buildInfo), [
  'schemaVersion', 'sourceHead', 'sourceCommitTime', 'sourceTreeState',
  'assetManifest', 'assetManifestSha256', 'assetCount', 'releaseId'
]);
assert.ok(manifest.sourceHead === 'unknown' || /^[0-9a-f]{40}$/.test(manifest.sourceHead));
assert.equal(buildInfo.sourceHead, manifest.sourceHead);
assert.ok(['clean', 'dirty', 'unknown'].includes(buildInfo.sourceTreeState));
if (/^[0-9a-f]{40}$/.test(buildInfo.sourceHead)) {
  assert.equal(typeof buildInfo.sourceCommitTime, 'string');
  assert.ok(!Number.isNaN(Date.parse(buildInfo.sourceCommitTime)), 'commit time must be a valid timestamp');
}
if (releaseMode) {
  assert.match(buildInfo.sourceHead, /^[0-9a-f]{40}$/, 'release build requires an exact Git SHA');
  assert.equal(buildInfo.sourceTreeState, 'clean', 'release build requires tracked and untracked source cleanliness');
  assert.equal(typeof buildInfo.sourceCommitTime, 'string', 'release build requires a commit timestamp');
}
assert.equal(buildInfo.assetManifest, 'asset-manifest.json');
assert.equal(buildInfo.assetManifestSha256, sha256(second.manifest));
assert.equal(buildInfo.assetCount, manifest.files.length);
assert.equal(buildInfo.releaseId, `${buildInfo.sourceHead.slice(0, 12)}-${buildInfo.assetManifestSha256.slice(0, 12)}`);

const paths = manifest.files.map(file => file.path);
assert.deepEqual(paths, [...paths].sort(), 'manifest paths must use a stable sort order');
assert.equal(new Set(paths).size, paths.length, 'manifest paths must be unique');
for (const requiredAsset of ['curriculum-data.js', 'learning-visuals.js', 'app.js', 'learning-os.js']) {
  assert.ok(paths.includes(requiredAsset), `${requiredAsset} must be included in the release manifest`);
}
const builtWorker = await readFile(resolve(out, 'sw.js'), 'utf8');
assert.doesNotMatch(builtWorker, /CACHE_VERSION = 'source-dev'|PRECACHE_ASSETS = \['\.\/'\]/, 'release worker placeholders must be replaced');
assert.match(builtWorker, /const CACHE_VERSION = '[a-f0-9]{24}';/, 'release worker cache version must be deterministic');
for (const requiredOfflineAsset of ['./index.html', './app.js', './interview/interview-lab.js', './interview/data/interview-data.js']) {
  assert.ok(builtWorker.includes(JSON.stringify(requiredOfflineAsset)), `${requiredOfflineAsset} must be precached`);
}
for (const file of manifest.files) {
  assert.match(file.path, /^(?!\/|[A-Za-z]:|.*\.\.)(?:[A-Za-z0-9._ -]+\/)*[A-Za-z0-9._ -]+$/);
  assert.match(file.sha256, /^[0-9a-f]{64}$/);
  const contents = await readFile(resolve(out, ...file.path.split('/')));
  const metadata = await stat(resolve(out, ...file.path.split('/')));
  assert.equal(file.sha256, sha256(contents), `${file.path} hash mismatch`);
  assert.equal(file.size, metadata.size, `${file.path} size mismatch`);
}

console.log(`Build provenance PASS${releaseMode ? ' (release mode)' : ''}: ${manifest.files.length} assets, ${buildInfo.assetManifestSha256}`);
