"""Authentication routes."""

import sqlite3
from typing import Optional
from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Response

from votex_api.config import get_settings
from votex_api.db import get_db
from votex_api.dependencies import get_auth_service, get_current_user, get_user_repo, verify_csrf
from votex_api.models import User
from votex_api.repositories import UserRepository
from votex_api.schemas import (
    TokenResponseDTO,
    UserLoginRequest,
    UserPublicDTO,
    UserRegisterRequest,
)
from votex_api.services import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=TokenResponseDTO)
def register(
    req: UserRegisterRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
    user_repo: UserRepository = Depends(get_user_repo),
    db: sqlite3.Connection = Depends(get_db),
    _csrf: None = Depends(verify_csrf),
):
    if settings.PILOT_INVITE_ONLY:
        if not req.invite_code:
            raise HTTPException(status_code=403, detail="Registration requires a valid pilot invite code")

    existing = user_repo.get_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Unable to complete registration with this email")

    password_hash = auth_service.hash_password(req.password)
    user = user_repo.create(email=req.email, password_hash=password_hash, role="user")
    access_token, refresh_token, csrf_token = auth_service.create_session(user)
    db.commit()

    auth_service.set_auth_cookies(response, access_token, refresh_token, csrf_token)

    return TokenResponseDTO(
        access_token=access_token,
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserPublicDTO.model_validate(user),
    )


@router.post("/login", response_model=TokenResponseDTO)
def login(
    req: UserLoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
    db: sqlite3.Connection = Depends(get_db),
    _csrf: None = Depends(verify_csrf),
):
    user = auth_service.authenticate(req.email, req.password)
    access_token, refresh_token, csrf_token = auth_service.create_session(user)
    db.commit()

    auth_service.set_auth_cookies(response, access_token, refresh_token, csrf_token)

    return TokenResponseDTO(
        access_token=access_token,
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserPublicDTO.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponseDTO)
def refresh_tokens(
    response: Response,
    votex_refresh_token: Optional[str] = Cookie(None),
    auth_service: AuthService = Depends(get_auth_service),
    db: sqlite3.Connection = Depends(get_db),
    _csrf: None = Depends(verify_csrf),
):
    if not votex_refresh_token:
        raise HTTPException(status_code=401, detail="Refresh session cookie missing")

    access_token, new_refresh, csrf_token, user = auth_service.rotate_refresh(votex_refresh_token)
    db.commit()

    auth_service.set_auth_cookies(response, access_token, new_refresh, csrf_token)

    return TokenResponseDTO(
        access_token=access_token,
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserPublicDTO.model_validate(user),
    )


@router.post("/logout", status_code=204)
def logout(
    response: Response,
    votex_refresh_token: Optional[str] = Cookie(None),
    auth_service: AuthService = Depends(get_auth_service),
    db: sqlite3.Connection = Depends(get_db),
    _csrf: None = Depends(verify_csrf),
):
    if votex_refresh_token:
        auth_service.revoke_session(votex_refresh_token)
        db.commit()

    auth_service.clear_auth_cookies(response)
    return Response(status_code=204)


@router.get("/me", response_model=UserPublicDTO)
def get_current_user_profile(user: User = Depends(get_current_user)):
    return UserPublicDTO.model_validate(user)
