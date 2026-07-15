from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI

from app.config import get_settings
from app.routers.health import router as health_router

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Path(settings.photo_storage_path).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
    lifespan=lifespan,
)
app.include_router(health_router, prefix="/api/v1")

