"""Task, File, Step, and Artifact repositories using SQLite3."""

from datetime import datetime, timezone
import sqlite3
from typing import List, Optional, Tuple
import uuid

from votex_api.models import Task, TaskArtifact, TaskFile, TaskStep


class TaskRepository:
    def __init__(self, db: sqlite3.Connection):
        self.db = db

    def create_task(
        self,
        task_id: str,
        user_id: str,
        prompt: str,
        workspace_rel_path: str,
        max_steps: int = 30,
        max_cost_inr: float = 20.0,
        max_seconds: int = 300,
    ) -> Task:
        now = datetime.now(timezone.utc).isoformat()
        cur = self.db.cursor()
        cur.execute(
            """INSERT INTO tasks (
                id, user_id, prompt, workspace_rel_path, status,
                max_steps, max_cost_inr, max_seconds, steps_used, cost_inr,
                elapsed_seconds, created_at
            ) VALUES (?, ?, ?, ?, 'queued', ?, ?, ?, 0, 0.0, 0.0, ?)""",
            (task_id, user_id, prompt, workspace_rel_path, max_steps, max_cost_inr, max_seconds, now),
        )
        return Task(
            id=task_id,
            user_id=user_id,
            prompt=prompt,
            workspace_rel_path=workspace_rel_path,
            status="queued",
            max_steps=max_steps,
            max_cost_inr=max_cost_inr,
            max_seconds=max_seconds,
            steps_used=0,
            cost_inr=0.0,
            elapsed_seconds=0.0,
            created_at=now,
        )

    def get_by_id(self, task_id: str, user_id: Optional[str] = None) -> Optional[Task]:
        cur = self.db.cursor()
        if user_id:
            cur.execute("SELECT * FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id))
        else:
            cur.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cur.fetchone()
        if not row:
            return None

        # Fetch files
        cur.execute("SELECT * FROM task_files WHERE task_id = ? ORDER BY created_at ASC", (task_id,))
        file_rows = cur.fetchall()
        files = [
            TaskFile(
                id=f["id"],
                task_id=f["task_id"],
                original_name=f["original_name"],
                stored_name=f["stored_name"],
                mime_type=f["mime_type"],
                size_bytes=int(f["size_bytes"]),
                sha256=f["sha256"],
                created_at=f["created_at"],
            )
            for f in file_rows
        ]

        # Fetch steps
        cur.execute("SELECT * FROM task_steps WHERE task_id = ? ORDER BY seq ASC", (task_id,))
        step_rows = cur.fetchall()
        steps = [
            TaskStep(
                id=s["id"],
                task_id=s["task_id"],
                seq=int(s["seq"]),
                tool_label=s["tool_label"],
                status=s["status"],
                summary=s["summary"],
                cost_inr=float(s["cost_inr"]),
                duration_ms=int(s["duration_ms"]),
                cached=bool(s["cached"]),
                created_at=s["created_at"],
            )
            for s in step_rows
        ]

        # Fetch artifacts
        cur.execute("SELECT * FROM task_artifacts WHERE task_id = ? ORDER BY created_at ASC", (task_id,))
        art_rows = cur.fetchall()
        artifacts = [
            TaskArtifact(
                id=a["id"],
                task_id=a["task_id"],
                kind=a["kind"],
                display_name=a["display_name"],
                rel_path=a["rel_path"],
                mime_type=a["mime_type"],
                size_bytes=int(a["size_bytes"]),
                created_at=a["created_at"],
            )
            for a in art_rows
        ]

        return Task(
            id=row["id"],
            user_id=row["user_id"],
            prompt=row["prompt"],
            workspace_rel_path=row["workspace_rel_path"],
            status=row["status"],
            max_steps=int(row["max_steps"]),
            max_cost_inr=float(row["max_cost_inr"]),
            max_seconds=int(row["max_seconds"]),
            steps_used=int(row["steps_used"]),
            cost_inr=float(row["cost_inr"]),
            elapsed_seconds=float(row["elapsed_seconds"]),
            verification_json=row["verification_json"],
            error_message=row["error_message"],
            started_at=row["started_at"],
            finished_at=row["finished_at"],
            created_at=row["created_at"],
            files=files,
            steps=steps,
            artifacts=artifacts,
        )

    def list_user_tasks(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
    ) -> Tuple[List[Task], int]:
        cur = self.db.cursor()
        count_sql = "SELECT COUNT(*) as cnt FROM tasks WHERE user_id = ?"
        params: list = [user_id]
        if status:
            count_sql += " AND status = ?"
            params.append(status)
        cur.execute(count_sql, params)
        total = cur.fetchone()["cnt"]

        query_sql = "SELECT * FROM tasks WHERE user_id = ?"
        q_params: list = [user_id]
        if status:
            query_sql += " AND status = ?"
            q_params.append(status)
        query_sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        q_params.extend([page_size, (page - 1) * page_size])

        cur.execute(query_sql, q_params)
        rows = cur.fetchall()

        tasks = []
        for r in rows:
            tasks.append(
                Task(
                    id=r["id"],
                    user_id=r["user_id"],
                    prompt=r["prompt"],
                    workspace_rel_path=r["workspace_rel_path"],
                    status=r["status"],
                    max_steps=int(r["max_steps"]),
                    max_cost_inr=float(r["max_cost_inr"]),
                    max_seconds=int(r["max_seconds"]),
                    steps_used=int(r["steps_used"]),
                    cost_inr=float(r["cost_inr"]),
                    elapsed_seconds=float(r["elapsed_seconds"]),
                    verification_json=r["verification_json"],
                    error_message=r["error_message"],
                    started_at=r["started_at"],
                    finished_at=r["finished_at"],
                    created_at=r["created_at"],
                )
            )
        return tasks, total

    def update_status(
        self,
        task_id: str,
        status: str,
        steps_used: Optional[int] = None,
        cost_inr: Optional[float] = None,
        elapsed_seconds: Optional[float] = None,
        verification_json: Optional[str] = None,
        error_message: Optional[str] = None,
    ) -> None:
        updates = ["status = ?"]
        params: list = [status]

        if steps_used is not None:
            updates.append("steps_used = ?")
            params.append(steps_used)
        if cost_inr is not None:
            updates.append("cost_inr = ?")
            params.append(cost_inr)
        if elapsed_seconds is not None:
            updates.append("elapsed_seconds = ?")
            params.append(elapsed_seconds)
        if verification_json is not None:
            updates.append("verification_json = ?")
            params.append(verification_json)
        if error_message is not None:
            updates.append("error_message = ?")
            params.append(error_message)

        now = datetime.now(timezone.utc).isoformat()
        if status in ("completed", "halted_budget", "failed", "cancelled"):
            updates.append("finished_at = ?")
            params.append(now)
        elif status == "running":
            updates.append("started_at = COALESCE(started_at, ?)")
            params.append(now)

        params.append(task_id)
        sql = f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?"
        cur = self.db.cursor()
        cur.execute(sql, params)

    def add_file(
        self,
        task_id: str,
        original_name: str,
        stored_name: str,
        mime_type: str,
        size_bytes: int,
        sha256: str,
    ) -> TaskFile:
        file_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        cur = self.db.cursor()
        cur.execute(
            """INSERT INTO task_files (id, task_id, original_name, stored_name, mime_type, size_bytes, sha256, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (file_id, task_id, original_name, stored_name, mime_type, size_bytes, sha256, now),
        )
        return TaskFile(
            id=file_id,
            task_id=task_id,
            original_name=original_name,
            stored_name=stored_name,
            mime_type=mime_type,
            size_bytes=size_bytes,
            sha256=sha256,
            created_at=now,
        )

    def add_step(
        self,
        task_id: str,
        seq: int,
        tool_label: str,
        status: str,
        summary: str,
        cost_inr: float = 0.0,
        duration_ms: int = 0,
        cached: bool = False,
    ) -> TaskStep:
        now = datetime.now(timezone.utc).isoformat()
        cur = self.db.cursor()
        cur.execute(
            """INSERT OR REPLACE INTO task_steps (
                task_id, seq, tool_label, status, summary, cost_inr, duration_ms, cached, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (task_id, seq, tool_label, status, summary, cost_inr, duration_ms, 1 if cached else 0, now),
        )
        return TaskStep(
            id=cur.lastrowid or seq,
            task_id=task_id,
            seq=seq,
            tool_label=tool_label,
            status=status,
            summary=summary,
            cost_inr=cost_inr,
            duration_ms=duration_ms,
            cached=cached,
            created_at=now,
        )

    def add_artifact(
        self,
        task_id: str,
        kind: str,
        display_name: str,
        rel_path: str,
        mime_type: str,
        size_bytes: int,
    ) -> TaskArtifact:
        art_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        cur = self.db.cursor()
        cur.execute(
            """INSERT INTO task_artifacts (id, task_id, kind, display_name, rel_path, mime_type, size_bytes, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (art_id, task_id, kind, display_name, rel_path, mime_type, size_bytes, now),
        )
        return TaskArtifact(
            id=art_id,
            task_id=task_id,
            kind=kind,
            display_name=display_name,
            rel_path=rel_path,
            mime_type=mime_type,
            size_bytes=size_bytes,
            created_at=now,
        )

    def get_artifact(self, artifact_id: str) -> Optional[TaskArtifact]:
        cur = self.db.cursor()
        cur.execute("SELECT * FROM task_artifacts WHERE id = ?", (artifact_id,))
        row = cur.fetchone()
        if not row:
            return None
        return TaskArtifact(
            id=row["id"],
            task_id=row["task_id"],
            kind=row["kind"],
            display_name=row["display_name"],
            rel_path=row["rel_path"],
            mime_type=row["mime_type"],
            size_bytes=int(row["size_bytes"]),
            created_at=row["created_at"],
        )

    def delete_task(self, task_id: str) -> None:
        cur = self.db.cursor()
        cur.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
