"""Common API schemas and standard error envelopes."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ErrorDetails(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None


class ErrorEnvelope(BaseModel):
    error: ErrorDetails


class SuccessEnvelope(BaseModel):
    ok: bool = True
    data: Optional[Any] = None


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=50)
