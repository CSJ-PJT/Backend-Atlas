import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'www');
const releaseMode = process.argv.slice(2).includes('--release');
const assets = [
  'index.html', 'styles.css', 'learning-os.css', 'questions.js', 'question-expander.js',
  'ax-question-extension.js', 'learning-os-data.js', 'atlas-content.js', 'curriculum-data.js', 'developer-guide-data.js', 'learning-visuals.js', 'app.js', 'learning-os.js',
  'manifest.webmanifest', 'sw.js', 'assets/backend-atlas-icon.png'
];

const sha256 = value => createHash('sha256').update(value).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const git = async args => {
  try {
    const { stdout } = await execFileAsync('git', args, { cwd: root, windowsHide: true });
    return { ok: true, value: stdout.trim() };
  } catch (error) {
    return { ok: false, value: '', error };
  }
};

const readSourceState = async () => {
  const [head, commitTime, status] = await Promise.all([
    git(['rev-parse', '--verify', 'HEAD']),
    git(['show', '-s', '--format=%cI', 'HEAD']),
    git([
      'status', '--porcelain=v1', '--untracked-files=all', '--', '.',
      ':(exclude)www', ':(exclude)www/**'
    ])
  ]);
  return {
    head: head.ok ? head.value : 'unknown',
    commitTime: commitTime.ok && commitTime.value ? commitTime.value : null,
    treeState: status.ok ? (status.value ? 'dirty' : 'clean') : 'unknown',
    changes: status.ok ? status.value : null
  };
};

const validHead = value => /^[0-9a-f]{40}$/.test(String(value || ''));
const validCommitTime = value => typeof value === 'string'
  && value.length > 0
  && !Number.isNaN(Date.parse(value));
const assertReleaseSource = (source, phase) => {
  const failures = [];
  if (!validHead(source.head)) failures.push('Git HEAD is unavailable or is not an exact 40-character SHA');
  if (!validCommitTime(source.commitTime)) failures.push('Git commit time is unavailable or invalid');
  if (source.treeState !== 'clean') failures.push('tracked or untracked source changes exist outside www');
  if (failures.length) {
    throw new Error(`Release build refused during ${phase}: ${failures.join('; ')}`);
  }
};

const sourceAtStart = await readSourceState();
if (releaseMode) assertReleaseSource(sourceAtStart, 'preflight');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await mkdir(resolve(out, 'assets'), { recursive: true });
await Promise.all(assets.map(file => cp(resolve(root, file), resolve(out, file))));

if (releaseMode) {
  const sourceAtEnd = await readSourceState();
  assertReleaseSource(sourceAtEnd, 'post-build verification');
  if (sourceAtEnd.head !== sourceAtStart.head || sourceAtEnd.commitTime !== sourceAtStart.commitTime) {
    throw new Error('Release build refused: Git HEAD changed while assets were being built');
  }
}

const sourceHead = sourceAtStart.head;
const sourceCommitTime = sourceAtStart.commitTime;
const files = await Promise.all([...assets].sort().map(async file => {
  const contents = await readFile(resolve(out, file));
  const metadata = await stat(resolve(out, file));
  return { path: file.replaceAll('\\', '/'), sha256: sha256(contents), size: metadata.size };
}));
const manifestName = 'asset-manifest.json';
const manifestContents = json({ schemaVersion: 1, sourceHead, files });
await writeFile(resolve(out, manifestName), manifestContents, 'utf8');

const assetManifestSha256 = sha256(manifestContents);
const buildInfo = {
  schemaVersion: 1,
  sourceHead,
  sourceCommitTime,
  sourceTreeState: sourceAtStart.treeState,
  assetManifest: manifestName,
  assetManifestSha256,
  assetCount: files.length,
  releaseId: `${sourceHead.slice(0, 12)}-${assetManifestSha256.slice(0, 12)}`
};
await writeFile(resolve(out, 'build-info.json'), json(buildInfo), 'utf8');

console.log(`Built ${assets.length} web assets plus deterministic provenance into ${out}${releaseMode ? ' (release mode)' : ''}`);
