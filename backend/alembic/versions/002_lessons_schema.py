"""lessons and lesson slides

Revision ID: 002
Revises: 001
Create Date: 2026-06-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.create_table(
        "lessons",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("module_id", sa.String(length=64), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("instruction_html", sa.Text(), nullable=False, server_default=""),
        sa.Column("deep_link_template", sa.Text(), nullable=True),
        sa.Column("verify_type", sa.String(length=32), nullable=False),
        sa.Column("verify_config", json_type, nullable=False, server_default=sa.text("'{}'")),
        sa.Column("is_optional", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_lessons_module_order", "lessons", ["module_id", "sort_order"])

    op.create_table(
        "lesson_slides",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("lesson_id", sa.String(length=64), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("caption_html", sa.Text(), nullable=False, server_default=""),
        sa.Column("expected_result_html", sa.Text(), nullable=False, server_default=""),
        sa.Column("image_path", sa.Text(), nullable=False),
        sa.Column("hotspots", json_type, nullable=False, server_default=sa.text("'{}'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_lesson_slides_lesson_order", "lesson_slides", ["lesson_id", "sort_order"])

    op.add_column("user_progress", sa.Column("current_lesson_id", sa.String(length=64), nullable=True))
    op.create_foreign_key(
        "fk_user_progress_current_lesson",
        "user_progress",
        "lessons",
        ["current_lesson_id"],
        ["id"],
    )

    op.create_table(
        "lesson_states",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_progress_id", sa.Uuid(), nullable=False),
        sa.Column("lesson_id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="locked"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verify_result", json_type, nullable=True),
        sa.Column("verify_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_verify_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("client_events", json_type, nullable=False, server_default=sa.text("'[]'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"]),
        sa.ForeignKeyConstraint(["user_progress_id"], ["user_progress.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_progress_id", "lesson_id", name="uq_lesson_states_progress_lesson"),
    )
    op.create_index("idx_lesson_states_progress", "lesson_states", ["user_progress_id"])

    op.alter_column("verify_audit_log", "step_state_id", existing_type=sa.Uuid(), nullable=True)
    op.add_column("verify_audit_log", sa.Column("lesson_state_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_verify_audit_lesson_state",
        "verify_audit_log",
        "lesson_states",
        ["lesson_state_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_verify_audit_lesson_state", "verify_audit_log", type_="foreignkey")
    op.drop_column("verify_audit_log", "lesson_state_id")
    op.alter_column("verify_audit_log", "step_state_id", existing_type=sa.Uuid(), nullable=False)

    op.drop_index("idx_lesson_states_progress", table_name="lesson_states")
    op.drop_table("lesson_states")

    op.drop_constraint("fk_user_progress_current_lesson", "user_progress", type_="foreignkey")
    op.drop_column("user_progress", "current_lesson_id")

    op.drop_index("idx_lesson_slides_lesson_order", table_name="lesson_slides")
    op.drop_table("lesson_slides")
    op.drop_index("idx_lessons_module_order", table_name="lessons")
    op.drop_table("lessons")
