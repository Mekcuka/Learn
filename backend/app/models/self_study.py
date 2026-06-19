import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

JsonType = JSON().with_variant(JSONB(), "postgresql")


class SelfStudyAssignment(Base):
    __tablename__ = "self_study_assignments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    steps = relationship("SelfStudyStep", back_populates="assignment", order_by="SelfStudyStep.sort_order")
    progress_records = relationship("SelfStudyProgress", back_populates="assignment")


class SelfStudyStep(Base):
    __tablename__ = "self_study_steps"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    assignment_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("self_study_assignments.id"), nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    instruction_html: Mapped[str] = mapped_column(Text, nullable=False, default="")
    deep_link_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    verify_type: Mapped[str] = mapped_column(String(32), nullable=False)
    verify_config: Mapped[dict] = mapped_column(JsonType, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    assignment = relationship("SelfStudyAssignment", back_populates="steps")
    step_states = relationship("SelfStudyStepState", back_populates="step")


class SelfStudyProgress(Base):
    __tablename__ = "self_study_progress"
    __table_args__ = (UniqueConstraint("user_id", "assignment_id", name="uq_self_study_progress_user_assignment"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    assignment_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("self_study_assignments.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), default="not_started", nullable=False)
    current_step_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    assignment = relationship("SelfStudyAssignment", back_populates="progress_records")
    step_states = relationship("SelfStudyStepState", back_populates="progress")


class SelfStudyStepState(Base):
    __tablename__ = "self_study_step_states"
    __table_args__ = (
        UniqueConstraint("self_study_progress_id", "step_id", name="uq_self_study_step_states_progress_step"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    self_study_progress_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("self_study_progress.id"), nullable=False
    )
    step_id: Mapped[str] = mapped_column(String(64), ForeignKey("self_study_steps.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="locked", nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verify_result: Mapped[dict | None] = mapped_column(JsonType, nullable=True)
    verify_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_verify_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    progress = relationship("SelfStudyProgress", back_populates="step_states")
    step = relationship("SelfStudyStep", back_populates="step_states")
