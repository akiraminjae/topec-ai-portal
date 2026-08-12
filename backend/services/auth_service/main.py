"""
계정·접근권한 (SSO) — TOPEC AI 포털 공통 서비스 레이어
SSO 연동, 역할기반 권한통제(RBAC)를 담당하는 공통 서비스

이 파일은 스캐폴드(skeleton)입니다. 실제 SSO/RBAC 로직은 TODO 표시된 부분에
개발팀이 채워 넣어야 합니다.

사용자별 연동 설정(이메일 비서 / 일정 관리 에이전트가 쓸 IMAP·캘린더 계정 등)은
/auth/integrations 하위 엔드포인트로 실제 동작합니다. 저장소는 PostgreSQL(운영,
DATABASE_URL 지정 시) 또는 SQLite(로컬 폴백)입니다 — db.py, models.py 참고.
TODO(개발팀): 값 필드(fields_json)는 암호화해서 저장.
"""
import json
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from db import Base, SessionLocal, engine
from models import Integration

app = FastAPI(title="TOPEC AI Portal - 계정·접근권한 (SSO)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.get("/health")
async def health():
    return {"service": "auth_service", "status": "ok"}


@app.post("/auth/permissions")
async def handle(request: Request):
    """예시 요청: {"user_id": "u1023", "resource": "agent:agt_1001"}"""
    payload = await request.json()
    return {
        "user_id": payload.get("user_id"),
        "allowed": True,
        "role": "editor",
        "note": "TODO: 사내 SSO(예: SAML/OAuth) 및 RBAC 정책 연동 필요",
    }


@app.get("/auth/integrations")
async def list_integrations(user_id: str = "u-demo"):
    """현재 로그인 사용자의 연동 설정 목록. 값(fields)은 마스킹해서 반환합니다."""
    with SessionLocal() as db:
        rows = db.query(Integration).filter(Integration.user_id == user_id).all()
        items = [
            {
                "user_id": r.user_id,
                "provider": r.provider,
                "connected": True,
                "fields": _mask(json.loads(r.fields_json)),
                "updated_at": r.updated_at,
            }
            for r in rows
        ]
    return {"items": items}


@app.put("/auth/integrations/{provider}")
async def upsert_integration(provider: str, request: Request):
    """예시 요청: {"user_id": "u-demo", "fields": {"email": "a@topec.co.kr", "imap_host": "..."}}"""
    payload = await request.json()
    user_id = payload.get("user_id", "u-demo")
    fields = payload.get("fields")
    if not isinstance(fields, dict) or not fields:
        raise HTTPException(status_code=400, detail="fields는 비어있지 않은 객체여야 합니다")
    now = datetime.now(timezone.utc).isoformat()
    with SessionLocal() as db:
        row = (
            db.query(Integration)
            .filter(Integration.user_id == user_id, Integration.provider == provider)
            .first()
        )
        if row:
            row.fields_json = json.dumps(fields, ensure_ascii=False)
            row.updated_at = now
        else:
            row = Integration(
                user_id=user_id,
                provider=provider,
                fields_json=json.dumps(fields, ensure_ascii=False),
                updated_at=now,
            )
            db.add(row)
        db.commit()
        db.refresh(row)
        return {
            "user_id": row.user_id,
            "provider": row.provider,
            "connected": True,
            "fields": _mask(fields),
            "updated_at": row.updated_at,
        }


@app.delete("/auth/integrations/{provider}")
async def delete_integration(provider: str, user_id: str = "u-demo"):
    with SessionLocal() as db:
        row = (
            db.query(Integration)
            .filter(Integration.user_id == user_id, Integration.provider == provider)
            .first()
        )
        if not row:
            raise HTTPException(status_code=404, detail="integration not found")
        db.delete(row)
        db.commit()
    return {"ok": True}


def _mask(fields: dict) -> dict:
    """비밀번호/토큰류로 보이는 필드는 앞 2자만 남기고 마스킹해서 반환."""
    secret_keys = {"password", "app_password", "secret", "token", "api_key"}
    out = {}
    for k, v in fields.items():
        if any(s in k.lower() for s in secret_keys) and isinstance(v, str) and v:
            out[k] = v[:2] + "•" * max(len(v) - 2, 4)
        else:
            out[k] = v
    return out
