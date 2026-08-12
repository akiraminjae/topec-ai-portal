"""
데이터·지식 연동 (RAG) — TOPEC AI 포털 공통 서비스 레이어
사내 지식베이스에 대한 청킹·임베딩·검색을 담당하는 RAG 공통 서비스

이 파일은 스캐폴드(skeleton)입니다. 실제 비즈니스 로직은 TODO 표시된 부분에
개발팀이 채워 넣어야 합니다.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TOPEC AI Portal - 데이터·지식 연동 (RAG)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"service": "knowledge_service", "status": "ok"}


@app.post("/knowledge/search")
async def handle(request: Request):
    """예시 요청: {"query": "출장 규정", "top_k": 5}"""
    payload = await request.json()
    return {
        "query": payload.get("query"),
        "results": [],
        "note": "TODO: Vector DB 연동 및 임베딩 파이프라인 구현 필요",
    }
