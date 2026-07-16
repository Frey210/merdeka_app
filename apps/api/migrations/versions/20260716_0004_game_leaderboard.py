"""Add Dino Merdeka game sessions and leaderboard."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260716_0004"
down_revision: str | None = "20260716_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "game_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("seed", sa.BigInteger(), nullable=False),
        sa.Column("config_version", sa.String(20), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("verified_score", sa.Integer()),
        sa.Column("input_replay", sa.JSON()),
    )
    op.create_index("ix_game_sessions_expires_at", "game_sessions", ["expires_at"])
    op.create_table(
        "leaderboard_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "game_session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("game_sessions.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("display_name", sa.String(20), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("hidden_at", sa.DateTime(timezone=True)),
    )
    op.create_index(
        "ix_leaderboard_entries_game_session_id", "leaderboard_entries", ["game_session_id"]
    )
    op.create_index("ix_leaderboard_entries_score", "leaderboard_entries", ["score"])
    op.create_index("ix_leaderboard_entries_created_at", "leaderboard_entries", ["created_at"])
    op.create_index("ix_leaderboard_entries_hidden_at", "leaderboard_entries", ["hidden_at"])


def downgrade() -> None:
    op.drop_table("leaderboard_entries")
    op.drop_table("game_sessions")
