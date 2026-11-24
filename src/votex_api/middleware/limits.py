"""Request body size limit middleware."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from votex_api.config import get_settings

settings = get_settings()

MAX_JSON_BODY_BYTES = 64 * 1024  # 64 KB
MAX_MULTIPART_BYTES = (settings.MAX_TOTAL_UPLOAD_MB + 5) * 1024 * 1024  # 105 MB


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                content_type = request.headers.get("content-type", "")
                is_upload = (
                    "multipart/form-data" in content_type
                    or request.url.path.startswith("/api/v1/tasks")
                    or request.url.path.startswith("/api/v1/studio")
                ) and request.method == "POST"
                max_bytes = MAX_MULTIPART_BYTES if is_upload else MAX_JSON_BODY_BYTES

                if length > max_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": {
                                "code": "PAYLOAD_TOO_LARGE",
                                "message": f"Request body exceeds maximum allowed limit ({max_bytes // (1024 * 1024)} MB).",
                            }
                        },
                    )
            except ValueError:
                pass

        return await call_next(request)
