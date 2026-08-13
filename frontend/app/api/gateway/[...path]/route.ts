import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:8100";
  return proxyRequest(req, gatewayUrl, path ?? []);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
