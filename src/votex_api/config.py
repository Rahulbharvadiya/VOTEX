"""Configuration settings for VOTEX API."""

import json
from functools import lru_cache
from typing import Any, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core Environment
    APP_ENV: str = "dev"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    CORS_ORIGINS: Any = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return v

    # Security & Tokens
    JWT_SECRET_KEY: str = "votex-change-this-in-production-random-secret-key-32chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_SECURE: bool = False  # Set to True in prod behind HTTPS
    COOKIE_SAMESITE: str = "lax"

    # Database & Storage
    DATABASE_URL: str = "sqlite+aiosqlite:///./votex.db"
    WORKSPACES_DIR: str = "./workspaces"

    # Upload & File Limits
    MAX_FILE_SIZE_MB: int = 50
    MAX_TOTAL_UPLOAD_MB: int = 100
    MAX_UPLOAD_FILES: int = 5

    # Agent Limits
    MAX_STEPS_CAP: int = 30
    MAX_COST_INR_CAP: float = 20.0
    MAX_SECONDS_CAP: int = 300
    MAX_CONCURRENT_TASKS: int = 4

    # Rate Limiting
    RATE_LIMIT_LOGIN_PER_MIN: int = 5
    RATE_LIMIT_TASKS_PER_HOUR: int = 10

    # Pilot Controls
    PILOT_INVITE_ONLY: bool = False
    NEW_TASKS_ENABLED: bool = True
    ADMIN_KEY: str = "admin-secret-key"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
