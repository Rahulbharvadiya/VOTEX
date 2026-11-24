"""Sandboxed artifact download endpoints."""

from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from starlette.responses import FileResponse

from votex_api.config import get_settings
from votex_api.dependencies import get_current_user, get_task_service
from votex_api.models import User
from votex_api.services import TaskService

router = APIRouter(prefix="/api/v1/tasks", tags=["artifacts"])
settings = get_settings()


@router.get("/{task_id}/artifacts/{artifact_id}")
async def download_artifact(
    task_id: str,
    artifact_id: str,
    user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service),
):
    # Verify task ownership
    task = await task_service.task_repo.get_by_id(task_id, user_id=user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    artifact = await task_service.task_repo.get_artifact(artifact_id)
    if not artifact or artifact.task_id != task.id:
        raise HTTPException(status_code=404, detail="Artifact not found")

    # Secure path containment check
    workspace_outputs = (Path(settings.WORKSPACES_DIR) / task.workspace_rel_path / "outputs").resolve()
    file_path = (workspace_outputs / artifact.rel_path).resolve()

    try:
        file_path.relative_to(workspace_outputs)
    except ValueError:
        raise HTTPException(status_code=403, detail="Illegal artifact path access")

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Artifact file missing from disk")

    # Inline playback for audio, attachment download for others
    is_audio = artifact.kind == "audio"
    disposition = "inline" if is_audio else f'attachment; filename="{artifact.display_name}"'

    return FileResponse(
        path=str(file_path),
        media_type=artifact.mime_type,
        headers={
            "Content-Disposition": disposition,
            "X-Content-Type-Options": "nosniff",
        },
    )
