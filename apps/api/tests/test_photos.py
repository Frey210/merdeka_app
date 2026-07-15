import io
import uuid
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import HTTPException
from PIL import Image

from app.config import Settings
from app.models import DownloadToken, ModerationStatus
from app.routers.photos import (
    approved_photo_content,
    create_photo_download,
    hash_download_token,
    list_approved_photos,
    validate_jpeg,
)


def make_jpeg() -> bytes:
    output = io.BytesIO()
    Image.new("RGB", (640, 360), "red").save(output, format="JPEG")
    return output.getvalue()


def test_validate_jpeg_accepts_photobooth_size() -> None:
    validate_jpeg(make_jpeg())


def test_validate_jpeg_rejects_non_image() -> None:
    with pytest.raises(HTTPException) as caught:
        validate_jpeg(b"not-a-photo")

    assert caught.value.status_code == 422


def test_download_token_hash_is_secret_bound() -> None:
    assert hash_download_token("token", "secret-one") != hash_download_token(
        "token", "secret-two"
    )


def test_public_feed_omits_missing_photo_files(tmp_path) -> None:
    available_path = tmp_path / "available.jpg"
    available_path.write_bytes(make_jpeg())
    available = SimpleNamespace(storage_path=str(available_path))
    missing = SimpleNamespace(storage_path=str(tmp_path / "missing.jpg"))
    db = Mock()
    db.scalars.return_value = [available, missing]

    assert list_approved_photos(db, limit=20) == [available]


def test_private_photo_is_not_available_from_public_content_endpoint() -> None:
    photo_id = uuid.uuid4()
    db = Mock()
    db.get.return_value = SimpleNamespace(
        status=ModerationStatus.approved,
        public_consent=False,
        expires_at=datetime.now(UTC) + timedelta(days=1),
        storage_path="private.jpg",
    )

    with pytest.raises(HTTPException) as caught:
        approved_photo_content(photo_id, db)

    assert caught.value.status_code == 404


def test_private_photo_still_receives_download_token() -> None:
    photo_id = uuid.uuid4()
    db = Mock()
    db.get.return_value = SimpleNamespace(
        id=photo_id,
        public_consent=False,
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )
    settings = Settings(
        app_public_base_url="https://merdeka.example.test",
        download_token_secret="test-secret",
    )

    result = create_photo_download(photo_id, db, settings)

    assert result.download_url.startswith("https://merdeka.example.test/d/")
    assert isinstance(db.add.call_args.args[0], DownloadToken)
    db.commit.assert_called_once()
