"""drop module steps tables

Revision ID: 009
Revises: 008
Create Date: 2026-06-19
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.drop_index("idx_verify_audit_step_state", table_name="verify_audit_log")
    op.drop_constraint("verify_audit_log_step_state_id_fkey", "verify_audit_log", type_="foreignkey")
    op.drop_column("verify_audit_log", "step_state_id")

    op.drop_index("idx_step_states_progress", table_name="step_states")
    op.drop_table("step_states")

    op.drop_constraint("user_progress_current_step_id_fkey", "user_progress", type_="foreignkey")
    op.drop_column("user_progress", "current_step_id")

    op.drop_index("idx_steps_module_order", table_name="steps")
    op.drop_table("steps")


def downgrade() -> None:
    op.create_table(
        "steps",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("module_id", sa.String(length=64), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("instruction_html", sa.Text(), nullable=False),
        sa.Column("deep_link_template", sa.Text(), nullable=True),
        sa.Column("verify_type", sa.String(length=32), nullable=False),
        sa.Column("verify_config", json_type, nullable=False, server_default=sa.text("'{}'")),
        sa.Column("is_optional", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_steps_module_order", "steps", ["module_id", "sort_order"])

    op.add_column("user_progress", sa.Column("current_step_id", sa.String(length=64), nullable=True))
    op.create_foreign_key(
        "user_progress_current_step_id_fkey",
        "user_progress",
        "steps",
        ["current_step_id"],
        ["id"],
    )

    op.create_table(
        "step_states",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_progress_id", sa.Uuid(), nullable=False),
        sa.Column("step_id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="locked"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verify_result", json_type, nullable=True),
        sa.Column("verify_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_verify_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("client_events", json_type, nullable=False, server_default=sa.text("'[]'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["step_id"], ["steps.id"]),
        sa.ForeignKeyConstraint(["user_progress_id"], ["user_progress.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_progress_id", "step_id", name="uq_step_states_progress_step"),
    )
    op.create_index("idx_step_states_progress", "step_states", ["user_progress_id"])

    op.add_column("verify_audit_log", sa.Column("step_state_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "verify_audit_log_step_state_id_fkey",
        "verify_audit_log",
        "step_states",
        ["step_state_id"],
        ["id"],
    )
    op.create_index("idx_verify_audit_step_state", "verify_audit_log", ["step_state_id", "created_at"])
