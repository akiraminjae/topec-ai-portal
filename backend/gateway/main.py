"""
MCP/API 게이트웨이 — TOPEC AI 포털

아키텍처 4번째 레이어. 모든 사내 시스템·외부 도구 연동, 그리고 LLM 하이브리드 라우팅이
이 게이트웨이를 단일 경유합니다. (구축계획서 슬라이드 5, 11 참고)

이 스캐폴드는 다음을 실제로 동작하도록 구현했습니다:
  - POST /chat            사용자 메시지를 받아 라우팅 기준에 따라 외부 API/사내 서빙으로 전달
  - POST /route/preview    실제 호출 없이 라우팅 결정만 미리 확인 (빌더 스튜디오 디버깅용)
  - GET  /health

TODO(개발팀): 공통 서비스(governance/observability/auth) 실제 연동, 인증 미들웨어,
사내 시스템 커넥터(그룹웨어·전자결재·ERP) 추가
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from routing import RoutingCriteria, LLMRoute, decide_route
from llm_client import llm_client

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
    # 라우팅 기준 (실제 운영시엔 사용자/부서/업무 메타데이터로부터 자동 산출 — TODO)
    data_sensitivity: str = "public"          # public | internal | sensitive | confidential
    performance_requirement: str = "normal"    # low | normal | high
    daily_call_volume: int = 0
    security_grade: str = "standard"           # standard | high | restricted
    force_route: str | None = None             # "external_api" | "internal_serving" (테스트/디버깅용 강제 지정)


@app.get("/health")
async def health():
    return {"service": "gateway", "status": "ok"}


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
async def chat(req: ChatRequest):
    """대화형 인터페이스에서 오는 요청의 실제 진입점.

    1) 라우팅 기준으로 EXTERNAL_API / INTERNAL_SERVING 결정 (force_route로 강제 지정 가능)
    2) 선택된 경로로 LLM 호출
    3) TODO: governance_service 사전승인(HITL) 체크, observability_service 로그 전송
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

    if route == LLMRoute.INTERNAL_SERVING:
        result = await llm_client.generate_internal(req.message, req.system or "")
    else:
        result = await llm_client.generate_external(req.message, req.system or "")

    return {
        "routing": {"route": route.value, "reason": reason, "score": score},
        "result": result,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8100")))
