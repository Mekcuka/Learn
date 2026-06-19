import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db import Base

JsonType = JSON().with_variant(JSONB(), "postgresql")


class LessonRevision(Base):
    __tablename__ = "lesson_revisions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    lesson_id: Mapped[str] = mapped_column(String(64), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    snapshot_json: Mapped[dict] = mapped_column(JsonType, nullable=False)

    lesson = relationship("Lesson")
    created_by = relationship("User")
