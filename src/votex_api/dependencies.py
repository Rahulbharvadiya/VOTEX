"""FastAPI dependency injection providers: auth, services, and CSRF protection."""

import sqlite3
from typing import Optional
from fastapi import Cookie, Depends, Header, HTTPException, Request

from votex_api.config import get_settings
from votex_api.db import get_db
from votex_api.models import User
from votex_api.repositories import UserRepository, TokenRepository, TaskRepository
from votex_api.services import AuthService, TaskService

settings = get_settings()


def get_user_repo(db: sqlite3.Connection = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_token_repo(db: sqlite3.Connection = Depends(get_db)) -> TokenRepository:
    return TokenRepository(db)


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repo),
    token_repo: TokenRepository = Depends(get_token_repo),
) -> AuthService:
    return AuthService(user_repo, token_repo)


def get_task_service(db: sqlite3.Connection = Depends(get_db)) -> TaskService:
    return TaskService(db)


def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    votex_access_token: Optional[str] = Cookie(None),
    auth_service: AuthService = Depends(get_auth_service),
    user_repo: UserRepository = Depends(get_user_repo),
) -> User:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    elif votex_access_token:
        token = votex_access_token

    if not token:
        raise HTTPException(status_code=401, detail="Authentication credentials required")

    payload = auth_service.decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")

    user_id = payload["sub"]
    user = user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account disabled or deleted")

    return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


def verify_csrf(
    request: Request,
    x_csrf_token: Optional[str] = Header(None),
    votex_csrf_token: Optional[str] = Cookie(None),
) -> None:
    """Verifies double-submit CSRF cookie against header for state-changing requests."""
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    origin = request.headers.get("origin")
    if origin and origin not in settings.CORS_ORIGINS and origin != settings.FRONTEND_ORIGIN:
        raise HTTPException(status_code=403, detail="Forbidden cross-origin request")

    if votex_csrf_token:
        if not x_csrf_token or x_csrf_token != votex_csrf_token:
            raise HTTPException(status_code=403, detail="CSRF token validation failed")
