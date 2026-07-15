import uuid
from contextlib import suppress
from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditEvent, GuestEntry, ModerationStatus, Photo
from app.schemas import AdminGuestEntry, AdminIdentity, AdminPhoto, ModerationUpdate
from app.security.cloudflare_access import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])
DatabaseSession = Annotated[Session, Depends(get_db)]
CurrentAdmin = Annotated[AdminIdentity, Depends(require_admin)]


@router.get("/session", response_model=AdminIdentity)
def admin_session(admin: CurrentAdmin) -> AdminIdentity:
    return admin


@router.get("/guestbook", response_model=list[AdminGuestEntry])
def list_guest_entries(
    admin: CurrentAdmin,
    db: DatabaseSession,
    entry_status: Annotated[ModerationStatus, Query(alias="status")] = ModerationStatus.pending,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[GuestEntry]:
    del admin
    statement = (
        select(GuestEntry)
        .where(GuestEntry.status == entry_status)
        .order_by(GuestEntry.created_at.asc())
        .limit(limit)
    )
    return list(db.scalars(statement))


def get_entry_or_404(entry_id: uuid.UUID, db: Session) -> GuestEntry:
    entry = db.get(GuestEntry, entry_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entri tidak ditemukan")
    return entry


@router.patch("/guestbook/{entry_id}", response_model=AdminGuestEntry)
def moderate_guest_entry(
    entry_id: uuid.UUID,
    payload: ModerationUpdate,
    admin: CurrentAdmin,
    db: DatabaseSession,
) -> GuestEntry:
    entry = get_entry_or_404(entry_id, db)
    if payload.status is ModerationStatus.approved and not entry.consent_public:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Harapan privat tidak dapat disetujui untuk publikasi",
        )
    entry.status = payload.status
    entry.reviewed_at = datetime.now(UTC)
    entry.reviewed_by = admin.email
    db.add(
        AuditEvent(
            actor=admin.email,
            action=payload.status.value,
            entity_type="guest_entry",
            entity_id=entry.id,
        )
    )
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/guestbook/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_guest_entry(
    entry_id: uuid.UUID,
    admin: CurrentAdmin,
    db: DatabaseSession,
) -> Response:
    entry = get_entry_or_404(entry_id, db)
    db.add(
        AuditEvent(
            actor=admin.email,
            action="deleted",
            entity_type="guest_entry",
            entity_id=entry.id,
        )
    )
    db.delete(entry)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/photos", response_model=list[AdminPhoto])
def list_photos(
    admin: CurrentAdmin,
    db: DatabaseSession,
    photo_status: Annotated[ModerationStatus, Query(alias="status")] = ModerationStatus.pending,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[Photo]:
    del admin
    statement = (
        select(Photo)
        .where(Photo.status == photo_status)
        .order_by(Photo.created_at.asc())
        .limit(limit)
    )
    return list(db.scalars(statement))


def get_photo_or_404(photo_id: uuid.UUID, db: Session) -> Photo:
    photo = db.get(Photo, photo_id)
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto tidak ditemukan")
    return photo


@router.get("/photos/{photo_id}/content", response_class=FileResponse)
def admin_photo_content(
    photo_id: uuid.UUID,
    admin: CurrentAdmin,
    db: DatabaseSession,
) -> FileResponse:
    del admin
    photo = get_photo_or_404(photo_id, db)
    if not Path(photo.storage_path).is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File foto tidak tersedia",
        )
    return FileResponse(
        photo.storage_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "private, no-store, max-age=0"},
    )


@router.patch("/photos/{photo_id}", response_model=AdminPhoto)
def moderate_photo(
    photo_id: uuid.UUID,
    payload: ModerationUpdate,
    admin: CurrentAdmin,
    db: DatabaseSession,
) -> Photo:
    photo = get_photo_or_404(photo_id, db)
    if payload.status is ModerationStatus.approved and not photo.public_consent:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Foto privat tidak dapat disetujui untuk publikasi",
        )
    photo.status = payload.status
    photo.reviewed_at = datetime.now(UTC)
    photo.reviewed_by = admin.email
    db.add(
        AuditEvent(
            actor=admin.email,
            action=payload.status.value,
            entity_type="photo",
            entity_id=photo.id,
        )
    )
    db.commit()
    db.refresh(photo)
    return photo


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    photo_id: uuid.UUID,
    admin: CurrentAdmin,
    db: DatabaseSession,
) -> Response:
    photo = get_photo_or_404(photo_id, db)
    storage_path = photo.storage_path
    db.add(
        AuditEvent(
            actor=admin.email,
            action="deleted",
            entity_type="photo",
            entity_id=photo.id,
        )
    )
    db.delete(photo)
    db.commit()
    with suppress(OSError):
        Path(storage_path).unlink(missing_ok=True)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
