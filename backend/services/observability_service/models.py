from sqlalchemy import Boolean, Column, Integer, String, Text

from db import Base


class RequestLog(Base):
    __tablename__ = "request_logs"

    id = Column(Integer, primary_key=True, index=True)
    route = Column(String, nullable=False, default="")  # external_api | internal_serving
    provider = Column(String, nullable=False, default="")  # anthropic | openai | gemini | internal
    agent = Column(String, nullable=False, default="")
    ok = Column(Boolean, nullable=False, default=True)
    latency_ms = Column(Integer, nullable=False, default=0)
    error = Column(Text, nullable=True)
    created_at = Column(String, nullable=False, default="", index=True)
