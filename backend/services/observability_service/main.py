"""
관측·모니터링 — TOPEC AI 포털 공통 서비스 레이어
에이전트 실행 로그·성능 지표·오류율을 수집하는 공통 서비스

이 파일은 스캐폴드(skeleton)입니다. 실제 비즈니스 로직은 TODO 표시된 부분에
개발팀이 채워 넣어야 합니다.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TOPEC AI Portal - 관측·모니터링")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"service": "observability_service", "status": "ok"}


@app.post("/observability/events")
async def handle(request: Request):
    """예시 요청: {"agent_id": "agt_1001", "event": "run_completed", "latency_ms": 820}"""
    payload = await request.json()
    return {
        "received": True,
        "event": payload.get("event"),
        "note": "TODO: 시계열 DB(Prometheus 등) 연동 및 대시보드 구현 필요",
    }
