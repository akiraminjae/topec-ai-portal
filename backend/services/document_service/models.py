from sqlalchemy import Column, Integer, String, Text

from db import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String, unique=True, nullable=False, index=True)
    filename = Column(String, nullable=False, default="")
    format = Column(String, nullable=False, default="")
    status = Column(String, nullable=False, default="pending")
    paragraphs = Column(Integer, nullable=False, default=0)
    tables = Column(Integer, nullable=False, default=0)
    images = Column(Integer, nullable=False, default=0)
    text_excerpt = Column(Text, nullable=False, default="")
    full_text = Column(Text, nullable=False, default="")
    created_at = Column(String, nullable=False, default="")
