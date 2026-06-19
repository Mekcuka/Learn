import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

JsonType = JSON().with_variant(JSONB(), "postgresql")


class WikiArticle(Base):
    __tablename__ = "wiki_articles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    body_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    tags: Mapped[list] = mapped_column(JsonType, default=list, nullable=False)
    author_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    author = relationship("User")
