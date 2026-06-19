"""lesson revisions and draft/publish columns

Revision ID: 008
Revises: 007
Create Date: 2026-06-18
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

json_type = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def upgrade() -> None:
    op.add_column(
        "lessons",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "lessons",
        sa.Column("draft_payload", json_type, nullable=True),
    )
    op.add_column(
        "lessons",
        sa.Column(
            "has_unpublished_changes",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.create_table(
        "lesson_revisions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("lesson_id", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("label", sa.String(length=255), nullable=True),
        sa.Column("snapshot_json", json_type, nullable=False),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lesson_revisions_lesson_created", "lesson_revisions", ["lesson_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_lesson_revisions_lesson_created", table_name="lesson_revisions")
    op.drop_table("lesson_revisions")
    op.drop_column("lessons", "has_unpublished_changes")
    op.drop_column("lessons", "draft_payload")
    op.drop_column("lessons", "published_at")
