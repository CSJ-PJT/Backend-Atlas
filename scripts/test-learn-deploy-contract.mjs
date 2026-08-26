import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const script = await readFile(resolve(root, 'ops/deploy-learn-release.sh'), 'utf8');

assert.match(script, /^#!/, 'deployment helper must have a shebang');
assert.match(script, /set -euo pipefail/, 'deployment helper must fail closed');
assert.match(script, /TARGET_ROOT=\/usr\/share\/nginx\/html\/learn/, 'deployment target must be scoped to /learn');
assert.match(script, /STAGE_PREFIX=\/tmp\/backend-atlas-release-/, 'deployment stage must use the constrained release prefix');
assert.match(script, /sourceHead mismatch/, 'deployment must validate exact source SHA');
assert.match(script, /asset hash mismatch/, 'deployment must validate every release asset');
assert.match(script, /sourceTreeState.*clean/, 'deployment must reject a dirty-source release');
assert.match(script, /learn\.backup-/, 'deployment must create a timestamped backup');
assert.match(script, /learn\.failed-/, 'deployment and rollback must preserve failed releases');
assert.match(script, /restorecon -RF/, 'deployment must restore SELinux content labels');
assert.doesNotMatch(script, /restorecon -RF "\$staged"/, 'deployment must not apply the /tmp default SELinux label before the atomic move');
const atomicMoveIndex = script.indexOf('mv -- "$staged" "$TARGET_ROOT"');
const targetRestoreconIndex = script.indexOf('restorecon -RF "$TARGET_ROOT"', atomicMoveIndex);
const operatingValidationIndex = script.indexOf('validate_tree "$TARGET_ROOT"', atomicMoveIndex);
assert.ok(atomicMoveIndex >= 0, 'deployment must atomically move the staged release into /learn');
assert.ok(targetRestoreconIndex > atomicMoveIndex, 'deployment must restore the target SELinux context after the atomic move');
assert.ok(operatingValidationIndex > targetRestoreconIndex, 'deployment must restore SELinux context before operating validation');
assert.match(script, /nginx -t/, 'deployment and rollback must validate Nginx');
assert.match(script, /rollback_release/, 'deployment helper must include rollback');
assert.doesNotMatch(script, /rm\s+-rf|git\s+(?:reset|clean|stash|rebase)|systemctl\s+reload\s+nginx/, 'helper must not delete history or reload unchanged Nginx configuration');

console.log('Learn deploy and rollback safety contract: PASS');
