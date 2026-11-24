"""Integration tests for health and readiness endpoints."""

from votex_api.config import get_settings
from votex_api.db import get_connection
from votex_api.routers.health import health_check, readiness_check


def test_health_endpoint():
    res = health_check()
    assert res["status"] == "ok"
    assert res["service"] == "votex-api"
    assert res["version"] == "1.0.0"


def test_readiness_endpoint():
    conn = get_connection()
    try:
        settings = get_settings()
        res = readiness_check(x_health_token=settings.ADMIN_KEY, db=conn)
        assert res["status"] == "ready"
        assert res["database"] == "connected"
        assert res["workspace"] == "writable"
        assert "provider_key" in res
    finally:
        conn.close()
