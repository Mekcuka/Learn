import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

JsonType = JSON().with_variant(JSONB(), "postgresql")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module_id: Mapped[str] = mapped_column(String(64), ForeignKey("modules.id"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    instruction_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    deep_link_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    verify_type: Mapped[str] = mapped_column(String(32), nullable=False)
    verify_config: Mapped[dict] = mapped_column(JsonType, default=dict, nullable=False)
    is_optional: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tags: Mapped[list] = mapped_column(JsonType, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    module = relationship("Module", back_populates="lessons")
    slides = relationship("LessonSlide", back_populates="lesson", order_by="LessonSlide.sort_order")
    lesson_states = relationship("LessonState", back_populates="lesson")


class LessonSlide(Base):
    __tablename__ = "lesson_slides"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    lesson_id: Mapped[str] = mapped_column(String(64), ForeignKey("lessons.id"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    caption_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    expected_result_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    image_path: Mapped[str] = mapped_column(Text, nullable=False)
    hotspots: Mapped[dict] = mapped_column(JsonType, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    lesson = relationship("Lesson", back_populates="slides")


class LessonState(Base):
    __tablename__ = "lesson_states"
    __table_args__ = (UniqueConstraint("user_progress_id", "lesson_id", name="uq_lesson_states_progress_lesson"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_progress_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("user_progress.id"), nullable=False)
    lesson_id: Mapped[str] = mapped_column(String(64), ForeignKey("lessons.id"), nullable=False)
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

    user_progress = relationship("UserProgress", back_populates="lesson_states")
    lesson = relationship("Lesson", back_populates="lesson_states")
    verify_audit_logs = relationship("VerifyAuditLog", back_populates="lesson_state")
