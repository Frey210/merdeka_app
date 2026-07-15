import pytest
from pydantic import ValidationError

from app.models import ModerationStatus
from app.schemas import ModerationUpdate


def test_moderation_accepts_terminal_status() -> None:
    assert ModerationUpdate(status="approved").status is ModerationStatus.approved


def test_moderation_rejects_pending_status() -> None:
    with pytest.raises(ValidationError):
        ModerationUpdate(status="pending")
