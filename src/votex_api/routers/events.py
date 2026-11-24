"""Server-Sent Events (SSE) live progress stream."""

from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from starlette.responses import StreamingResponse

from votex_api.dependencies import get_current_user, get_task_service
from votex_api.models import User
from votex_api.services import event_broker, TaskService

router = APIRouter(prefix="/api/v1/tasks", tags=["events"])


@router.get("/{task_id}/events")
async def stream_task_events(
    task_id: str,
    last_event_id: Optional[str] = Header(None, alias="Last-Event-ID"),
    query_last_id: Optional[int] = Query(0, alias="last_event_id"),
    user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service),
):
    # Enforce strict IDOR check: verify user owns this task
    await task_service.get_task(task_id, user)

    # Determine last event sequence ID
    parsed_id = 0
    if last_event_id and last_event_id.isdigit():
        parsed_id = int(last_event_id)
    elif query_last_id and query_last_id > 0:
        parsed_id = query_last_id

    stream = event_broker.subscribe(task_id=task_id, last_event_id=parsed_id)

    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
