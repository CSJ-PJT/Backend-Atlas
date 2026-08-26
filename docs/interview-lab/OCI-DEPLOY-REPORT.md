# OCI Deploy Report

상태: **DEPLOYED — DISK/PUBLIC PARITY PASS**

대상은 로컬 보호 설정으로 해석한 `opc@<ATLAS_PUBLIC_HOST>`의 `/usr/share/nginx/html/learn` 하나뿐이었다. 실제 호스트 주소와 credential은 Git 산출물에 기록하지 않는다.

## release

- 이전 release ID: `090c2ddb7a97-dcc2be168e57`
- 이전 source: `090c2ddb7a9739a5671efc3ece2af15aa154a294`
- 이전 manifest: `dcc2be168e5723fa2b61a6be050158e3a384108d81638909de6c1b5c547f08ed`
- 배포 release ID: `44fcb49db2ef-bfc9396de936`
- 배포 source: `44fcb49db2effe5cd5f49caa57cfd4c9be078008`
- 배포 manifest: `bfc9396de936cffd938044169f9f3c3aa5b217938ee41c903135e03f8468220a`
- manifest asset: 44개, 운영 파일: 46개
- backup: `/usr/share/nginx/html/learn.backup-20260826T042255Z`

## 검증

- local archive와 server stage SHA/parity: PASS
- stage와 operating manifest: PASS
- public 44개 asset hash/size/content-type: PASS
- owner `root:root`, directory `0755`, file `0644`: mismatch 0
- SELinux `httpd_sys_content_t`: mismatch 0
- `nginx -t`: PASS
- 내부·공개 `/learn/`: HTTP 200
- public browser 390×844·412×915: overflow 0, console warning/error 0
- `/run`·`/run/`: 기존 `/learn/` redirect 유지
- 다른 Atlas route status contract: PASS

## incident와 재발 방지

최초 switch 직후 `/tmp` stage의 `user_tmp_t`가 운영 target에 남아 `/learn/`이 일시적으로 403이었다. target에 `restorecon`을 적용해 즉시 복구했으며, 배포 helper는 `mv -- "$staged" "$TARGET_ROOT"` 다음에 `restorecon -RF "$TARGET_ROOT"`을 실행하도록 `a65015d9d914f6ed22e7af229fcd9698d9136d11`에서 수정했다. 관련 contract test도 추가해 `/tmp` stage에 직접 `restorecon`하는 회귀를 거부한다.

## rollback

필요 시 repository의 검증된 helper를 서버 임시 경로에 전송한 뒤 `sudo <helper> rollback /usr/share/nginx/html/learn.backup-20260826T042255Z`를 실행한다. 계약상 현재 운영본을 `learn.failed-<UTC>`에 보존하고 backup을 원자 복원한 뒤 target SELinux context와 `nginx -t`를 검증한다. 현재 canary가 PASS이므로 rollback은 실행하지 않았다.
