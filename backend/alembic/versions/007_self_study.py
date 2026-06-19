"""self study assignments

Revision ID: 007
Revises: 006
Create Date: 2026-06-18
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.create_table(
        "self_study_assignments",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "self_study_steps",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("assignment_id", sa.String(length=64), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("instruction_html", sa.Text(), nullable=False, server_default=""),
        sa.Column("deep_link_template", sa.Text(), nullable=True),
        sa.Column("verify_type", sa.String(length=32), nullable=False),
        sa.Column("verify_config", json_type, nullable=False, server_default=sa.text("'{}'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["self_study_assignments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "self_study_progress",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("assignment_id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="not_started"),
        sa.Column("current_step_id", sa.String(length=64), nullable=True),
        sa.Column("progress_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["self_study_assignments.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "assignment_id", name="uq_self_study_progress_user_assignment"),
    )
    op.create_table(
        "self_study_step_states",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("self_study_progress_id", sa.Uuid(), nullable=False),
        sa.Column("step_id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="locked"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verify_result", json_type, nullable=True),
        sa.Column("verify_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_verify_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["self_study_progress_id"], ["self_study_progress.id"]),
        sa.ForeignKeyConstraint(["step_id"], ["self_study_steps.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "self_study_progress_id", "step_id", name="uq_self_study_step_states_progress_step"
        ),
    )


def downgrade() -> None:
    op.drop_table("self_study_step_states")
    op.drop_table("self_study_progress")
    op.drop_table("self_study_steps")
    op.drop_table("self_study_assignments")
