"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "modules",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("scenario_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("pass_threshold_percent", sa.Integer(), nullable=False, server_default="80"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "training_accounts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("demo_email", sa.String(length=255), nullable=False),
        sa.Column("demo_password_encrypted", sa.Text(), nullable=False),
        sa.Column("demo_user_id", sa.String(length=255), nullable=True),
        sa.Column("demo_token_encrypted", sa.Text(), nullable=True),
        sa.Column("demo_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
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
    op.create_table(
        "quiz_questions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("module_id", sa.String(length=64), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("prompt_html", sa.Text(), nullable=False),
        sa.Column("options", json_type, nullable=False),
        sa.Column("correct_option_ids", json_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "user_progress",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("module_id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="not_started"),
        sa.Column("current_step_id", sa.String(length=64), nullable=True),
        sa.Column("progress_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("quiz_score_percent", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["current_step_id"], ["steps.id"]),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "module_id", name="uq_user_progress_user_module"),
    )
    op.create_index("idx_user_progress_user", "user_progress", ["user_id"])
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
    op.create_table(
        "verify_audit_log",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("step_state_id", sa.Uuid(), nullable=False),
        sa.Column("verify_type", sa.String(length=32), nullable=False),
        sa.Column("demo_endpoint", sa.String(length=512), nullable=True),
        sa.Column("http_status", sa.Integer(), nullable=True),
        sa.Column("outcome", sa.String(length=32), nullable=False),
        sa.Column("response_snippet", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["step_state_id"], ["step_states.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_verify_audit_step_state", "verify_audit_log", ["step_state_id", "created_at"])


def downgrade() -> None:
    op.drop_index("idx_verify_audit_step_state", table_name="verify_audit_log")
    op.drop_table("verify_audit_log")
    op.drop_index("idx_step_states_progress", table_name="step_states")
    op.drop_table("step_states")
    op.drop_index("idx_user_progress_user", table_name="user_progress")
    op.drop_table("user_progress")
    op.drop_table("quiz_questions")
    op.drop_index("idx_steps_module_order", table_name="steps")
    op.drop_table("steps")
    op.drop_table("training_accounts")
    op.drop_table("modules")
    op.drop_table("users")
