"""Rate limiting middleware using sliding window counters."""

import time
from collections import defaultdict
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from votex_api.config import get_settings

settings = get_settings()


class SlidingWindowRateLimiter:
    def __init__(self):
        # key -> list of timestamps
        self.hits: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_hits: int, window_seconds: int) -> Tuple[bool, int]:
        now = time.monotonic()
        cutoff = now - window_seconds
        # Clean older hits
        self.hits[key] = [t for t in self.hits[key] if t > cutoff]

        if len(self.hits[key]) >= max_hits:
            oldest = self.hits[key][0]
            retry_after = int(window_seconds - (now - oldest)) + 1
            return False, max(1, retry_after)

        self.hits[key].append(now)
        return True, 0


limiter = SlidingWindowRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract client IP
        forwarded = request.headers.get("X-Forwarded-For")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "127.0.0.1")
        path = request.url.path

        # Sensitive route rate limits
        if path.startswith("/api/v1/auth/login") and request.method == "POST":
            allowed, retry_after = limiter.is_allowed(f"login_{client_ip}", settings.RATE_LIMIT_LOGIN_PER_MIN, 60)
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": f"Too many login attempts. Please retry after {retry_after} seconds.",
                            "details": {"retry_after_seconds": retry_after},
                        }
                    },
                    headers={"Retry-After": str(retry_after)},
                )

        return await call_next(request)
