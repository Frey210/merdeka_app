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

