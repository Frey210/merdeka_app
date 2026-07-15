from app.middleware.rate_limit import SlidingWindowRateLimiter


def test_rate_limiter_blocks_until_window_expires() -> None:
    limiter = SlidingWindowRateLimiter(window_seconds=60)

    assert limiter.check("photo:kiosk", limit=2, now=0) == (True, 0)
    assert limiter.check("photo:kiosk", limit=2, now=1) == (True, 0)
    assert limiter.check("photo:kiosk", limit=2, now=2) == (False, 58)
    assert limiter.check("photo:kiosk", limit=2, now=61) == (True, 0)


def test_rate_limiter_separates_clients() -> None:
    limiter = SlidingWindowRateLimiter(window_seconds=60)

    assert limiter.check("guestbook:kiosk-a", limit=1, now=0)[0]
    assert limiter.check("guestbook:kiosk-b", limit=1, now=0)[0]
