import io

import pytest
from fastapi import HTTPException
from PIL import Image

from app.routers.photos import hash_download_token, validate_jpeg


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
