import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import ModerationStatus

CONTROL_CHARACTERS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


class GuestEntryCreate(BaseModel):
    display_name: str = Field(min_length=2, max_length=50)
    origin: str = Field(min_length=2, max_length=60)
    message: str = Field(min_length=10, max_length=240)
    consent_public: bool = False

    @field_validator("display_name", "origin", "message", mode="before")
    @classmethod
    def normalize_text(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        normalized = " ".join(value.split())
        if CONTROL_CHARACTERS.search(normalized):
            raise ValueError("Teks mengandung karakter yang tidak diizinkan")
        return normalized


class GuestEntryCreated(BaseModel):
    id: uuid.UUID
    status: ModerationStatus


class ApprovedGuestEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str
    origin: str
    message: str
    created_at: datetime


class AdminIdentity(BaseModel):
    email: str
    subject: str


class AdminGuestEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    display_name: str
    origin: str
    message: str
    status: ModerationStatus
    consent_public: bool
    created_at: datetime
    reviewed_at: datetime | None
    reviewed_by: str | None


class ModerationUpdate(BaseModel):
    status: ModerationStatus

    @field_validator("status")
    @classmethod
    def disallow_pending(cls, value: ModerationStatus) -> ModerationStatus:
        if value is ModerationStatus.pending:
            raise ValueError("Status moderasi harus approved atau rejected")
        return value


class PhotoCreated(BaseModel):
    id: uuid.UUID
    status: ModerationStatus


class PhotoDownloadCreated(BaseModel):
    download_url: str
    expires_at: datetime
