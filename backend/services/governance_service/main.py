"""
거버넌스·감사·가드레일 — TOPEC AI 포털 공통 서비스 레이어

구축계획서 PDF 슬라이드 10 "권한 통제" 실행 기능(HITL 사전 승인, 도구 화이트리스트)을
실제 동작하는 승인함(approval inbox) API로 구현했습니다.

저장소는 PostgreSQL(운영, DATABASE_URL 지정 시) 또는 SQLite(로컬 폴백)입니다 — db.py, models.py 참고.
TODO(개발팀): 실제 감사로그·가드레일 정책 연동.
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from db import Base, SessionLocal, engine
from models import Approval

app = FastAPI(title="TOPEC AI Portal - 거버넌스·감사·가드레일")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def _serialize(a: Approval) -> dict:
    return {
        "id": a.id,
        "agent_name": a.agent_name,
        "action": a.action,
        "requested_by": a.requested_by,
        "status": a.status,
    }


def _seed():
    """데모용 초기 승인 대기 항목 — PDF Use Case에서 발생할 법한 "중요 작업" 예시.
    이미 데이터가 있으면(= 두 번째 이후 시작) 건드리지 않습니다."""
    samples = [
        {"agent_name": "제안서 작성 자동화 에이전트", "action": "계약서류 세트 발송", "requested_by": "구매팀 · 김민재"},
        {"agent_name": "IT 헬프데스크 자동화 에이전트", "action": "사용자 VPN 접근 권한 부여", "requested_by": "IT팀"},
        {"agent_name": "예산 및 집행액 조회 에이전트", "action": "타 부서 예산 집행 상세 내역 열람", "requested_by": "재무팀"},
    ]
    with SessionLocal() as db:
        if db.query(Approval).count() > 0:
            return
        for s in samples:
            db.add(Approval(status="pending", **s))
        db.commit()


_seed()


@app.get("/health")
async def health():
    return {"service": "governance_service", "status": "ok"}


@app.get("/governance/approvals")
async def list_approvals(status: str | None = None):
    """승인 대기함 목록 조회. status 쿼리파라미터로 필터링 가능 (pending/approved/rejected)."""
    with SessionLocal() as db:
        query = db.query(Approval)
        if status:
            query = query.filter(Approval.status == status)
        items = [_serialize(a) for a in query.order_by(Approval.id.desc()).all()]
    return {"items": items}


@app.post("/governance/approvals")
async def create_approval(request: Request):
    """예시 요청: {"agent_name": "...", "action": "send_email", "requested_by": "u1023"}"""
    payload = await request.json()
    with SessionLocal() as db:
        item = Approval(
            agent_name=payload.get("agent_name", payload.get("agent_id", "unknown")),
            action=payload.get("action", ""),
            requested_by=payload.get("requested_by", ""),
            status="pending",
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return _serialize(item)


@app.post("/governance/approvals/{approval_id}/decide")
async def decide_approval(approval_id: int, request: Request):
    """예시 요청: {"decision": "approved"} 또는 {"decision": "rejected"}"""
    payload = await request.json()
    decision = payload.get("decision")
    if decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="decision must be 'approved' or 'rejected'")
    with SessionLocal() as db:
        item = db.get(Approval, approval_id)
        if not item:
            raise HTTPException(status_code=404, detail="approval not found")
        item.status = decision
        db.commit()
        db.refresh(item)
        return _serialize(item)
