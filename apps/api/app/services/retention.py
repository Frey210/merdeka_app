import logging
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select, text

from app.database import SessionLocal
from app.models import Photo

logger = logging.getLogger(__name__)
RETENTION_LOCK_ID = 812026


def cleanup_expired_photos() -> int:
    removed_paths: list[str] = []
    with SessionLocal() as db:
        locked = db.scalar(
            text("SELECT pg_try_advisory_xact_lock(:lock_id)"),
            {"lock_id": RETENTION_LOCK_ID},
        )
        if not locked:
            return 0
        expired = list(db.scalars(select(Photo).where(Photo.expires_at <= datetime.now(UTC))))
        for photo in expired:
            removed_paths.append(photo.storage_path)
            db.delete(photo)
        db.commit()

    for storage_path in removed_paths:
        try:
            Path(storage_path).unlink(missing_ok=True)
        except OSError:
            logger.exception("Gagal menghapus file foto kedaluwarsa")
    if removed_paths:
        logger.info("Cleanup retensi menghapus %d foto", len(removed_paths))
    return len(removed_paths)
