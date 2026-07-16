import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ModerationStatus(StrEnum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class GuestEntry(Base):
    __tablename__ = "guest_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str] = mapped_column(String(50))
    origin: Mapped[str] = mapped_column(String(60))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[ModerationStatus] = mapped_column(
        Enum(ModerationStatus, name="moderation_status"),
        default=ModerationStatus.pending,
        index=True,
    )
    consent_public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewed_by: Mapped[str | None] = mapped_column(String(255))
    photos: Mapped[list["Photo"]] = relationship(back_populates="guest_entry")


class Photo(Base):
    __tablename__ = "photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    guest_entry_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("guest_entries.id"))
    storage_path: Mapped[str] = mapped_column(String(500), unique=True)
    public_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[ModerationStatus] = mapped_column(
        Enum(ModerationStatus, name="moderation_status", create_type=False),
        default=ModerationStatus.pending,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewed_by: Mapped[str | None] = mapped_column(String(255))
    guest_entry: Mapped[GuestEntry | None] = relationship(back_populates="photos")
    download_tokens: Mapped[list["DownloadToken"]] = relationship(
        back_populates="photo",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class DownloadToken(Base):
    __tablename__ = "download_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    photo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("photos.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    download_count: Mapped[int] = mapped_column(default=0)
    max_downloads: Mapped[int | None]
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    photo: Mapped[Photo] = relationship(back_populates="download_tokens")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor: Mapped[str] = mapped_column(String(255), index=True)
    action: Mapped[str] = mapped_column(String(50), index=True)
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seed: Mapped[int] = mapped_column(BigInteger)
    config_version: Mapped[str] = mapped_column(String(20), default="v1")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    verified_score: Mapped[int | None] = mapped_column(Integer)
    input_replay: Mapped[list[int] | None] = mapped_column(JSON)
    leaderboard_entry: Mapped["LeaderboardEntry | None"] = relationship(
        back_populates="game_session",
        cascade="all, delete-orphan",
        uselist=False,
    )


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    game_session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("game_sessions.id", ondelete="CASCADE"), unique=True, index=True
    )
    display_name: Mapped[str] = mapped_column(String(20))
    score: Mapped[int] = mapped_column(Integer, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    hidden_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    game_session: Mapped[GameSession] = relationship(back_populates="leaderboard_entry")
