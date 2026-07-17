import uuid
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.routers.game import finish_game_session, validate_replay
from app.schemas import GameFinishInput


def make_payload(**overrides: object) -> GameFinishInput:
    values: dict[str, object] = {
        "display_name": "Garuda 81",
        "duration_ms": 12_000,
        "jump_times_ms": [1_000, 2_500, 4_200],
    }
    values.update(overrides)
    return GameFinishInput(**values)


def test_game_name_is_normalized() -> None:
    assert make_payload(display_name="  Garuda   81  ").display_name == "Garuda 81"


def test_game_name_rejects_too_short_value() -> None:
    with pytest.raises(ValidationError):
        make_payload(display_name="A")


def test_replay_accepts_plausible_input() -> None:
    validate_replay(make_payload(), elapsed_ms=12_500)


def test_replay_rejects_future_duration() -> None:
    with pytest.raises(HTTPException) as caught:
        validate_replay(make_payload(duration_ms=20_000), elapsed_ms=10_000)

    assert caught.value.status_code == 422


def test_replay_rejects_impossibly_fast_jump_input() -> None:
    with pytest.raises(HTTPException) as caught:
        validate_replay(make_payload(jump_times_ms=[1_000, 1_050]), elapsed_ms=12_500)

    assert caught.value.status_code == 422


def test_finish_rejects_public_name_with_profanity() -> None:
    db = Mock()
    now = datetime.now(UTC)
    db.get.return_value = SimpleNamespace(
        started_at=now - timedelta(seconds=20),
        expires_at=now + timedelta(minutes=1),
        completed_at=None,
    )

    with pytest.raises(HTTPException) as caught:
        finish_game_session(
            uuid.uuid4(),
            make_payload(display_name="G0bl0k"),
            db,
        )

    assert caught.value.status_code == 422
