"""
문서 처리 엔진 — TOPEC AI 포털 공통 서비스 레이어
한글/워드/엑셀/PDF 등 사내 문서를 원본 서식 그대로 구조 분석·추출하는 공통 서비스

hwp(x)/docx/xlsx/pdf 파서는 parsers.py 에 구현되어 있습니다. 추출 결과(구조 요약 +
본문 텍스트)는 PostgreSQL(운영, DATABASE_URL 지정 시) 또는 SQLite(로컬 폴백)에
영구 저장됩니다 — db.py, models.py 참고 (governance_service/auth_service와 동일 패턴).

TODO(개발팀): 문서 생성/편집(원본 서식 유지) 기능은 아직 없음 — 현재는 추출(extract)만 지원.
"""
import os
import uuid
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from db import Base, SessionLocal, engine
from models import Document
from parsers import extract

KNOWLEDGE_SERVICE_URL = os.environ.get("KNOWLEDGE_SERVICE_URL", "http://knowledge-service:8102")

app = FastAPI(title="TOPEC AI Portal - 문서 처리 엔진")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def _serialize(d: Document, include_text: bool = False) -> dict:
    out = {
        "file_id": d.file_id,
        "filename": d.filename,
        "format": d.format,
        "status": d.status,
        "structure": {"paragraphs": d.paragraphs, "tables": d.tables, "images": d.images},
        "text_excerpt": d.text_excerpt,
        "created_at": d.created_at,
    }
    if include_text:
        out["text"] = d.full_text
    return out


@app.get("/health")
async def health():
    return {"service": "document_service", "status": "ok"}


@app.post("/documents/extract")
async def extract_document(
    file: UploadFile = File(...),
    file_id: str | None = Form(None),
    format: str | None = Form(None),
):
    """파일을 업로드받아 구조 분석 + 텍스트 추출 후 결과를 DB에 저장합니다.
    지원 포맷: docx, xlsx, pdf, hwpx, hwp(레거시 바이너리, best-effort).
    같은 file_id로 다시 호출하면 기존 레코드를 갱신합니다."""
    raw = await file.read()
    fmt = (format or (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "")).lower()

    try:
        result = extract(raw, fmt, file.filename or "document")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    fid = file_id or f"doc_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    text = result["text"]

    with SessionLocal() as db:
        doc = db.query(Document).filter(Document.file_id == fid).first()
        if doc is None:
            doc = Document(file_id=fid)
            db.add(doc)
        doc.filename = file.filename or fid
        doc.format = fmt
        doc.status = "extracted"
        doc.paragraphs = result["paragraphs"]
        doc.tables = result["tables"]
        doc.images = result["images"]
        doc.full_text = text
        doc.text_excerpt = text[:1000]
        doc.created_at = now
        db.commit()
        db.refresh(doc)
        serialized = _serialize(doc, include_text=True)

    serialized["indexed"] = await _index_in_knowledge_service(fid, text, file.filename or fid)
    return serialized


async def _index_in_knowledge_service(doc_id: str, text: str, title: str) -> bool:
    """추출된 텍스트를 knowledge_service(RAG)에 색인 요청합니다.
    knowledge_service가 아직 없거나 응답이 없어도 문서 추출 자체는 실패시키지 않습니다."""
    if not text.strip():
        return False
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{KNOWLEDGE_SERVICE_URL}/knowledge/index",
                json={"doc_id": doc_id, "text": text, "title": title, "source": "document_service"},
            )
            return resp.status_code == 200
    except Exception:
        return False


@app.get("/documents")
async def list_documents():
    """지금까지 추출된 문서 목록 (본문 전체 텍스트는 제외, text_excerpt만 포함)."""
    with SessionLocal() as db:
        items = [_serialize(d) for d in db.query(Document).order_by(Document.id.desc()).all()]
    return {"items": items}


@app.get("/documents/{file_id}")
async def get_document(file_id: str):
    """특정 문서의 전체 추출 결과(본문 텍스트 포함) 조회."""
    with SessionLocal() as db:
        doc = db.query(Document).filter(Document.file_id == file_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="document not found")
        return _serialize(doc, include_text=True)
