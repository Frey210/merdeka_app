import math
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import RequestResponseEndpoint
from starlette.responses import Response

PUBLIC_POST_LIMITS = {
    "/api/v1/guestbook": 10,
    "/api/v1/photos": 6,
}


class SlidingWindowRateLimiter:
    def __init__(self, window_seconds: int = 60) -> None:
        self.window_seconds = window_seconds
        self.requests: dict[str, deque[float]] = defaultdict(deque)
        self.lock = Lock()

    def check(self, key: str, limit: int, now: float | None = None) -> tuple[bool, int]:
        timestamp = time.monotonic() if now is None else now
        cutoff = timestamp - self.window_seconds
        with self.lock:
            events = self.requests[key]
            while events and events[0] <= cutoff:
                events.popleft()
            if len(events) >= limit:
                retry_after = max(1, math.ceil(events[0] + self.window_seconds - timestamp))
                return False, retry_after
            events.append(timestamp)
            return True, 0


limiter = SlidingWindowRateLimiter()


async def enforce_public_rate_limit(
    request: Request,
    call_next: RequestResponseEndpoint,
) -> Response:
    limit = PUBLIC_POST_LIMITS.get(request.url.path) if request.method == "POST" else None
    if limit is None:
        return await call_next(request)

    client_ip = request.headers.get("CF-Connecting-IP")
    if not client_ip:
        client_ip = request.client.host if request.client else "unknown"
    allowed, retry_after = limiter.check(f"{request.url.path}:{client_ip}", limit)
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={"detail": "Terlalu banyak permintaan. Coba lagi sebentar."},
            headers={"Retry-After": str(retry_after)},
        )
    return await call_next(request)
