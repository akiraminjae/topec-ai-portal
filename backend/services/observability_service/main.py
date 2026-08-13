"""
관측·모니터링 — TOPEC AI 포털 공통 서비스 레이어
에이전트/게이트웨이 실행 로그·성능 지표·오류율을 수집하는 공통 서비스.

gateway가 /chat을 처리할 때마다 결과(경로/공급자/성공여부/지연시간)를 이 서비스의
POST /observability/events로 best-effort 전송합니다 (`backend/gateway/main.py` 참고).
Admin 대시보드(`frontend/app/admin`)가 GET /observability/stats를 조회해 실데이터를 표시합니다.

저장소는 PostgreSQL(운영, DATABASE_URL 지정 시) 또는 SQLite(로컬 폴백)입니다 — db.py, models.py 참고.
TODO(개발팀): Prometheus 등 시계열 DB 연동, 장기 보관·롤업 정책.
"""
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

from db import Base, SessionLocal, engine
from models import RequestLog

app = FastAPI(title="TOPEC AI Portal - 관측·모니터링")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.get("/health")
async def health():
    return {"service": "observability_service", "status": "ok"}


@app.post("/observability/events")
async def log_event(request: Request):
    """예시 요청: {"route": "external_api", "provider": "anthropic", "agent": "Ara",
    "ok": true, "latency_ms": 820, "error": null}"""
    payload = await request.json()
    with SessionLocal() as db:
        log = RequestLog(
            route=payload.get("route", ""),
            provider=payload.get("provider", ""),
            agent=payload.get("agent", ""),
            ok=bool(payload.get("ok", True)),
            latency_ms=int(payload.get("latency_ms", 0)),
            error=payload.get("error"),
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        db.add(log)
        db.commit()
    return {"received": True}


@app.get("/observability/logs")
async def list_logs(limit: int = 50):
    with SessionLocal() as db:
        rows = db.query(RequestLog).order_by(RequestLog.id.desc()).limit(min(limit, 500)).all()
        items = [
            {
                "id": r.id,
                "route": r.route,
                "provider": r.provider,
                "agent": r.agent,
                "ok": r.ok,
                "latency_ms": r.latency_ms,
                "error": r.error,
                "created_at": r.created_at,
            }
            for r in rows
        ]
    return {"items": items}


@app.get("/observability/stats")
async def stats():
    today = datetime.now(timezone.utc).date().isoformat()
    with SessionLocal() as db:
        total = db.query(func.count(RequestLog.id)).scalar() or 0
        ok_count = db.query(func.count(RequestLog.id)).filter(RequestLog.ok.is_(True)).scalar() or 0
        error_count = total - ok_count
        avg_latency = db.query(func.avg(RequestLog.latency_ms)).filter(RequestLog.ok.is_(True)).scalar()
        today_count = (
            db.query(func.count(RequestLog.id)).filter(RequestLog.created_at.like(f"{today}%")).scalar() or 0
        )
        by_route = dict(
            db.query(RequestLog.route, func.count(RequestLog.id)).group_by(RequestLog.route).all()
        )
    return {
        "total_requests": total,
        "ok_count": ok_count,
        "error_count": error_count,
        "error_rate": round(error_count / total, 4) if total else 0.0,
        "avg_latency_ms": round(float(avg_latency), 1) if avg_latency is not None else None,
        "requests_today": today_count,
        "by_route": by_route,
    }
