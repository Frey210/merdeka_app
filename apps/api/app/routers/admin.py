import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditEvent, GuestEntry, ModerationStatus
from app.schemas import AdminGuestEntry, AdminIdentity, ModerationUpdate
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
