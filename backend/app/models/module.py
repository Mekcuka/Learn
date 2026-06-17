from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB

JsonType = JSON().with_variant(JSONB(), "postgresql")
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    scenario_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pass_threshold_percent: Mapped[int] = mapped_column(Integer, default=80, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    steps = relationship("Step", back_populates="module", order_by="Step.sort_order")
    lessons = relationship("Lesson", back_populates="module", order_by="Lesson.sort_order")
    quiz_questions = relationship("QuizQuestion", back_populates="module", order_by="QuizQuestion.sort_order")
    progress_records = relationship("UserProgress", back_populates="module")


class Step(Base):
    __tablename__ = "steps"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module_id: Mapped[str] = mapped_column(String(64), ForeignKey("modules.id"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    instruction_html: Mapped[str] = mapped_column(Text, nullable=False)
    deep_link_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    verify_type: Mapped[str] = mapped_column(String(32), nullable=False)
    verify_config: Mapped[dict] = mapped_column(JsonType, default=dict, nullable=False)
    is_optional: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    module = relationship("Module", back_populates="steps")
    step_states = relationship("StepState", back_populates="step")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module_id: Mapped[str] = mapped_column(String(64), ForeignKey("modules.id"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
    prompt_html: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list] = mapped_column(JsonType, nullable=False)
    correct_option_ids: Mapped[list] = mapped_column(JsonType, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    module = relationship("Module", back_populates="quiz_questions")
