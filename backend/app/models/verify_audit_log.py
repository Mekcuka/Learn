import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class VerifyAuditLog(Base):
    __tablename__ = "verify_audit_log"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    lesson_state_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("lesson_states.id"), nullable=True)
    verify_type: Mapped[str] = mapped_column(String(32), nullable=False)
    demo_endpoint: Mapped[str | None] = mapped_column(String(512), nullable=True)
    http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    outcome: Mapped[str] = mapped_column(String(32), nullable=False)
    response_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    lesson_state = relationship("LessonState", back_populates="verify_audit_logs")
