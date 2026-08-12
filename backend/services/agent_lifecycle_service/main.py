"""
에이전트 라이프사이클 관리 — TOPEC AI 포털 공통 서비스 레이어
에이전트 생성·배포·버전관리·폐기 등 전 주기를 관리하는 공통 서비스

이 파일은 스캐폴드(skeleton)입니다. 실제 비즈니스 로직은 TODO 표시된 부분에
개발팀이 채워 넣어야 합니다.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TOPEC AI Portal - 에이전트 라이프사이클 관리")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"service": "agent_lifecycle_service", "status": "ok"}


@app.post("/agents/register")
async def handle(request: Request):
    """예시 요청: {"name": "법령질의응답봇", "owner": "총무팀", "version": "0.1.0"}"""
    payload = await request.json()
    agent_id = "agt_" + str(abs(hash(payload.get("name", ""))) % 100000)
    return {
        "agent_id": agent_id,
        "status": "registered",
        "note": "TODO: 실제 배포 파이프라인 및 버전 관리 연동 필요",
    }
