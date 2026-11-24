"""Server-Sent Event payload schema."""

from typing import Any, Dict, Optional
from pydantic import BaseModel


class TaskEventDTO(BaseModel):
    event_id: int
    task_id: str
    event_type: str  # task_started, step_started, step_completed, verification, budget_update, task_finished, task_failed
    data: Dict[str, Any]
    timestamp: str
