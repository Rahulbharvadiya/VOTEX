"""Task request and response DTO schemas."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TaskCreateRequest(BaseModel):
    prompt: str = Field(..., min_length=5, max_length=2000)
    max_steps: int = Field(30, ge=1, le=30)
    max_cost_inr: float = Field(20.0, ge=0.50, le=20.0)
    max_seconds: int = Field(300, ge=15, le=300)


class TaskFileDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    original_name: str
    mime_type: str
    size_bytes: int
    created_at: Optional[str] = None


class TaskStepDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    seq: int
    tool_label: str
    status: str
    summary: str
    cost_inr: float
    duration_ms: int
    cached: bool
    created_at: Optional[str] = None


class TaskArtifactDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    kind: str
    display_name: str
    mime_type: str
    size_bytes: int
    download_url: Optional[str] = None
    created_at: Optional[str] = None


class TaskDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    prompt: str
    status: str
    max_steps: int
    max_cost_inr: float
    max_seconds: int
    steps_used: int
    cost_inr: float
    elapsed_seconds: float
    verification: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    files: List[TaskFileDTO] = []
    steps: List[TaskStepDTO] = []
    artifacts: List[TaskArtifactDTO] = []
    report_markdown: Optional[str] = None


class TaskListResponse(BaseModel):
    tasks: List[TaskDTO]
    total: int
    page: int
    page_size: int
