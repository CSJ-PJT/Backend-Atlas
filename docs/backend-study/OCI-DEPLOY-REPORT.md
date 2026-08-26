# Backend Atlas `/learn` OCI 배포 계약

## 범위

배포 대상은 `/usr/share/nginx/html/learn` 하나뿐이다. Atlas-Management 및 다른 서비스 경로·Nginx 설정·DB를 변경하지 않는다.

## 절차

1. clean Git HEAD에서 `npm run test:release`
2. local `www/asset-manifest.json` SHA256 기록
3. OCI hostname/id/disk/inode 확인
4. 현재 `/usr/share/nginx/html/learn` timestamp backup
5. `/tmp/backend-atlas-learn-release-<timestamp>`에 전체 release stage
6. local/staged manifest parity 확인
7. 기존 `ops/deploy-learn-release.sh`로 원자 교체
8. root:root, directory 0755, file 0644, `httpd_sys_content_t` 확인
9. `nginx -t`, reload
10. operating disk manifest와 public `build-info.json`/asset graph 확인
11. `/learn/`, `/learn/backend-study/`, day deep link, `/learn/interview/`, PDF, `/run/` 호환 smoke
12. 하나라도 실패하면 timestamp backup으로 rollback

## 증거 원칙

- `sourceHead == public build-info.sourceHead`
- `local asset-manifest SHA256 == staged == operating == public build-info.assetManifestSha256`
- 배포 시점의 실제 SHA·release ID·HTTP 상태는 변경 불가능한 artifact/server 출력과 최종 작업 보고에 남긴다.
