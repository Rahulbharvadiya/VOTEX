"""Task service managing lifecycle, workspace sandboxing, idempotency, and downloads."""

import asyncio
from datetime import datetime, timedelta, timezone
import hashlib
import json
import logging
from pathlib import Path
import shutil
import sqlite3
from typing import List, Optional
import uuid

from fastapi import BackgroundTasks, HTTPException, UploadFile

from votex_api.config import get_settings
from votex_api.models import Task, User
from votex_api.repositories import AuditRepository, IdempotencyRepository, TaskRepository
from votex_api.schemas import TaskDTO, TaskListResponse
from votex_api.services.agent_runner import AgentRunner
from votex_api.services.file_validator import validate_and_save_upload

log = logging.getLogger(__name__)
settings = get_settings()


class TaskService:
    def __init__(self, db: sqlite3.Connection):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.idempotency_repo = IdempotencyRepository(db)
        self.audit_repo = AuditRepository(db)

    async def create_task(
        self,
        user: User,
        prompt: str,
        files: List[UploadFile],
        max_steps: int = 30,
        max_cost_inr: float = 20.0,
        max_seconds: int = 300,
        idempotency_key: Optional[str] = None,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> TaskDTO:
        # 1. Idempotency check
        if idempotency_key:
            key_hash = hashlib.sha256(idempotency_key.encode("utf-8")).hexdigest()
            cached = self.idempotency_repo.get(key_hash, user.id)
            if cached:
                cached_data = json.loads(cached.response_json)
                return TaskDTO.model_validate(cached_data)

        # 2. Check user's concurrent active tasks limit (max 2 active)
        cur = self.db.cursor()
        cur.execute(
            "SELECT COUNT(*) as cnt FROM tasks WHERE user_id = ? AND status IN ('queued', 'running')",
            (user.id,),
        )
        active_count = cur.fetchone()["cnt"]
        if active_count >= 2:
            raise HTTPException(
                status_code=429,
                detail="Active task limit reached. Please wait for an existing task to finish.",
            )

        # 3. Create sandboxed workspace folder
        task_id = str(uuid.uuid4())
        workspace_rel = f"{user.id}/{task_id}"
        workspace_abs = Path(settings.WORKSPACES_DIR) / workspace_rel
        inputs_dir = workspace_abs / "inputs"
        outputs_dir = workspace_abs / "outputs"
        inputs_dir.mkdir(parents=True, exist_ok=True)
        outputs_dir.mkdir(parents=True, exist_ok=True)

        # 4. Create Task DB record
        self.task_repo.create_task(
            task_id=task_id,
            user_id=user.id,
            prompt=prompt,
            workspace_rel_path=workspace_rel,
            max_steps=max_steps,
            max_cost_inr=max_cost_inr,
            max_seconds=max_seconds,
        )

        # 5. Validate and save uploaded files
        total_upload_bytes = 0
        max_total_bytes = settings.MAX_TOTAL_UPLOAD_MB * 1024 * 1024

        if files:
            if len(files) > settings.MAX_UPLOAD_FILES:
                raise HTTPException(
                    status_code=422,
                    detail=f"Exceeded maximum file upload limit of {settings.MAX_UPLOAD_FILES} files",
                )

            for upload_file in files:
                if not upload_file.filename:
                    continue
                orig_name, stored_name, mime_type, size_bytes, sha256 = await validate_and_save_upload(
                    upload_file, inputs_dir
                )
                total_upload_bytes += size_bytes
                if total_upload_bytes > max_total_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Total upload size exceeds {settings.MAX_TOTAL_UPLOAD_MB} MB limit",
                    )
                self.task_repo.add_file(
                    task_id=task_id,
                    original_name=orig_name,
                    stored_name=stored_name,
                    mime_type=mime_type,
                    size_bytes=size_bytes,
                    sha256=sha256,
                )

        self.db.commit()

        # Reload full task
        full_task = self.task_repo.get_by_id(task_id, user_id=user.id)
        dto = TaskDTO.model_validate(full_task)

        # 6. Cache idempotency key for 24 hours
        if idempotency_key:
            expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
            self.idempotency_repo.store(
                key_hash=hashlib.sha256(idempotency_key.encode("utf-8")).hexdigest(),
                user_id=user.id,
                task_id=task_id,
                response_json=dto.model_dump_json(),
                expires_at=expires_at,
            )
            self.db.commit()

        # 7. Schedule background execution
        if background_tasks:
            background_tasks.add_task(AgentRunner.execute_task, task_id)
        else:
            asyncio.create_task(AgentRunner.execute_task(task_id))

        return dto

    def get_task(self, task_id: str, user: User) -> TaskDTO:
        task = self.task_repo.get_by_id(task_id, user_id=user.id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        dto = TaskDTO.model_validate(task)

        # If completed, check for markdown report
        workspace_abs = Path(settings.WORKSPACES_DIR) / task.workspace_rel_path / "outputs"
        md_path = workspace_abs / "result.md"
        if not md_path.exists():
            md_path = workspace_abs / "report.md"
        if md_path.exists():
            dto.report_markdown = md_path.read_text(encoding="utf-8", errors="replace")

        return dto

    def list_tasks(
        self,
        user: User,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
    ) -> TaskListResponse:
        tasks, total = self.task_repo.list_user_tasks(
            user_id=user.id,
            page=page,
            page_size=page_size,
            status=status,
        )
        return TaskListResponse(
            tasks=[TaskDTO.model_validate(t) for t in tasks],
            total=total,
            page=page,
            page_size=page_size,
        )

    def delete_task(self, task_id: str, user: User) -> None:
        task = self.task_repo.get_by_id(task_id, user_id=user.id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if task.status == "running":
            raise HTTPException(status_code=409, detail="Cannot delete an actively running task")

        # Safely remove workspace files from disk
        workspace_abs = Path(settings.WORKSPACES_DIR) / task.workspace_rel_path
        if workspace_abs.exists() and workspace_abs.is_dir():
            try:
                shutil.rmtree(workspace_abs)
            except Exception as e:
                log.warning("Could not delete workspace dir %s: %s", workspace_abs, e)

        # Delete from DB
        self.task_repo.delete_task(task_id)
        self.audit_repo.log(
            action="task.delete",
            outcome="success",
            user_id=user.id,
            target_id=task_id,
        )
        self.db.commit()
