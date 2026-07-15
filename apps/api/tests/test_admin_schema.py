import uuid
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models import ModerationStatus
from app.routers.admin import moderate_guest_entry
from app.schemas import AdminIdentity, ModerationUpdate


def test_moderation_accepts_terminal_status() -> None:
    assert ModerationUpdate(status="approved").status is ModerationStatus.approved


def test_moderation_rejects_pending_status() -> None:
    with pytest.raises(ValidationError):
        ModerationUpdate(status="pending")


def test_moderation_rejects_private_guestbook_approval() -> None:
    db = Mock()
    db.get.return_value = SimpleNamespace(consent_public=False)

    with pytest.raises(HTTPException) as caught:
        moderate_guest_entry(
            uuid.uuid4(),
            ModerationUpdate(status="approved"),
            AdminIdentity(email="admin@example.test", subject="admin-id"),
            db,
        )

    assert caught.value.status_code == 409
