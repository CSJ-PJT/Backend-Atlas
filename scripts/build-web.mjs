import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'www');
const releaseMode = process.argv.slice(2).includes('--release');
const baseAssets = [
  'index.html', 'styles.css', 'learning-os.css', 'questions.js', 'question-expander.js',
  'ax-question-extension.js', 'learning-os-data.js', 'atlas-content.js', 'curriculum-data.js', 'developer-guide-data.js', 'learning-visuals.js', 'app.js', 'learning-os.js',
  'manifest.webmanifest', 'sw.js', 'assets/backend-atlas-icon.png'
];
const listFiles = async directory => {
  const absolute = resolve(root, directory);
  const entries = await readdir(absolute, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const child = `${directory}/${entry.name}`;
    return entry.isDirectory() ? listFiles(child) : [child];
  }));
  return nested.flat();
};
const assets = [...baseAssets, ...(await listFiles('interview')), ...(await listFiles('data/interview'))]
  .map(file => file.replaceAll('\\', '/')).sort();

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
  const [head, commitTime, unstaged, staged, untracked] = await Promise.all([
    git(['rev-parse', '--verify', 'HEAD']),
    git(['show', '-s', '--format=%cI', 'HEAD']),
    git(['diff', '--name-only', '--', '.', ':(exclude)www', ':(exclude)www/**']),
    git(['diff', '--cached', '--name-only', '--', '.', ':(exclude)www', ':(exclude)www/**']),
    git(['ls-files', '--others', '--exclude-standard', '--', '.', ':(exclude)www', ':(exclude)www/**'])
  ]);
  const statusOk=unstaged.ok&&staged.ok&&untracked.ok;
  const changes=statusOk?[unstaged.value,staged.value,untracked.value].filter(Boolean).join('\n'):null;
  return {
    head: head.ok ? head.value : 'unknown',
    commitTime: commitTime.ok && commitTime.value ? commitTime.value : null,
    treeState: statusOk ? (changes ? 'dirty' : 'clean') : 'unknown',
    changes
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
await Promise.all(assets.map(async file => {
  const target=resolve(out,file);
  await mkdir(dirname(target),{recursive:true});
  await cp(resolve(root,file),target);
}));

const swPath = resolve(out, 'sw.js');
const cacheInputs = await Promise.all(assets.filter(file => file !== 'sw.js').sort().map(async file => {
  const contents = await readFile(resolve(out, file));
  return `${file}\0${sha256(contents)}`;
}));
const cacheVersion = sha256(cacheInputs.join('\n')).slice(0, 24);
const precacheAssets = ['./index.html', ...assets.filter(file => file !== 'index.html' && file !== 'sw.js').map(file => `./${file}`)];
const swSource = await readFile(swPath, 'utf8');
const releaseWorker = swSource
  .replace("const CACHE_VERSION = 'source-dev';", `const CACHE_VERSION = '${cacheVersion}';`)
  .replace("const PRECACHE_ASSETS = ['./'];", `const PRECACHE_ASSETS = ${JSON.stringify(precacheAssets)};`);
if (releaseWorker === swSource) throw new Error('Service worker release placeholders were not found');
await writeFile(swPath, releaseWorker, 'utf8');

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
