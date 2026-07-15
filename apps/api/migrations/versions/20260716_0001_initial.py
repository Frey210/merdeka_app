"""Create initial guest book and photo tables."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260716_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    moderation_status = postgresql.ENUM(
        "pending", "approved", "rejected", name="moderation_status", create_type=False
    )
    moderation_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "guest_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("display_name", sa.String(50), nullable=False),
        sa.Column("origin", sa.String(60), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", moderation_status, nullable=False),
        sa.Column("consent_public", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True)),
        sa.Column("reviewed_by", sa.String(255)),
    )
    op.create_index("ix_guest_entries_status", "guest_entries", ["status"])

    op.create_table(
        "photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "guest_entry_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("guest_entries.id")
        ),
        sa.Column("storage_path", sa.String(500), nullable=False, unique=True),
        sa.Column("public_consent", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("status", moderation_status, nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_photos_status", "photos", ["status"])
    op.create_index("ix_photos_expires_at", "photos", ["expires_at"])

    op.create_table(
        "download_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "photo_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("photos.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("download_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_downloads", sa.Integer()),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_download_tokens_token_hash", "download_tokens", ["token_hash"])
    op.create_index("ix_download_tokens_expires_at", "download_tokens", ["expires_at"])


def downgrade() -> None:
    op.drop_table("download_tokens")
    op.drop_table("photos")
    op.drop_table("guest_entries")
    postgresql.ENUM(name="moderation_status").drop(op.get_bind(), checkfirst=True)
