import hashlib
import hmac
import io
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from PIL import Image, UnidentifiedImageError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.models import DownloadToken, ModerationStatus, Photo
from app.schemas import ApprovedPhoto, PhotoCreated, PhotoDownloadCreated

router = APIRouter(prefix="/photos", tags=["photos"])
download_router = APIRouter(prefix="/d", tags=["downloads"])
DatabaseSession = Annotated[Session, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_settings)]

MAX_PHOTO_BYTES = 2 * 1024 * 1024
PHOTO_RETENTION = timedelta(days=7)
DOWNLOAD_LIFETIME = timedelta(hours=24)


def hash_download_token(token: str, secret: str) -> str:
    return hmac.new(secret.encode(), token.encode(), hashlib.sha256).hexdigest()


def validate_jpeg(content: bytes) -> None:
    if not content or len(content) > MAX_PHOTO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Foto harus berukuran maksimum 2 MB",
        )
    try:
        with Image.open(io.BytesIO(content)) as image:
            image.verify()
        with Image.open(io.BytesIO(content)) as image:
            if image.format != "JPEG":
                raise ValueError("not jpeg")
            width, height = image.size
            if width < 640 or height < 360 or width > 4096 or height > 4096:
                raise ValueError("invalid dimensions")
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="File bukan JPEG photobooth yang valid",
        ) from error


@router.post("", response_model=PhotoCreated, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    db: DatabaseSession,
    settings: AppSettings,
    photo: Annotated[UploadFile, File()],
    public_consent: Annotated[bool, Form()] = False,
) -> Photo:
    if photo.content_type not in {"image/jpeg", "image/jpg"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Format foto harus JPEG",
        )
    content = await photo.read(MAX_PHOTO_BYTES + 1)
    validate_jpeg(content)

    photo_id = uuid.uuid4()
    storage_dir = Path(settings.photo_storage_path)
    storage_dir.mkdir(parents=True, exist_ok=True)
    destination = storage_dir / f"{photo_id}.jpg"
    destination.write_bytes(content)

    record = Photo(
        id=photo_id,
        storage_path=str(destination),
        public_consent=public_consent,
        status=(ModerationStatus.approved if public_consent else ModerationStatus.pending),
        expires_at=datetime.now(UTC) + PHOTO_RETENTION,
        reviewed_at=datetime.now(UTC) if public_consent else None,
        reviewed_by="automatic_publication" if public_consent else None,
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    return record


@router.get("/approved", response_model=list[ApprovedPhoto])
def list_approved_photos(
    db: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> list[Photo]:
    now = datetime.now(UTC)
    statement = (
        select(Photo)
        .where(
            Photo.status == ModerationStatus.approved,
            Photo.public_consent.is_(True),
            Photo.expires_at > now,
        )
        .order_by(Photo.created_at.desc())
        .limit(50)
    )
    available = [photo for photo in db.scalars(statement) if Path(photo.storage_path).is_file()]
    return available[:limit]


@router.get("/approved/{photo_id}/content", response_class=FileResponse)
def approved_photo_content(photo_id: uuid.UUID, db: DatabaseSession) -> FileResponse:
    photo = db.get(Photo, photo_id)
    now = datetime.now(UTC)
    if (
        photo is None
        or photo.status is not ModerationStatus.approved
        or not photo.public_consent
        or photo.expires_at <= now
        or not Path(photo.storage_path).is_file()
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto tidak tersedia")
    return FileResponse(
        photo.storage_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=60"},
    )


@router.post("/{photo_id}/download", response_model=PhotoDownloadCreated)
def create_photo_download(
    photo_id: uuid.UUID,
    db: DatabaseSession,
    settings: AppSettings,
) -> PhotoDownloadCreated:
    photo = db.get(Photo, photo_id)
    if photo is None or photo.expires_at <= datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto tidak ditemukan")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + DOWNLOAD_LIFETIME
    db.add(
        DownloadToken(
            photo_id=photo.id,
            token_hash=hash_download_token(token, settings.download_token_secret),
            expires_at=expires_at,
            download_count=0,
            max_downloads=None,
        )
    )
    db.commit()
    base_url = settings.app_public_base_url.rstrip("/")
    return PhotoDownloadCreated(download_url=f"{base_url}/d/{token}", expires_at=expires_at)


@download_router.get("/{token}", response_class=FileResponse)
def download_photo(token: str, db: DatabaseSession, settings: AppSettings) -> FileResponse:
    token_hash = hash_download_token(token, settings.download_token_secret)
    record = db.scalar(select(DownloadToken).where(DownloadToken.token_hash == token_hash))
    now = datetime.now(UTC)
    if (
        record is None
        or record.revoked_at is not None
        or record.expires_at <= now
        or (record.max_downloads is not None and record.download_count >= record.max_downloads)
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tautan unduh tidak valid atau telah kedaluwarsa",
        )

    photo = db.get(Photo, record.photo_id)
    if photo is None or photo.expires_at <= now or not Path(photo.storage_path).is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto tidak tersedia")

    record.download_count += 1
    db.commit()
    return FileResponse(
        photo.storage_path,
        media_type="image/jpeg",
        filename="photobooth-merdeka-upg.jpg",
        headers={"Cache-Control": "private, no-store, max-age=0"},
    )
