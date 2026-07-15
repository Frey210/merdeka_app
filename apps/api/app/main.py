import asyncio
import logging
from contextlib import asynccontextmanager, suppress
from pathlib import Path

from fastapi import FastAPI

from app.config import get_settings
from app.middleware.rate_limit import enforce_public_rate_limit
from app.routers.admin import router as admin_router
from app.routers.guestbook import router as guestbook_router
from app.routers.health import router as health_router
from app.routers.photos import download_router
from app.routers.photos import router as photos_router
from app.services.retention import cleanup_expired_photos

settings = get_settings()


async def retention_loop() -> None:
    while True:
        try:
            await asyncio.to_thread(cleanup_expired_photos)
        except Exception:
            logging.getLogger(__name__).exception("Cleanup retensi gagal")
        await asyncio.sleep(60 * 60)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Path(settings.photo_storage_path).mkdir(parents=True, exist_ok=True)
    retention_task = asyncio.create_task(retention_loop())
    try:
        yield
    finally:
        retention_task.cancel()
        with suppress(asyncio.CancelledError):
            await retention_task


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
    lifespan=lifespan,
)
app.middleware("http")(enforce_public_rate_limit)
app.include_router(health_router, prefix="/api/v1")
app.include_router(guestbook_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(photos_router, prefix="/api/v1")
app.include_router(download_router)
