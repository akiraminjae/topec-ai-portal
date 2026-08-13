from sqlalchemy import Column, Integer, String, Text

from db import Base


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False, default="")
    system_prompt = Column(Text, nullable=False, default="")
    tools_json = Column(Text, nullable=False, default="[]")  # JSON 인코딩된 도구 이름 목록
    owner = Column(String, nullable=False, default="")
    status = Column(String, nullable=False, default="draft")  # draft|pending_approval|published|archived
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(String, nullable=False, default="")
    updated_at = Column(String, nullable=False, default="")
