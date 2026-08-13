"""
MCP/API 게이트웨이 — TOPEC AI 포털

아키텍처 4번째 레이어. 모든 사내 시스템·외부 도구 연동, 그리고 LLM 하이브리드 라우팅이
이 게이트웨이를 단일 경유합니다. (구축계획서 슬라이드 5, 11 참고)

이 스캐폴드는 다음을 실제로 동작하도록 구현했습니다:
  - POST /chat            사용자 메시지를 받아 라우팅 기준에 따라 외부 API/사내 서빙으로 전달
  - POST /route/preview    실제 호출 없이 라우팅 결정만 미리 확인 (빌더 스튜디오 디버깅용)
  - GET  /health

/chat 호출마다 결과(경로/공급자/성공여부/지연시간)를 observability_service에 best-effort로
전송합니다 (백그라운드 태스크 — 응답 지연에 영향 없음).

POST /chat은 인증이 필요합니다 — Authorization: Bearer <token> 헤더를 auth_service의
GET /auth/me로 검증합니다 (실제 세션 검증은 auth_service가 담당, 여기서는 위임만).

TODO(개발팀): governance_service 사전승인(HITL) 체크,
사내 시스템 커넥터(그룹웨어·전자결재·ERP) 추가
"""
import os
import time

import httpx
from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from routing import RoutingCriteria, LLMRoute, decide_route
from llm_client import llm_client

OBSERVABILITY_SERVICE_URL = os.environ.get("OBSERVABILITY_SERVICE_URL", "http://observability-service:8104")
AUTH_SERVICE_URL = os.environ.get("AUTH_SERVICE_URL", "http://auth-service:8106")

app = FastAPI(title="TOPEC AI Portal - MCP/API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    system: str | None = None
    agent: str = ""
    # 라우팅 기준 (실제 운영시엔 사용자/부서/업무 메타데이터로부터 자동 산출 — TODO)
    data_sensitivity: str = "public"          # public | internal | sensitive | confidential
    performance_requirement: str = "normal"    # low | normal | high
    daily_call_volume: int = 0
    security_grade: str = "standard"           # standard | high | restricted
    force_route: str | None = None             # "external_api" | "internal_serving" (테스트/디버깅용 강제 지정)


@app.get("/health")
async def health():
    return {"service": "gateway", "status": "ok"}


async def require_auth(authorization: str | None = Header(default=None)) -> dict:
    """auth_service에 세션 검증을 위임합니다. 401/기타 오류를 그대로 게이트웨이 호출자에게
    전달합니다. auth_service 자체가 응답하지 않으면 502로 처리합니다."""
    if not authorization:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{AUTH_SERVICE_URL}/auth/me", headers={"Authorization": authorization})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"auth_service에 연결할 수 없습니다: {e}")
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    return resp.json()


@app.post("/route/preview")
async def route_preview(req: ChatRequest):
    """실제 LLM을 호출하지 않고, 이 요청이 어느 경로로 라우팅될지만 미리 보여줍니다."""
    criteria = RoutingCriteria(
        data_sensitivity=req.data_sensitivity,
        performance_requirement=req.performance_requirement,
        daily_call_volume=req.daily_call_volume,
        security_grade=req.security_grade,
    )
    decision = decide_route(criteria)
    return {
        "route": decision.route.value,
        "reason": decision.reason,
        "score": decision.score,
    }


@app.post("/chat")
async def chat(req: ChatRequest, background_tasks: BackgroundTasks, user: dict = Depends(require_auth)):
    """대화형 인터페이스에서 오는 요청의 실제 진입점. 로그인(Authorization: Bearer <token>)이
    필요합니다.

    1) 라우팅 기준으로 EXTERNAL_API / INTERNAL_SERVING 결정 (force_route로 강제 지정 가능)
    2) 선택된 경로로 LLM 호출
    3) observability_service에 결과 로그 전송 (백그라운드, best-effort)
    TODO(개발팀): governance_service 사전승인(HITL) 체크
    """
    if req.force_route in (LLMRoute.EXTERNAL_API.value, LLMRoute.INTERNAL_SERVING.value):
        route = LLMRoute(req.force_route)
        reason = "force_route 파라미터로 강제 지정됨"
        score = None
    else:
        criteria = RoutingCriteria(
            data_sensitivity=req.data_sensitivity,
            performance_requirement=req.performance_requirement,
            daily_call_volume=req.daily_call_volume,
            security_grade=req.security_grade,
        )
        decision = decide_route(criteria)
        route, reason, score = decision.route, decision.reason, decision.score

    started = time.perf_counter()
    if route == LLMRoute.INTERNAL_SERVING:
        result = await llm_client.generate_internal(req.message, req.system or "")
    else:
        result = await llm_client.generate_external(req.message, req.system or "")
    latency_ms = int((time.perf_counter() - started) * 1000)

    background_tasks.add_task(_log_event, route.value, result, req.agent, latency_ms)

    return {
        "routing": {"route": route.value, "reason": reason, "score": score},
        "result": result,
    }


async def _log_event(route: str, result: dict, agent: str, latency_ms: int) -> None:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(
                f"{OBSERVABILITY_SERVICE_URL}/observability/events",
                json={
                    "route": route,
                    "provider": result.get("provider", ""),
                    "agent": agent,
                    "ok": bool(result.get("ok")),
                    "latency_ms": latency_ms,
                    "error": result.get("error"),
                },
            )
    except Exception:
        pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8100")))
