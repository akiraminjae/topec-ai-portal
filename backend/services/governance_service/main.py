"""
거버넌스·감사·가드레일 — TOPEC AI 포털 공통 서비스 레이어

구축계획서 PDF 슬라이드 10 "권한 통제" 실행 기능(HITL 사전 승인, 도구 화이트리스트)을
실제 동작하는 승인함(approval inbox) API로 구현했습니다.

이 파일은 스캐폴드입니다. 저장소는 프로세스 메모리(in-memory list)이므로 재시작하면
초기화됩니다. TODO(개발팀): Postgres 등 영구 저장소로 교체, 실제 감사로그·가드레일 정책 연동.
"""
import itertools
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TOPEC AI Portal - 거버넌스·감사·가드레일")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_id_counter = itertools.count(1)

# 데모용 초기 승인 대기 항목 — PDF Use Case(제안서 작성 자동화, IT헬프데스크 등)에서 발생할 법한
# "중요 작업" 예시로 시드값을 채워둡니다.
_APPROVALS: dict[int, dict] = {}


def _seed():
    samples = [
        {"agent_name": "제안서 작성 자동화 에이전트", "action": "계약서류 세트 발송", "requested_by": "구매팀 · 김민재"},
        {"agent_name": "IT 헬프데스크 자동화 에이전트", "action": "사용자 VPN 접근 권한 부여", "requested_by": "IT팀"},
        {"agent_name": "예산 및 집행액 조회 에이전트", "action": "타 부서 예산 집행 상세 내역 열람", "requested_by": "재무팀"},
    ]
    for s in samples:
        i = next(_id_counter)
        _APPROVALS[i] = {"id": i, "status": "pending", **s}


_seed()


@app.get("/health")
async def health():
    return {"service": "governance_service", "status": "ok"}


@app.get("/governance/approvals")
async def list_approvals(status: str | None = None):
    """승인 대기함 목록 조회. status 쿼리파라미터로 필터링 가능 (pending/approved/rejected)."""
    items = list(_APPROVALS.values())
    if status:
        items = [a for a in items if a["status"] == status]
    return {"items": sorted(items, key=lambda a: a["id"], reverse=True)}


@app.post("/governance/approvals")
async def create_approval(request: Request):
    """예시 요청: {"agent_name": "...", "action": "send_email", "requested_by": "u1023"}"""
    payload = await request.json()
    i = next(_id_counter)
    item = {
        "id": i,
        "status": "pending",
        "agent_name": payload.get("agent_name", payload.get("agent_id", "unknown")),
        "action": payload.get("action", ""),
        "requested_by": payload.get("requested_by", ""),
    }
    _APPROVALS[i] = item
    return item


@app.post("/governance/approvals/{approval_id}/decide")
async def decide_approval(approval_id: int, request: Request):
    """예시 요청: {"decision": "approved"} 또는 {"decision": "rejected"}"""
    if approval_id not in _APPROVALS:
        raise HTTPException(status_code=404, detail="approval not found")
    payload = await request.json()
    decision = payload.get("decision")
    if decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="decision must be 'approved' or 'rejected'")
    _APPROVALS[approval_id]["status"] = decision
    return _APPROVALS[approval_id]
