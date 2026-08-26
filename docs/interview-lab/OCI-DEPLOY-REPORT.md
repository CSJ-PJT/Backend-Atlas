# OCI Deploy Report

상태: **NOT DEPLOYED — USER APPROVAL REQUIRED**

대상은 로컬 보호 설정으로 해석하는 `opc@<ATLAS_PUBLIC_HOST>`의 `/usr/share/nginx/html/learn` 하나뿐이다. 실제 호스트 주소는 Git 산출물에 기록하지 않으며, 현재 운영 manifest와 backup 경로는 배포 승인 직전에 다시 읽는다.

## 승인 후 절차

1. SSH, hostname, id, `df -h`, `df -i`
2. 현재 `/usr/share/nginx/html/learn` manifest 기록
3. `learn.backup-<UTC timestamp>` 생성, 기존 backup 보존
4. clean release 전체를 `/tmp/backend-atlas-release-<SHA>-<UTC>`에 stage
5. local/staged manifest exact parity 및 서버에 별도 전송한 `/tmp/deploy-learn-release.sh deploy <stage> <SHA> <manifest SHA>` 검증
6. owner root:root, dir 0755, file 0644, `restorecon`
7. `/learn`만 원자 교체
8. `nginx -t`, reload
9. disk/public build-info와 asset graph parity
10. `/run/` 호환과 다른 Atlas route 회귀

## rollback

canary 실패 시 `sudo /tmp/deploy-learn-release.sh rollback <learn.backup-UTC>` 계약으로 새 운영 디렉터리를 별도 실패 경로에 보존하고 timestamp backup을 `/usr/share/nginx/html/learn`으로 복원한다. `nginx -t`와 public manifest 확인 후에만 rollback 완료로 보고한다. 정적 자산만 교체하므로 Nginx 설정과 다른 Atlas 경로는 수정하거나 불필요하게 reload하지 않는다.
