from sqlalchemy import Column, Integer, String, UniqueConstraint

from db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False, default="")
    role = Column(String, nullable=False, default="member")  # member | admin
    created_at = Column(String, nullable=False, default="")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    expires_at = Column(String, nullable=False)
    created_at = Column(String, nullable=False, default="")


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    provider = Column(String, nullable=False)
    fields_json = Column(String, nullable=False)  # JSON 인코딩된 연동 필드 값
    updated_at = Column(String, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "provider", name="uq_user_provider"),)
