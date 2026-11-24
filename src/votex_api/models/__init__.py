"""Data models for VOTEX entities."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class User:
    id: str
    email: str
    password_hash: str
    role: str = "user"
    is_active: bool = True
    daily_budget_inr: float = 100.00
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@dataclass
class RefreshToken:
    id: str
    user_id: str
    token_hash: str
    family_id: str
    expires_at: str
    revoked_at: Optional[str] = None
    created_at: Optional[str] = None


@dataclass
class TaskFile:
    id: str
    task_id: str
    original_name: str
    stored_name: str
    mime_type: str
    size_bytes: int
    sha256: str
    created_at: Optional[str] = None


@dataclass
class TaskStep:
    id: int
    task_id: str
    seq: int
    tool_label: str
    status: str
    summary: str
    cost_inr: float = 0.0
    duration_ms: int = 0
    cached: bool = False
    created_at: Optional[str] = None


@dataclass
class TaskArtifact:
    id: str
    task_id: str
    kind: str
    display_name: str
    rel_path: str
    mime_type: str
    size_bytes: int
    created_at: Optional[str] = None


@dataclass
class Task:
    id: str
    user_id: str
    prompt: str
    workspace_rel_path: str
    status: str = "queued"
    max_steps: int = 30
    max_cost_inr: float = 20.0
    max_seconds: int = 300
    steps_used: int = 0
    cost_inr: float = 0.0
    elapsed_seconds: float = 0.0
    verification_json: Optional[str] = None
    error_message: Optional[str] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    created_at: Optional[str] = None
    files: List[TaskFile] = field(default_factory=list)
    steps: List[TaskStep] = field(default_factory=list)
    artifacts: List[TaskArtifact] = field(default_factory=list)


@dataclass
class IdempotencyKey:
    key_hash: str
    user_id: str
    task_id: str
    response_json: str
    expires_at: str
