// 게이트웨이/공통 서비스로의 리버스 프록시 공통 로직.
//
// 원래는 next.config.js의 rewrites()로 이 프록시를 구현했지만, Next.js는 rewrites()를
// `next build` 시점에 한 번 평가해 routes-manifest.json에 destination을 고정해버립니다.
// docker-compose의 environment: 값은 `docker build` 시점이 아니라 컨테이너 실행 시점에만
// 주입되므로, 빌드 시점엔 항상 기본값(http://localhost:PORT)이 쓰였고 컨테이너 간 통신이
// 실제로는 전부 ECONNREFUSED로 실패하고 있었습니다. Route Handler(이 파일이 쓰이는 방식)는
// 매 요청마다 실행되는 진짜 서버 코드라 process.env를 런타임에 제대로 읽습니다.
import { NextRequest, NextResponse } from "next/server";

export async function proxyRequest(req: NextRequest, targetBase: string, pathSegments: string[]) {
  const target = `${targetBase}/${pathSegments.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const hasBody = !["GET", "HEAD"].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  let res: Response;
  try {
    res = await fetch(target, { method: req.method, headers, body });
  } catch (err) {
    return NextResponse.json(
      { detail: `프록시 대상(${targetBase})에 연결할 수 없습니다: ${String(err)}` },
      { status: 502 }
    );
  }

  const resHeaders = new Headers(res.headers);
  resHeaders.delete("content-encoding");
  resHeaders.delete("transfer-encoding");
  const resBody = await res.arrayBuffer();
  return new NextResponse(resBody, { status: res.status, headers: resHeaders });
}
