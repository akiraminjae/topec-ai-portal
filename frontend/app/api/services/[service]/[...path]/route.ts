import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "@/lib/proxy";

// 공통 서비스 6종 — docker-compose 서비스명/포트와 매칭
const SERVICE_ENV: Record<string, string> = {
  document: "DOCUMENT_SERVICE_URL",
  knowledge: "KNOWLEDGE_SERVICE_URL",
  "agent-lifecycle": "AGENT_LIFECYCLE_SERVICE_URL",
  observability: "OBSERVABILITY_SERVICE_URL",
  governance: "GOVERNANCE_SERVICE_URL",
  auth: "AUTH_SERVICE_URL",
};

const SERVICE_DEFAULT_PORT: Record<string, number> = {
  document: 8101,
  knowledge: 8102,
  "agent-lifecycle": 8103,
  observability: 8104,
  governance: 8105,
  auth: 8106,
};

async function handler(req: NextRequest, { params }: { params: Promise<{ service: string; path: string[] }> }) {
  const { service, path } = await params;
  const envKey = SERVICE_ENV[service];
  if (!envKey) {
    return NextResponse.json({ detail: `알 수 없는 서비스: ${service}` }, { status: 404 });
  }
  const base = process.env[envKey] || `http://localhost:${SERVICE_DEFAULT_PORT[service]}`;
  return proxyRequest(req, base, path ?? []);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
