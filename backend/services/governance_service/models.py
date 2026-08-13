from sqlalchemy import Column, Integer, String

from db import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String, nullable=False)
    action = Column(String, nullable=False)
    requested_by = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
