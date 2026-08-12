"""
계정·접근권한 (SSO) — TOPEC AI 포털 공통 서비스 레이어
SSO 연동, 역할기반 권한통제(RBAC)를 담당하는 공통 서비스

이 파일은 스캐폴드(skeleton)입니다. 실제 비즈니스 로직은 TODO 표시된 부분에
개발팀이 채워 넣어야 합니다.

사용자별 연동 설정(이메일 비서 / 일정 관리 에이전트가 쓸 IMAP·캘린더 계정 등)은
/auth/integrations 하위 엔드포인트로 실제 동작하는 저장소(in-memory)를 제공합니다.
TODO(개발팀): Postgres 등 영구 저장소로 교체, 값 필드는 암호화해서 저장.
"""
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TOPEC AI Portal - 계정·접근권한 (SSO)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# key: f"{user_id}:{provider}" (provider 예: "email", "calendar")
_INTEGRATIONS: dict[str, dict] = {}


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
    items = [v for k, v in _INTEGRATIONS.items() if k.startswith(f"{user_id}:")]
    masked = [{**item, "fields": _mask(item["fields"])} for item in items]
    return {"items": masked}


@app.put("/auth/integrations/{provider}")
async def upsert_integration(provider: str, request: Request):
    """예시 요청: {"user_id": "u-demo", "fields": {"email": "a@topec.co.kr", "imap_host": "..."}}"""
    payload = await request.json()
    user_id = payload.get("user_id", "u-demo")
    fields = payload.get("fields")
    if not isinstance(fields, dict) or not fields:
        raise HTTPException(status_code=400, detail="fields는 비어있지 않은 객체여야 합니다")
    key = f"{user_id}:{provider}"
    item = {
        "user_id": user_id,
        "provider": provider,
        "connected": True,
        "fields": fields,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _INTEGRATIONS[key] = item
    return {**item, "fields": _mask(item["fields"])}


@app.delete("/auth/integrations/{provider}")
async def delete_integration(provider: str, user_id: str = "u-demo"):
    key = f"{user_id}:{provider}"
    if key not in _INTEGRATIONS:
        raise HTTPException(status_code=404, detail="integration not found")
    del _INTEGRATIONS[key]
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
