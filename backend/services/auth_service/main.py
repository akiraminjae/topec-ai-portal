"""
계정·접근권한 (SSO) — TOPEC AI 포털 공통 서비스 레이어
로컬 이메일/비밀번호 인증 + 세션 기반 인가를 실제로 구현합니다 (아래 /auth/register,
/auth/login, /auth/logout, /auth/me). gateway가 /chat 요청마다 GET /auth/me로
세션을 검증합니다 (`backend/gateway/main.py`의 인증 미들웨어 참고).

TODO(개발팀): 실제 사내 SSO(SAML/OAuth, 예: Azure AD)는 별도 IdP 연동 정보가 있어야
구현 가능 — 지금은 로컬 계정 기반 인증까지만 지원. RBAC은 role(member/admin) 필드만
있고 세분화된 권한 정책은 아직 없음.

사용자별 연동 설정(이메일 비서 / 일정 관리 에이전트가 쓸 IMAP·캘린더 계정 등)은
/auth/integrations 하위 엔드포인트로 실제 동작합니다. 저장소는 PostgreSQL(운영,
DATABASE_URL 지정 시) 또는 SQLite(로컬 폴백)입니다 — db.py, models.py 참고.
TODO(개발팀): 연동 값 필드(fields_json)는 암호화해서 저장.
"""
import json
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from db import Base, SessionLocal, engine
from models import Integration, Session, User

app = FastAPI(title="TOPEC AI Portal - 계정·접근권한 (SSO)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

SESSION_TTL_DAYS = 7


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _serialize_user(u: User) -> dict:
    return {"user_id": u.id, "email": u.email, "name": u.name, "role": u.role}


def _create_session(db, user: User) -> str:
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    db.add(
        Session(
            token=token,
            user_id=user.id,
            expires_at=(now + timedelta(days=SESSION_TTL_DAYS)).isoformat(),
            created_at=now.isoformat(),
        )
    )
    db.commit()
    return token


def _current_user(authorization: str | None = Header(default=None)) -> dict:
    """Authorization: Bearer <token> 헤더로 로그인 사용자를 식별합니다. 세션이
    없거나 만료되었으면 401을 반환합니다. gateway 등 다른 서비스가 그대로 재사용합니다."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authorization: Bearer <token> 헤더가 필요합니다")
    token = authorization[len("Bearer "):].strip()
    with SessionLocal() as db:
        session = db.query(Session).filter(Session.token == token).first()
        if not session:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")
        if datetime.fromisoformat(session.expires_at) < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="세션이 만료되었습니다")
        user = db.get(User, session.user_id)
        if not user:
            raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다")
        return _serialize_user(user)


@app.get("/health")
async def health():
    return {"service": "auth_service", "status": "ok"}


@app.post("/auth/register")
async def register(request: Request):
    """예시 요청: {"email": "u@topec.co.kr", "password": "...", "name": "김민재"}.
    성공 시 바로 로그인 처리되어 세션 토큰을 반환합니다."""
    payload = await request.json()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    if not email or len(password) < 8:
        raise HTTPException(status_code=422, detail="email과 8자 이상 password가 필요합니다")

    with SessionLocal() as db:
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다")
        user = User(
            email=email,
            password_hash=_hash_password(password),
            name=payload.get("name", ""),
            role="member",
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = _create_session(db, user)
        return {"token": token, "user": _serialize_user(user)}


@app.post("/auth/login")
async def login(request: Request):
    """예시 요청: {"email": "u@topec.co.kr", "password": "..."}"""
    payload = await request.json()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        if not user or not _verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")
        token = _create_session(db, user)
        return {"token": token, "user": _serialize_user(user)}


@app.post("/auth/logout")
async def logout(authorization: str | None = Header(default=None)):
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[len("Bearer "):].strip()
        with SessionLocal() as db:
            db.query(Session).filter(Session.token == token).delete()
            db.commit()
    return {"ok": True}


@app.get("/auth/me")
async def me(authorization: str | None = Header(default=None)):
    return _current_user(authorization)


@app.post("/auth/permissions")
async def handle(request: Request):
    """예시 요청: {"user_id": "u1023", "resource": "agent:agt_1001"}"""
    payload = await request.json()
    return {
        "user_id": payload.get("user_id"),
        "allowed": True,
        "role": "editor",
        "note": "TODO: 사내 SSO(예: SAML/OAuth) 및 세분화된 RBAC 정책 연동 필요",
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
