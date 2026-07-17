from unittest.mock import Mock

import pytest
from pydantic import ValidationError

from app.models import GuestEntry, ModerationStatus
from app.routers.guestbook import create_guest_entry
from app.schemas import GuestEntryCreate


def test_guest_entry_normalizes_whitespace() -> None:
    entry = GuestEntryCreate(
        display_name="  Budi   Hasan  ",
        origin="  Makassar ",
        message="  Indonesia   semakin maju dan adil. ",
        consent_public=True,
    )

    assert entry.display_name == "Budi Hasan"
    assert entry.origin == "Makassar"
    assert entry.message == "Indonesia semakin maju dan adil."


def test_guest_entry_rejects_short_message() -> None:
    with pytest.raises(ValidationError):
        GuestEntryCreate(
            display_name="Budi",
            origin="Makassar",
            message="Maju!",
        )


def test_public_guest_entry_is_published_immediately_when_clean() -> None:
    db = Mock()
    result = create_guest_entry(
        GuestEntryCreate(
            display_name="Budi",
            origin="Makassar",
            message="Semoga Indonesia semakin maju.",
            consent_public=True,
        ),
        db,
    )

    assert isinstance(result, GuestEntry)
    assert result.status is ModerationStatus.approved
    assert result.reviewed_by == "automatic_filter"


def test_public_guest_entry_is_hidden_when_filter_matches() -> None:
    db = Mock()
    result = create_guest_entry(
        GuestEntryCreate(
            display_name="Budi",
            origin="Makassar",
            message="Kalimat g0bl0k tidak boleh tampil.",
            consent_public=True,
        ),
        db,
    )

    assert result.status is ModerationStatus.rejected
