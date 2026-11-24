"""User and Token repositories using SQLite3."""

from datetime import datetime, timezone
import sqlite3
from typing import Optional
import uuid

from votex_api.models import RefreshToken, User


class UserRepository:
    def __init__(self, db: sqlite3.Connection):
        self.db = db

    def get_by_id(self, user_id: str) -> Optional[User]:
        cur = self.db.cursor()
        cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        if not row:
            return None
        return User(
            id=row["id"],
            email=row["email"],
            password_hash=row["password_hash"],
            role=row["role"],
            is_active=bool(row["is_active"]),
            daily_budget_inr=float(row["daily_budget_inr"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def get_by_email(self, email: str) -> Optional[User]:
        normalized = email.strip().lower()
        cur = self.db.cursor()
        cur.execute("SELECT * FROM users WHERE email = ?", (normalized,))
        row = cur.fetchone()
        if not row:
            return None
        return User(
            id=row["id"],
            email=row["email"],
            password_hash=row["password_hash"],
            role=row["role"],
            is_active=bool(row["is_active"]),
            daily_budget_inr=float(row["daily_budget_inr"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def create(self, email: str, password_hash: str, role: str = "user") -> User:
        user_id = str(uuid.uuid4())
        normalized = email.strip().lower()
        now = datetime.now(timezone.utc).isoformat()
        cur = self.db.cursor()
        cur.execute(
            """INSERT INTO users (id, email, password_hash, role, is_active, daily_budget_inr, created_at, updated_at)
               VALUES (?, ?, ?, ?, 1, 100.00, ?, ?)""",
            (user_id, normalized, password_hash, role, now, now),
        )
        return User(
            id=user_id,
            email=normalized,
            password_hash=password_hash,
            role=role,
            is_active=True,
            daily_budget_inr=100.00,
            created_at=now,
            updated_at=now,
        )


class TokenRepository:
    def __init__(self, db: sqlite3.Connection):
        self.db = db

    def create_refresh_token(
        self,
        user_id: str,
        token_hash: str,
        family_id: str,
        expires_at: datetime,
    ) -> RefreshToken:
        token_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        exp_iso = expires_at.isoformat()
        cur = self.db.cursor()
        cur.execute(
            """INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (token_id, user_id, token_hash, family_id, exp_iso, now),
        )
        return RefreshToken(
            id=token_id,
            user_id=user_id,
            token_hash=token_hash,
            family_id=family_id,
            expires_at=exp_iso,
            revoked_at=None,
            created_at=now,
        )

    def get_refresh_token(self, token_hash: str) -> Optional[RefreshToken]:
        cur = self.db.cursor()
        cur.execute("SELECT * FROM refresh_tokens WHERE token_hash = ?", (token_hash,))
        row = cur.fetchone()
        if not row:
            return None
        return RefreshToken(
            id=row["id"],
            user_id=row["user_id"],
            token_hash=row["token_hash"],
            family_id=row["family_id"],
            expires_at=row["expires_at"],
            revoked_at=row["revoked_at"],
            created_at=row["created_at"],
        )

    def revoke_token(self, token: RefreshToken) -> None:
        now = datetime.now(timezone.utc).isoformat()
        cur = self.db.cursor()
        cur.execute("UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?", (now, token.id))

    def revoke_family(self, family_id: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        cur = self.db.cursor()
        cur.execute("UPDATE refresh_tokens SET revoked_at = ? WHERE family_id = ?", (now, family_id))
