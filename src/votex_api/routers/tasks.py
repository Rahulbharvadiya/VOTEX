"""Task management endpoints."""

from typing import List, Optional
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Query,
    UploadFile,
)

from votex_api.config import get_settings
from votex_api.dependencies import get_current_user, get_task_service, verify_csrf
from votex_api.models import User
from votex_api.schemas import TaskDTO, TaskListResponse
from votex_api.services import TaskService

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])
settings = get_settings()


@router.post("", response_model=TaskDTO, status_code=201)
async def create_task(
    background_tasks: BackgroundTasks,
    prompt: str = Form(..., min_length=5, max_length=2000),
    max_steps: int = Form(30, ge=1, le=30),
    max_cost_inr: float = Form(20.0, ge=0.50, le=20.0),
    max_seconds: int = Form(300, ge=15, le=300),
    files: List[UploadFile] = File([]),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service),
    _csrf: None = Depends(verify_csrf),
):
    if not settings.NEW_TASKS_ENABLED:
        raise HTTPException(status_code=503, detail="Task submission is temporarily paused for maintenance")

    return await task_service.create_task(
        user=user,
        prompt=prompt,
        files=files,
        max_steps=max_steps,
        max_cost_inr=max_cost_inr,
        max_seconds=max_seconds,
        idempotency_key=idempotency_key,
        background_tasks=background_tasks,
    )


@router.get("", response_model=TaskListResponse)
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    status: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service),
):
    return task_service.list_tasks(
        user=user,
        page=page,
        page_size=page_size,
        status=status,
    )


@router.get("/{task_id}", response_model=TaskDTO)
def get_task(
    task_id: str,
    user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service),
):
    return task_service.get_task(task_id, user)


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: str,
    user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service),
    _csrf: None = Depends(verify_csrf),
):
    task_service.delete_task(task_id, user)
    return None
