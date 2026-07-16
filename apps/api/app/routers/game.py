import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated, Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GameSession, LeaderboardEntry
from app.schemas import (
    GameFinishInput,
    GameFinishResult,
    GameSessionCreated,
    LeaderboardItem,
    LeaderboardResponse,
)

router = APIRouter(prefix="/game", tags=["game"])
DatabaseSession = Annotated[Session, Depends(get_db)]
SESSION_LIFETIME = timedelta(minutes=5)
MAX_CLOCK_TOLERANCE_MS = 5_000
MIN_JUMP_INTERVAL_MS = 100


@router.post("/sessions", response_model=GameSessionCreated, status_code=status.HTTP_201_CREATED)
def create_game_session(db: DatabaseSession) -> GameSession:
    now = datetime.now(UTC)
    session = GameSession(
        seed=secrets.randbelow(2_147_483_647),
        config_version="v1",
        expires_at=now + SESSION_LIFETIME,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def validate_replay(payload: GameFinishInput, elapsed_ms: int) -> None:
    if payload.duration_ms > elapsed_ms + MAX_CLOCK_TOLERANCE_MS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Durasi permainan tidak valid",
        )
    previous = -MIN_JUMP_INTERVAL_MS
    for timestamp in payload.jump_times_ms:
        if timestamp < 0 or timestamp > payload.duration_ms:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Replay permainan tidak valid",
            )
        if timestamp - previous < MIN_JUMP_INTERVAL_MS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Input permainan terlalu cepat",
            )
        previous = timestamp


@router.post("/sessions/{session_id}/finish", response_model=GameFinishResult)
def finish_game_session(
    session_id: uuid.UUID,
    payload: GameFinishInput,
    db: DatabaseSession,
) -> GameFinishResult:
    game_session = db.get(GameSession, session_id)
    now = datetime.now(UTC)
    if game_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sesi game tidak ditemukan"
        )
    if game_session.completed_at is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Skor sudah dikirim")
    if game_session.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Sesi game telah kedaluwarsa")

    elapsed_ms = max(0, int((now - game_session.started_at).total_seconds() * 1_000))
    validate_replay(payload, elapsed_ms)
    verified_score = payload.duration_ms // 100

    game_session.completed_at = now
    game_session.verified_score = verified_score
    game_session.input_replay = payload.jump_times_ms
    entry = LeaderboardEntry(
        game_session_id=game_session.id,
        display_name=payload.display_name,
        score=verified_score,
    )
    db.add(entry)
    db.flush()
    higher_scores = db.scalar(
        select(func.count())
        .select_from(LeaderboardEntry)
        .where(
            LeaderboardEntry.hidden_at.is_(None),
            LeaderboardEntry.score > verified_score,
        )
    )
    db.commit()
    return GameFinishResult(score=verified_score, rank=int(higher_scores or 0) + 1)


@router.get("/leaderboard", response_model=LeaderboardResponse)
def list_leaderboard(
    db: DatabaseSession,
    period: Annotated[Literal["daily", "all-time"], Query()] = "daily",
    limit: Annotated[int, Query(ge=1, le=20)] = 10,
) -> LeaderboardResponse:
    statement = select(LeaderboardEntry).where(LeaderboardEntry.hidden_at.is_(None))
    if period == "daily":
        local_now = datetime.now(ZoneInfo("Asia/Makassar"))
        local_start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
        statement = statement.where(LeaderboardEntry.created_at >= local_start.astimezone(UTC))
    statement = statement.order_by(
        LeaderboardEntry.score.desc(), LeaderboardEntry.created_at.asc()
    ).limit(limit)
    entries = list(db.scalars(statement))
    items = [
        LeaderboardItem(
            rank=index,
            display_name=entry.display_name,
            score=entry.score,
            created_at=entry.created_at,
        )
        for index, entry in enumerate(entries, start=1)
    ]
    return LeaderboardResponse(period=period, items=items)
