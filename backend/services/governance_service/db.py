"""DB 연결/세션 관리.

운영 환경(사내 서버)에서는 DATABASE_URL로 PostgreSQL을 지정합니다
(예: postgresql://user:pass@host:5432/topec).
DATABASE_URL이 없으면 로컬 SQLite 파일로 자동 폴백해 별도 DB 서버 없이도 동작합니다.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./governance.db")

# SQLite는 커넥션마다 단일 스레드 가정이 기본값이라 FastAPI(비동기 요청)에서는 해제해줘야 합니다.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
