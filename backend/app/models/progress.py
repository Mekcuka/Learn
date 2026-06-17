import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, UniqueConstraint, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB

JsonType = JSON().with_variant(JSONB(), "postgresql")
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class UserProgress(Base):
    __tablename__ = "user_progress"
    __table_args__ = (UniqueConstraint("user_id", "module_id", name="uq_user_progress_user_module"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    module_id: Mapped[str] = mapped_column(String(64), ForeignKey("modules.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="not_started", nullable=False)
    current_step_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("steps.id"), nullable=True)
    current_lesson_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("lessons.id"), nullable=True)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    quiz_score_percent: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User", back_populates="progress_records")
    module = relationship("Module", back_populates="progress_records")
    step_states = relationship("StepState", back_populates="user_progress")
    lesson_states = relationship("LessonState", back_populates="user_progress")


class StepState(Base):
    __tablename__ = "step_states"
    __table_args__ = (UniqueConstraint("user_progress_id", "step_id", name="uq_step_states_progress_step"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_progress_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("user_progress.id"), nullable=False)
    step_id: Mapped[str] = mapped_column(String(64), ForeignKey("steps.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="locked", nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verify_result: Mapped[dict | None] = mapped_column(JsonType, nullable=True)
    verify_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_verify_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    client_events: Mapped[list] = mapped_column(JsonType, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user_progress = relationship("UserProgress", back_populates="step_states")
    step = relationship("Step", back_populates="step_states")
    verify_audit_logs = relationship("VerifyAuditLog", back_populates="step_state")
