"""Router exports."""

from votex_api.routers.health import router as health_router
from votex_api.routers.auth import router as auth_router
from votex_api.routers.tasks import router as tasks_router
from votex_api.routers.events import router as events_router
from votex_api.routers.artifacts import router as artifacts_router
from votex_api.routers.studio import router as studio_router

__all__ = [
    "health_router",
    "auth_router",
    "tasks_router",
    "events_router",
    "artifacts_router",
    "studio_router",
]
