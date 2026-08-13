/** @type {import('next').NextConfig} */
// 게이트웨이/공통 서비스 프록시는 next.config.js의 rewrites()가 아니라
// app/api/gateway/[...path]/route.ts, app/api/services/[service]/[...path]/route.ts
// (Route Handler)로 구현되어 있습니다. rewrites()는 next build 시점에 destination을
// 고정해버려 docker-compose 런타임 환경변수를 반영하지 못하는 문제가 있었습니다
// (자세한 설명은 frontend/lib/proxy.ts 상단 주석 참고).
const nextConfig = {};

module.exports = nextConfig;
