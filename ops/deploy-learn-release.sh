#!/usr/bin/env bash
set -euo pipefail

TARGET_ROOT=/usr/share/nginx/html/learn
TARGET_PARENT=/usr/share/nginx/html
STAGE_PREFIX=/tmp/backend-atlas-release-

die() {
  printf 'deploy-learn-release: %s\n' "$*" >&2
  exit 1
}

require_root() {
  [[ ${EUID} -eq 0 ]] || die 'run with sudo/root'
}

validate_tree() {
  local release_dir=$1
  local expected_head=$2
  local expected_manifest=$3

  [[ -d ${release_dir} ]] || die "release directory does not exist: ${release_dir}"
  [[ -f ${release_dir}/build-info.json ]] || die 'build-info.json is missing'
  [[ -f ${release_dir}/asset-manifest.json ]] || die 'asset-manifest.json is missing'
  [[ ${expected_head} =~ ^[0-9a-f]{40}$ ]] || die 'expected source SHA must be an exact lowercase Git SHA'
  [[ ${expected_manifest} =~ ^[0-9a-f]{64}$ ]] || die 'expected manifest SHA must be lowercase SHA-256'

  python3 - "$release_dir" "$expected_head" "$expected_manifest" <<'PY'
import hashlib
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1]).resolve()
expected_head = sys.argv[2]
expected_manifest = sys.argv[3]
build_info_path = root / 'build-info.json'
manifest_path = root / 'asset-manifest.json'
manifest_bytes = manifest_path.read_bytes()
manifest_sha = hashlib.sha256(manifest_bytes).hexdigest()
build_info = json.loads(build_info_path.read_text(encoding='utf-8'))
manifest = json.loads(manifest_bytes)

if manifest_sha != expected_manifest:
    raise SystemExit(f'manifest file SHA mismatch: {manifest_sha}')
if build_info.get('sourceHead') != expected_head or manifest.get('sourceHead') != expected_head:
    raise SystemExit('sourceHead mismatch')
if build_info.get('sourceTreeState') != 'clean':
    raise SystemExit('release was not built from a clean tree')
if build_info.get('assetManifestSha256') != expected_manifest:
    raise SystemExit('build-info manifest SHA mismatch')

for item in manifest.get('files', []):
    relative = pathlib.PurePosixPath(item['path'])
    if relative.is_absolute() or '..' in relative.parts:
        raise SystemExit(f'unsafe manifest path: {relative}')
    path = (root / pathlib.Path(*relative.parts)).resolve()
    if root not in path.parents:
        raise SystemExit(f'manifest path escaped release root: {relative}')
    contents = path.read_bytes()
    if len(contents) != item['size']:
        raise SystemExit(f'asset size mismatch: {relative}')
    if hashlib.sha256(contents).hexdigest() != item['sha256']:
        raise SystemExit(f'asset hash mismatch: {relative}')

print(json.dumps({
    'sourceHead': expected_head,
    'assetManifestSha256': expected_manifest,
    'assetCount': len(manifest.get('files', [])),
    'releaseId': build_info.get('releaseId'),
}))
PY
}

deploy_release() {
  local staged_input=$1
  local expected_head=$2
  local expected_manifest=$3
  local staged
  staged=$(readlink -f -- "$staged_input")
  [[ ${staged} == ${STAGE_PREFIX}* ]] || die "staged release must stay under ${STAGE_PREFIX}*"
  [[ -d ${TARGET_ROOT} ]] || die "current learn root is missing: ${TARGET_ROOT}"

  validate_tree "$staged" "$expected_head" "$expected_manifest"

  local stamp backup failed switched=0
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  backup="${TARGET_PARENT}/learn.backup-${stamp}"
  failed="${TARGET_PARENT}/learn.failed-${stamp}"
  [[ ! -e ${backup} && ! -e ${failed} ]] || die 'timestamped backup path already exists'

  chown -R root:root "$staged"
  find "$staged" -type d -exec chmod 0755 {} +
  find "$staged" -type f -exec chmod 0644 {} +
  command -v restorecon >/dev/null 2>&1 && restorecon -RF "$staged"

  rollback_on_error() {
    local exit_code=$?
    if [[ ${switched} -eq 1 ]]; then
      [[ -d ${TARGET_ROOT} ]] && mv -- "$TARGET_ROOT" "$failed"
      [[ -d ${backup} ]] && mv -- "$backup" "$TARGET_ROOT"
      command -v restorecon >/dev/null 2>&1 && restorecon -RF "$TARGET_ROOT"
    fi
    exit "$exit_code"
  }
  trap rollback_on_error ERR

  mv -- "$TARGET_ROOT" "$backup"
  switched=1
  mv -- "$staged" "$TARGET_ROOT"
  validate_tree "$TARGET_ROOT" "$expected_head" "$expected_manifest"
  nginx -t
  trap - ERR

  printf 'DEPLOYED_ROOT=%s\nBACKUP_ROOT=%s\n' "$TARGET_ROOT" "$backup"
}

rollback_release() {
  local backup_input=$1
  local backup
  backup=$(readlink -f -- "$backup_input")
  [[ ${backup} == ${TARGET_PARENT}/learn.backup-* ]] || die 'rollback source must be a timestamped learn backup'
  [[ -d ${backup} ]] || die "backup does not exist: ${backup}"
  [[ -d ${TARGET_ROOT} ]] || die "current learn root is missing: ${TARGET_ROOT}"

  local stamp failed
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  failed="${TARGET_PARENT}/learn.failed-${stamp}"
  [[ ! -e ${failed} ]] || die 'timestamped failed-release path already exists'
  mv -- "$TARGET_ROOT" "$failed"
  if ! mv -- "$backup" "$TARGET_ROOT"; then
    mv -- "$failed" "$TARGET_ROOT"
    die 'rollback swap failed; original operating release restored'
  fi
  command -v restorecon >/dev/null 2>&1 && restorecon -RF "$TARGET_ROOT"
  nginx -t
  printf 'ROLLED_BACK_ROOT=%s\nFAILED_RELEASE_ROOT=%s\n' "$TARGET_ROOT" "$failed"
}

require_root
case ${1:-} in
  deploy)
    [[ $# -eq 4 ]] || die 'usage: deploy <staged-dir> <source-sha> <asset-manifest-sha256>'
    deploy_release "$2" "$3" "$4"
    ;;
  rollback)
    [[ $# -eq 2 ]] || die 'usage: rollback <learn.backup-UTC>'
    rollback_release "$2"
    ;;
  *)
    die 'usage: deploy <staged-dir> <source-sha> <asset-manifest-sha256> | rollback <learn.backup-UTC>'
    ;;
esac
