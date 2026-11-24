"""Authentication request and response DTO schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"


class UserRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(..., pattern=EMAIL_REGEX, max_length=254)
    password: str = Field(..., min_length=10, max_length=128)
    invite_code: Optional[str] = Field(None, min_length=6, max_length=64)


class UserLoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(..., pattern=EMAIL_REGEX, max_length=254)
    password: str = Field(..., min_length=1, max_length=128)


class UserPublicDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: str
    email: str
    role: str
    daily_budget_inr: float
    created_at: str


class TokenResponseDTO(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: UserPublicDTO
