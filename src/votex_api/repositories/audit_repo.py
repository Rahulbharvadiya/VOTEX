"""Idempotency and Audit repositories using SQLite3."""

from datetime import datetime, timezone
import sqlite3
from typing import Optional

from votex_api.models import IdempotencyKey


class IdempotencyRepository:
    def __init__(self, db: sqlite3.Connection):
        self.db = db

    def get(self, key_hash: str, user_id: str) -> Optional[IdempotencyKey]:
        cur = self.db.cursor()
        cur.execute(
            "SELECT * FROM idempotency_keys WHERE key_hash = ? AND user_id = ?",
            (key_hash, user_id),
        )
        row = cur.fetchone()
        if not row:
            return None
        expires_at = datetime.fromisoformat(row["expires_at"])
        if expires_at < datetime.now(timezone.utc):
            return None
        return IdempotencyKey(
            key_hash=row["key_hash"],
            user_id=row["user_id"],
            task_id=row["task_id"],
            response_json=row["response_json"],
            expires_at=row["expires_at"],
        )

    def store(
        self,
        key_hash: str,
        user_id: str,
        task_id: str,
        response_json: str,
        expires_at: datetime,
    ) -> IdempotencyKey:
        exp_iso = expires_at.isoformat()
        cur = self.db.cursor()
        cur.execute(
            """INSERT OR REPLACE INTO idempotency_keys (key_hash, user_id, task_id, response_json, expires_at)
               VALUES (?, ?, ?, ?, ?)""",
            (key_hash, user_id, task_id, response_json, exp_iso),
        )
        return IdempotencyKey(
            key_hash=key_hash,
            user_id=user_id,
            task_id=task_id,
            response_json=response_json,
            expires_at=exp_iso,
        )


class AuditRepository:
    def __init__(self, db: sqlite3.Connection):
        self.db = db

    def log(
        self,
        action: str,
        outcome: str,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
        target_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        meta_json: Optional[str] = None,
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        cur = self.db.cursor()
        cur.execute(
            """INSERT INTO audit_logs (request_id, user_id, action, target_id, ip_address, outcome, meta_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (request_id, user_id, action, target_id, ip_address, outcome, meta_json, now),
        )
