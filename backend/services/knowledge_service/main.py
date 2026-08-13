"""
데이터·지식 연동 (RAG) — TOPEC AI 포털 공통 서비스 레이어

문서 텍스트를 청킹 + 임베딩하여 Vector DB(chroma, docker-compose의 vector-db 컨테이너)에
저장하고, 질의 시 의미적으로 유사한 청크를 검색해 반환합니다.

임베딩은 로컬 다국어 모델(sentence-transformers, paraphrase-multilingual-MiniLM-L12-v2)을
사용합니다 — 외부 API 키 없이 폐쇄망에서도 동작하지만, 최초 실행 시 모델 파일(~470MB)을
1회 내려받습니다(인터넷 연결 필요, 이후엔 캐시됨).

document_service가 문서를 추출할 때마다 이 서비스의 /knowledge/index를 자동 호출해
색인합니다 (`document_service/main.py` 참고).

TODO(개발팀): 외부 임베딩 API(OpenAI text-embedding 등) 옵션 추가, 문장 경계 인식 등
청킹 전략 고도화, 컬렉션별 접근권한(auth_service 연동).
"""
import os

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from chunking import chunk_text

CHROMA_HOST = os.environ.get("CHROMA_HOST", "vector-db")
CHROMA_PORT = int(os.environ.get("CHROMA_PORT", "8000"))
COLLECTION_NAME = os.environ.get("KNOWLEDGE_COLLECTION", "topec_documents")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")

app = FastAPI(title="TOPEC AI Portal - 데이터·지식 연동 (RAG)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_collection = None


def _get_collection():
    """Chroma 클라이언트/컬렉션을 지연 초기화합니다 (health check가 임베딩 모델
    다운로드를 기다리지 않도록 실제 색인/검색 요청이 올 때 처음 초기화)."""
    global _collection
    if _collection is None:
        embedding_fn = SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)
        client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


class IndexRequest(BaseModel):
    doc_id: str
    text: str
    title: str | None = None
    source: str | None = None


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    doc_id: str | None = None


@app.get("/health")
async def health():
    return {"service": "knowledge_service", "status": "ok"}


@app.post("/knowledge/index")
async def index_document(req: IndexRequest):
    """문서 텍스트를 청킹 + 임베딩하여 Vector DB에 저장합니다.
    같은 doc_id로 다시 호출하면 기존 청크를 지우고 새로 색인합니다(재추출 반영)."""
    if not req.text.strip():
        raise HTTPException(status_code=422, detail="text가 비어 있습니다")

    chunks = chunk_text(req.text)
    if not chunks:
        raise HTTPException(status_code=422, detail="청킹 결과가 비어 있습니다")

    try:
        collection = _get_collection()
        collection.delete(where={"doc_id": req.doc_id})
        ids = [f"{req.doc_id}::{i}" for i in range(len(chunks))]
        metadatas = [
            {"doc_id": req.doc_id, "chunk_index": i, "title": req.title or "", "source": req.source or ""}
            for i in range(len(chunks))
        ]
        collection.add(documents=chunks, metadatas=metadatas, ids=ids)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Vector DB 색인 실패: {e}")

    return {"doc_id": req.doc_id, "chunks_indexed": len(chunks)}


@app.post("/knowledge/search")
async def search(req: SearchRequest):
    """질의어와 의미적으로 유사한 청크를 top_k개 반환합니다."""
    if not req.query.strip():
        raise HTTPException(status_code=422, detail="query가 비어 있습니다")

    try:
        collection = _get_collection()
        where = {"doc_id": req.doc_id} if req.doc_id else None
        result = collection.query(query_texts=[req.query], n_results=req.top_k, where=where)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Vector DB 검색 실패: {e}")

    docs = (result.get("documents") or [[]])[0]
    metas = (result.get("metadatas") or [[]])[0]
    dists = (result.get("distances") or [[]])[0]
    items = [
        {
            "text": doc,
            "doc_id": meta.get("doc_id"),
            "title": meta.get("title"),
            "source": meta.get("source"),
            "chunk_index": meta.get("chunk_index"),
            "score": round(1 - dist, 4),
        }
        for doc, meta, dist in zip(docs, metas, dists)
    ]
    return {"query": req.query, "results": items}


@app.delete("/knowledge/{doc_id}")
async def delete_document(doc_id: str):
    """특정 문서의 색인된 청크를 모두 삭제합니다."""
    try:
        collection = _get_collection()
        collection.delete(where={"doc_id": doc_id})
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Vector DB 삭제 실패: {e}")
    return {"ok": True}
