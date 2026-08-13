"""
에이전트 라이프사이클 관리 — TOPEC AI 포털 공통 서비스 레이어
에이전트 생성·배포(게시)·버전관리·폐기 등 전 주기를 관리하는 공통 서비스.

Studio(빌더, `frontend/app/builder`)가 여기로 에이전트를 저장하고,
Marketplace(`frontend/app/marketplace`)는 status=published 인 에이전트만 조회합니다.

저장소는 PostgreSQL(운영, DATABASE_URL 지정 시) 또는 SQLite(로컬 폴백)입니다 — db.py, models.py 참고.
TODO(개발팀): 실제 배포 파이프라인(에이전트 실행 런타임 연결) 연동 필요 — 지금은 메타데이터
등록/버전관리/상태전이만 수행합니다.
"""
import json
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from db import Base, SessionLocal, engine
from models import Agent

app = FastAPI(title="TOPEC AI Portal - 에이전트 라이프사이클 관리")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

_VALID_STATUSES = {"draft", "pending_approval", "published", "archived"}


def _serialize(a: Agent) -> dict:
    return {
        "agent_id": a.agent_id,
        "name": a.name,
        "description": a.description,
        "system_prompt": a.system_prompt,
        "tools": json.loads(a.tools_json),
        "owner": a.owner,
        "status": a.status,
        "version": a.version,
        "created_at": a.created_at,
        "updated_at": a.updated_at,
    }


@app.get("/health")
async def health():
    return {"service": "agent_lifecycle_service", "status": "ok"}


@app.post("/agents")
async def create_agent(request: Request):
    """예시 요청: {"name": "법령질의응답봇", "description": "...", "system_prompt": "...",
    "tools": ["document_search"], "owner": "총무팀"}. 항상 status=draft로 생성됩니다."""
    payload = await request.json()
    name = payload.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=422, detail="name은 필수입니다")

    now = datetime.now(timezone.utc).isoformat()
    with SessionLocal() as db:
        agent = Agent(
            agent_id=f"agt_{uuid.uuid4().hex[:10]}",
            name=name,
            description=payload.get("description", ""),
            system_prompt=payload.get("system_prompt", ""),
            tools_json=json.dumps(payload.get("tools", []), ensure_ascii=False),
            owner=payload.get("owner", ""),
            status="draft",
            version=1,
            created_at=now,
            updated_at=now,
        )
        db.add(agent)
        db.commit()
        db.refresh(agent)
        return _serialize(agent)


@app.get("/agents")
async def list_agents(status: str | None = None, owner: str | None = None):
    """에이전트 목록. status(draft/pending_approval/published/archived), owner로 필터링 가능."""
    with SessionLocal() as db:
        query = db.query(Agent)
        if status:
            query = query.filter(Agent.status == status)
        if owner:
            query = query.filter(Agent.owner == owner)
        items = [_serialize(a) for a in query.order_by(Agent.id.desc()).all()]
    return {"items": items}


@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    with SessionLocal() as db:
        agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="agent not found")
        return _serialize(agent)


@app.put("/agents/{agent_id}")
async def update_agent(agent_id: str, request: Request):
    """이름/설명/시스템프롬프트/도구를 수정합니다. 저장할 때마다 version이 1 증가합니다."""
    payload = await request.json()
    with SessionLocal() as db:
        agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="agent not found")
        if "name" in payload:
            agent.name = payload["name"]
        if "description" in payload:
            agent.description = payload["description"]
        if "system_prompt" in payload:
            agent.system_prompt = payload["system_prompt"]
        if "tools" in payload:
            agent.tools_json = json.dumps(payload["tools"], ensure_ascii=False)
        agent.version += 1
        agent.updated_at = datetime.now(timezone.utc).isoformat()
        db.commit()
        db.refresh(agent)
        return _serialize(agent)


@app.post("/agents/{agent_id}/status")
async def change_status(agent_id: str, request: Request):
    """예시 요청: {"status": "published"}. status는 draft/pending_approval/published/archived 중 하나."""
    payload = await request.json()
    status = payload.get("status")
    if status not in _VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status는 {sorted(_VALID_STATUSES)} 중 하나여야 합니다")
    with SessionLocal() as db:
        agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="agent not found")
        agent.status = status
        agent.updated_at = datetime.now(timezone.utc).isoformat()
        db.commit()
        db.refresh(agent)
        return _serialize(agent)
