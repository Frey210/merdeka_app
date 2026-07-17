from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GuestEntry, ModerationStatus
from app.schemas import ApprovedGuestEntry, GuestEntryCreate, GuestEntryCreated
from app.services.content_filter import contains_profanity

router = APIRouter(prefix="/guestbook", tags=["guestbook"])
DatabaseSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=GuestEntryCreated, status_code=status.HTTP_201_CREATED)
def create_guest_entry(payload: GuestEntryCreate, db: DatabaseSession) -> GuestEntry:
    is_blocked = contains_profanity(payload.display_name, payload.origin, payload.message)
    entry_status = (
        ModerationStatus.rejected
        if is_blocked
        else ModerationStatus.approved
        if payload.consent_public
        else ModerationStatus.pending
    )
    entry = GuestEntry(
        **payload.model_dump(),
        status=entry_status,
        reviewed_at=datetime.now(UTC) if entry_status is not ModerationStatus.pending else None,
        reviewed_by="automatic_filter" if entry_status is not ModerationStatus.pending else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/approved", response_model=list[ApprovedGuestEntry])
def list_approved_entries(
    db: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> list[GuestEntry]:
    statement = (
        select(GuestEntry)
        .where(
            GuestEntry.status == ModerationStatus.approved,
            GuestEntry.consent_public.is_(True),
        )
        .order_by(GuestEntry.created_at.desc())
        .limit(limit)
    )
    return list(db.scalars(statement))
