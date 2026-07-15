"""Add photo review metadata."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260716_0003"
down_revision: str | None = "20260716_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("photos", sa.Column("reviewed_at", sa.DateTime(timezone=True)))
    op.add_column("photos", sa.Column("reviewed_by", sa.String(255)))


def downgrade() -> None:
    op.drop_column("photos", "reviewed_by")
    op.drop_column("photos", "reviewed_at")
