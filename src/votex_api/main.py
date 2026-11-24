"""VOTEX FastAPI application entry point."""

from contextlib import asynccontextmanager
import logging
from pathlib import Path
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from votex_api.config import get_settings
from votex_api.db import get_db_context, init_db
from votex_api.logging_config import setup_logging
from votex_api.middleware import (
    RateLimitMiddleware,
    RequestSizeLimitMiddleware,
    SecurityHeadersMiddleware,
    register_error_handlers,
)
from votex_api.routers import (
    artifacts_router,
    auth_router,
    events_router,
    health_router,
    tasks_router,
    studio_router,
)

settings = get_settings()
setup_logging()
log = logging.getLogger("votex_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    log.info("Starting VOTEX API (env=%s)...", settings.APP_ENV)
    init_db()

    # Startup recovery: mark orphaned in-flight tasks as failed
    try:
        with get_db_context() as db:
            cur = db.cursor()
            cur.execute(
                """UPDATE tasks SET status = 'failed',
                   error_message = 'Server restarted while task was in flight.'
                   WHERE status IN ('queued', 'running')"""
            )
            db.commit()
    except Exception as e:
        log.warning("Could not run startup task recovery: %s", e)

    yield
    # Shutdown actions
    log.info("Shutting down VOTEX API...")


def create_app() -> FastAPI:
    app = FastAPI(
        title="VOTEX API",
        description="Autonomous Indian Language Processing Platform",
        version="1.0.0",
        docs_url="/api/docs" if settings.APP_ENV != "prod" else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    # 1. Request ID middleware
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = req_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response

    # 2. Security Headers middleware
    app.add_middleware(SecurityHeadersMiddleware)

    # 3. Explicit CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "Retry-After"],
    )

    # 4. Rate Limiting middleware
    app.add_middleware(RateLimitMiddleware)

    # 5. Request body size limit middleware
    app.add_middleware(RequestSizeLimitMiddleware)

    # 6. Global error handlers (JSON error envelope)
    register_error_handlers(app)

    # 7. Mount Routers
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(tasks_router)
    app.include_router(events_router)
    app.include_router(artifacts_router)
    app.include_router(studio_router, prefix="/api/v1")

    # 8. Mount Built Frontend (Production single-service deployment)
    dist_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
    if dist_dir.exists():
        app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="frontend")

    return app


app = create_app()
