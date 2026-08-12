"""
문서 처리 엔진 — TOPEC AI 포털 공통 서비스 레이어
한글/워드/엑셀/PDF 등 사내 문서를 원본 서식 그대로 구조 분석·추출·생성·편집하는 공통 서비스

이 파일은 스캐폴드(skeleton)입니다. 실제 비즈니스 로직은 TODO 표시된 부분에
개발팀이 채워 넣어야 합니다.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TOPEC AI Portal - 문서 처리 엔진")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"service": "document_service", "status": "ok"}


@app.post("/documents/extract")
async def handle(request: Request):
    """예시 요청: {"file_id": "doc_001", "format": "hwpx"}"""
    payload = await request.json()
    return {
        "file_id": payload.get("file_id"),
        "status": "extracted",
        "structure": {"tables": 0, "paragraphs": 0, "images": 0},
        "note": "TODO: hwp(x)/docx/xlsx/pdf 파서 연동 필요",
    }
