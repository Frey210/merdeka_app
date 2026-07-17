"""Auto-publish consented kiosk content after language filtering."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.services.content_filter import contains_profanity

revision: str = "20260717_0005"
down_revision: str | None = "20260716_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    connection = op.get_bind()
    entries = connection.execute(
        sa.text(
            """
            SELECT id, display_name, origin, message
            FROM guest_entries
            WHERE status = 'pending' AND consent_public IS TRUE
            """
        )
    ).mappings()
    for entry in entries:
        next_status = (
            "rejected"
            if contains_profanity(entry["display_name"], entry["origin"], entry["message"])
            else "approved"
        )
        connection.execute(
            sa.text(
                """
                UPDATE guest_entries
                SET status = :status, reviewed_at = now(), reviewed_by = 'automatic_filter'
                WHERE id = :id
                """
            ),
            {"status": next_status, "id": entry["id"]},
        )

    connection.execute(
        sa.text(
            """
            UPDATE photos
            SET status = 'approved', reviewed_at = now(), reviewed_by = 'automatic_publication'
            WHERE status = 'pending' AND public_consent IS TRUE
            """
        )
    )


def downgrade() -> None:
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            UPDATE guest_entries
            SET status = 'pending', reviewed_at = NULL, reviewed_by = NULL
            WHERE reviewed_by = 'automatic_filter'
            """
        )
    )
    connection.execute(
        sa.text(
            """
            UPDATE photos
            SET status = 'pending', reviewed_at = NULL, reviewed_by = NULL
            WHERE reviewed_by = 'automatic_publication'
            """
        )
    )
