/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:8100";
    // 공통 서비스 6종 — Admin 페이지의 상태 대시보드에서 사용 (docker-compose 서비스명/포트와 매칭)
    const services = {
      document: process.env.DOCUMENT_SERVICE_URL || "http://localhost:8101",
      knowledge: process.env.KNOWLEDGE_SERVICE_URL || "http://localhost:8102",
      "agent-lifecycle": process.env.AGENT_LIFECYCLE_SERVICE_URL || "http://localhost:8103",
      observability: process.env.OBSERVABILITY_SERVICE_URL || "http://localhost:8104",
      governance: process.env.GOVERNANCE_SERVICE_URL || "http://localhost:8105",
      auth: process.env.AUTH_SERVICE_URL || "http://localhost:8106",
    };
    return [
      { source: "/api/gateway/:path*", destination: `${gatewayUrl}/:path*` },
      ...Object.entries(services).map(([name, url]) => ({
        source: `/api/services/${name}/:path*`,
        destination: `${url}/:path*`,
      })),
    ];
  },
};

module.exports = nextConfig;
