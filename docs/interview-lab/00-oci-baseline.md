# OCI `/learn/` 기준선

## 인스턴스

- host: `route-atlas-vnic`
- SSH principal: `opc`
- root filesystem: 30G total, 21G used, 8.7G free, 71%
- inode usage: 2%
- `nginx -t`: PASS
- TLS: TLS 1.3, trusted Let's Encrypt certificate

## 현재 배포 provenance

- root: `/usr/share/nginx/html/learn`
- owner/mode: `root:root`, directory 0755
- SELinux: `httpd_sys_content_t`
- sourceHead: `090c2ddb7a9739a5671efc3ece2af15aa154a294`
- sourceCommitTime: `2026-08-25T23:23:27+09:00`
- sourceTreeState: `clean`
- asset count: 16
- asset manifest SHA-256: `dcc2be168e5723fa2b61a6be050158e3a384108d81638909de6c1b5c547f08ed`
- releaseId: `090c2ddb7a97-dcc2be168e57`
- deployed index SHA-256: `5c8d733e84c8acc3118b3924510440f3f9bc0a424b064232146a580a00575d62`

현재 개발 기준 `c03bcee`의 clean release manifest는 `0f28b3db5c37a86650912750b8cd3119f49d7692c18b33e97e01595ffe841e76`이다. 따라서 Phase 0 시점에는 `SOURCE_BUILD_MATCH_OPERATING=NO`이며 이는 아직 배포 전인 정상적인 기준선이다.

## cache/runtime

- `sw.js`는 install 시 `skipWaiting`, activate 시 `clients.claim`
- fetch handler는 network-only이며 Cache Storage에서 이전 asset을 제공하지 않음
- `/learn/` HTML과 stable assets는 Nginx에서 no-cache
- 브라우저 console warning/error 0

## Nginx 보호 경계

`/learn/`만 `/usr/share/nginx/html/learn/` alias로 제공되고 fallback은 `/learn/index.html`이다. `/run`과 `/run/`은 `/learn/`로 308 redirect한다. Sketchfy, Incruit, Health, Travel, World, Archive, ArchiveOS, root SPA, API proxy, Atlas admin API는 별도 location/root/upstream을 사용한다.

Phase 0에서는 Nginx config와 `/usr/share/nginx/html/learn`을 수정하지 않았다. 향후 배포도 `/learn/` release unit만 timestamp backup 후 원자 교체하고, 다른 Atlas 경로의 public HTTP/hash regression을 전후 비교해야 한다.

