"""Database connection, schema initialization, and session management using native SQLite WAL."""

from contextlib import contextmanager
from datetime import datetime, timezone
import os
from pathlib import Path
import sqlite3
from typing import Generator
from votex_api.config import get_settings

settings = get_settings()

# Extract database file path from DATABASE_URL
DB_PATH = "./votex.db"
if "sqlite" in settings.DATABASE_URL:
    clean = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    DB_PATH = clean if clean else "./votex.db"


def get_connection() -> sqlite3.Connection:
    """Creates a connection configured with WAL mode and foreign keys enabled."""
    conn = sqlite3.connect(DB_PATH, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.execute("PRAGMA busy_timeout=5000;")
    return conn


@contextmanager
def get_db_context() -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI dependency for database connection."""
    with get_db_context() as conn:
        yield conn


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    daily_budget_inr NUMERIC(8,2) NOT NULL DEFAULT 100.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) UNIQUE NOT NULL,
    family_id CHAR(36) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_family ON refresh_tokens(family_id);

CREATE TABLE IF NOT EXISTS invite_codes (
    code_hash CHAR(64) PRIMARY KEY,
    max_uses INTEGER NOT NULL DEFAULT 1,
    uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count <= max_uses),
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','halted_budget','failed','cancelled')),
    max_steps INTEGER NOT NULL DEFAULT 30 CHECK (max_steps BETWEEN 1 AND 30),
    max_cost_inr NUMERIC(8,2) NOT NULL DEFAULT 20.00 CHECK (max_cost_inr > 0 AND max_cost_inr <= 20.00),
    max_seconds INTEGER NOT NULL DEFAULT 300 CHECK (max_seconds BETWEEN 15 AND 300),
    steps_used INTEGER NOT NULL DEFAULT 0,
    cost_inr NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    elapsed_seconds REAL NOT NULL DEFAULT 0.0,
    verification_json TEXT NULL,
    error_message VARCHAR(500) NULL,
    workspace_rel_path VARCHAR(255) NOT NULL,
    started_at DATETIME NULL,
    finished_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON tasks(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS task_files (
    id CHAR(36) PRIMARY KEY,
    task_id CHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
    sha256 CHAR(64) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_task_files_task ON task_files(task_id);

CREATE TABLE IF NOT EXISTS task_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id CHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    seq INTEGER NOT NULL,
    tool_label VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    cost_inr NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    cached BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (task_id, seq)
);
CREATE INDEX IF NOT EXISTS idx_task_steps_task_seq ON task_steps(task_id, seq);

CREATE TABLE IF NOT EXISTS task_artifacts (
    id CHAR(36) PRIMARY KEY,
    task_id CHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    kind VARCHAR(32) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    rel_path VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_task_artifacts_task ON task_artifacts(task_id);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    key_hash CHAR(64) PRIMARY KEY,
    user_id CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id CHAR(36) NOT NULL,
    response_json TEXT NOT NULL,
    expires_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id VARCHAR(64) NULL,
    user_id CHAR(36) NULL,
    action VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NULL,
    ip_address VARCHAR(45) NULL,
    outcome VARCHAR(16) NOT NULL,
    meta_json TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""


def init_db() -> None:
    """Initialize SQLite database with all 9 Section 9 tables."""
    conn = get_connection()
    try:
        conn.executescript(SCHEMA_SQL)
        conn.commit()
    finally:
        conn.close()
