"""
계정·접근권한 (SSO) — TOPEC AI 포털 공통 서비스 레이어
SSO 연동, 역할기반 권한통제(RBAC)를 담당하는 공통 서비스

이 파일은 스캐폴드(skeleton)입니다. 실제 비즈니스 로직은 TODO 표시된 부분에
개발팀이 채워 넣어야 합니다.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TOPEC AI Portal - 계정·접근권한 (SSO)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
