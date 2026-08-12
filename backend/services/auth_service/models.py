from sqlalchemy import Column, Integer, String, UniqueConstraint

from db import Base


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    provider = Column(String, nullable=False)
    fields_json = Column(String, nullable=False)  # JSON 인코딩된 연동 필드 값
    updated_at = Column(String, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "provider", name="uq_user_provider"),)
