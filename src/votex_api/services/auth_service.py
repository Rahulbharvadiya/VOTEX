"""Authentication service: Argon2 hashing, JWT sessions, refresh rotation, and cookie helpers."""

from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import Optional, Tuple
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import jwt
from fastapi import HTTPException, Response
from votex_api.config import get_settings
from votex_api.models import User, RefreshToken
from votex_api.repositories import UserRepository, TokenRepository

settings = get_settings()
ph = PasswordHasher()

# Dummy hash for timing-attack mitigation
DUMMY_HASH = ph.hash("votex-dummy-timing-protection-password")


def hash_token(raw_token: str) -> str:
    """Return SHA-256 hex digest of a raw token."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, user_repo: UserRepository, token_repo: TokenRepository):
        self.user_repo = user_repo
        self.token_repo = token_repo

    def hash_password(self, password: str) -> str:
        return ph.hash(password)

    def verify_password(self, password: str, password_hash: str) -> bool:
        try:
            return ph.verify(password_hash, password)
        except VerifyMismatchError:
            return False

    def create_access_token(self, user: User) -> str:
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "iat": int(now.timestamp()),
            "exp": int(expire.timestamp()),
            "iss": "votex",
            "aud": "votex-web",
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    def decode_access_token(self, token_str: str) -> Optional[dict]:
        try:
            return jwt.decode(
                token_str,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                audience="votex-web",
                issuer="votex",
            )
        except (jwt.PyJWTError, Exception):
            return None

    def authenticate(self, email: str, password: str) -> User:
        user = self.user_repo.get_by_email(email)
        if not user:
            # Run dummy verification to keep response time constant
            self.verify_password(password, DUMMY_HASH)
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not self.verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is disabled")

        return user

    def create_session(self, user: User) -> Tuple[str, str, str]:
        """Creates access token, raw refresh token, and CSRF token."""
        access_token = self.create_access_token(user)
        raw_refresh = secrets.token_urlsafe(32)
        csrf_token = secrets.token_hex(16)
        token_hash = hash_token(raw_refresh)
        family_id = secrets.token_hex(16)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        self.token_repo.create_refresh_token(
            user_id=user.id,
            token_hash=token_hash,
            family_id=family_id,
            expires_at=expires_at,
        )
        return access_token, raw_refresh, csrf_token

    def rotate_refresh(self, raw_refresh: str) -> Tuple[str, str, str, User]:
        """Rotates refresh token. Revokes family if a previously revoked token is reused."""
        token_hash = hash_token(raw_refresh)
        record = self.token_repo.get_refresh_token(token_hash)
        if not record:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        # Reuse detection: if this token was already revoked, revoke its entire family!
        if record.revoked_at is not None:
            self.token_repo.revoke_family(record.family_id)
            raise HTTPException(
                status_code=401,
                detail="Security alert: Session reuse detected. All sessions in this family have been terminated.",
            )

        expires_at = datetime.fromisoformat(record.expires_at)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")

        user = self.user_repo.get_by_id(record.user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User account inactive")

        # Revoke the used refresh token
        self.token_repo.revoke_token(record)

        # Issue new pair under the same family_id
        new_raw_refresh = secrets.token_urlsafe(32)
        new_hash = hash_token(new_raw_refresh)
        new_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        self.token_repo.create_refresh_token(
            user_id=user.id,
            token_hash=new_hash,
            family_id=record.family_id,
            expires_at=new_expires_at,
        )

        access_token = self.create_access_token(user)
        csrf_token = secrets.token_hex(16)
        return access_token, new_raw_refresh, csrf_token, user

    def revoke_session(self, raw_refresh: str) -> None:
        if raw_refresh:
            token_hash = hash_token(raw_refresh)
            record = self.token_repo.get_refresh_token(token_hash)
            if record:
                self.token_repo.revoke_token(record)

    def set_auth_cookies(
        self,
        response: Response,
        access_token: str,
        refresh_token: str,
        csrf_token: str,
    ) -> None:
        max_age_access = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        max_age_refresh = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400

        response.set_cookie(
            key="votex_access_token",
            value=access_token,
            max_age=max_age_access,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            path="/",
        )
        response.set_cookie(
            key="votex_refresh_token",
            value=refresh_token,
            max_age=max_age_refresh,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            path="/api/v1/auth",
        )
        response.set_cookie(
            key="votex_csrf_token",
            value=csrf_token,
            max_age=max_age_refresh,
            httponly=False,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            path="/",
        )

    def clear_auth_cookies(self, response: Response) -> None:
        response.delete_cookie("votex_access_token", path="/")
        response.delete_cookie("votex_refresh_token", path="/api/v1/auth")
        response.delete_cookie("votex_csrf_token", path="/")
