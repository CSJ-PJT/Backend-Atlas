import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'www');
const assets = [
  'index.html', 'styles.css', 'learning-os.css', 'questions.js', 'question-expander.js',
  'ax-question-extension.js', 'learning-os-data.js', 'atlas-content.js', 'app.js', 'learning-os.js',
  'manifest.webmanifest', 'sw.js', 'assets/backend-atlas-icon.png'
];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await mkdir(resolve(out, 'assets'), { recursive: true });
await Promise.all(assets.map(file => cp(resolve(root, file), resolve(out, file))));
console.log(`Built ${assets.length} web assets into ${out}`);
