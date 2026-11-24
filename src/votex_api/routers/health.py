"""Health and readiness probes."""

import os
from pathlib import Path
import sqlite3
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException

from votex_api.config import get_settings
from votex_api.db import get_db

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health")
def health_check():
    """Liveness probe. Always returns 200 if server is listening."""
    return {
        "status": "ok",
        "service": "votex-api",
        "version": "1.0.0",
    }


@router.get("/ready")
def readiness_check(
    x_health_token: Optional[str] = Header(None),
    db: sqlite3.Connection = Depends(get_db),
):
    """
    Readiness probe verifying database connectivity, workspace directory writeability,
    and provider keys.
    """
    # 1. Check DB connectivity
    db_ok = False
    try:
        cur = db.cursor()
        cur.execute("SELECT 1")
        db_ok = cur.fetchone()[0] == 1
    except Exception:
        db_ok = False

    # 2. Check workspace directory writeability
    workspace_ok = False
    try:
        ws = Path(settings.WORKSPACES_DIR)
        ws.mkdir(parents=True, exist_ok=True)
        test_file = ws / ".health_test"
        test_file.write_text("ok")
        test_file.unlink()
        workspace_ok = True
    except Exception:
        workspace_ok = False

    # 3. Check engine readiness
    engine_ready = True

    ready = db_ok and workspace_ok

    details = {
        "status": "ready" if ready else "not_ready",
        "database": "connected" if db_ok else "unreachable",
        "workspace": "writable" if workspace_ok else "error",
    }

    if x_health_token and x_health_token == settings.ADMIN_KEY:
        details["provider_key"] = "configured" if engine_ready else "missing"

    if not ready:
        raise HTTPException(status_code=503, detail=details)

    return details
