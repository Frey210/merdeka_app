import pytest
from pydantic import ValidationError

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

