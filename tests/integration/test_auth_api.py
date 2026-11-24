"""Integration tests for authentication APIs, cookies, and session rotation."""

import uuid
from fastapi import HTTPException, Response
import pytest
from votex_api.db import get_connection, init_db
from votex_api.repositories import TokenRepository, UserRepository
from votex_api.routers.auth import login, logout, refresh_tokens, register
from votex_api.schemas import UserLoginRequest, UserRegisterRequest
from votex_api.services import AuthService


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_register_and_login_flow():
    conn = get_connection()
    try:
        user_repo = UserRepository(conn)
        token_repo = TokenRepository(conn)
        auth_service = AuthService(user_repo, token_repo)

        email = f"user_{uuid.uuid4().hex[:8]}@example.test"
        password = "SuperPassword123!"

        # 1. Register
        res_cookies = Response()
        reg_req = UserRegisterRequest(email=email, password=password)
        dto = register(
            req=reg_req,
            response=res_cookies,
            auth_service=auth_service,
            user_repo=user_repo,
            db=conn,
            _csrf=None,
        )
        assert dto.user.email == email
        assert dto.access_token

        # Check cookies set
        cookies_header = res_cookies.headers.getlist("set-cookie")
        assert any("votex_access_token=" in c for c in cookies_header)
        assert any("votex_refresh_token=" in c for c in cookies_header)
        assert any("votex_csrf_token=" in c for c in cookies_header)

        # 2. Login
        login_resp = Response()
        login_req = UserLoginRequest(email=email, password=password)
        login_dto = login(
            req=login_req,
            response=login_resp,
            auth_service=auth_service,
            db=conn,
            _csrf=None,
        )
        assert login_dto.user.email == email

        # 3. Login with bad password -> 401
        bad_req = UserLoginRequest(email=email, password="BadPassword999!")
        with pytest.raises(HTTPException) as exc_info:
            login(
                req=bad_req,
                response=Response(),
                auth_service=auth_service,
                db=conn,
                _csrf=None,
            )
        assert exc_info.value.status_code == 401
        assert "Invalid email or password" in exc_info.value.detail

        # Extract refresh token from login cookie
        refresh_cookie_str = [c for c in login_resp.headers.getlist("set-cookie") if "votex_refresh_token=" in c][0]
        raw_refresh = refresh_cookie_str.split("votex_refresh_token=")[1].split(";")[0]

        # 4. Refresh token rotation
        ref_resp = Response()
        ref_dto = refresh_tokens(
            response=ref_resp,
            votex_refresh_token=raw_refresh,
            auth_service=auth_service,
            db=conn,
            _csrf=None,
        )
        assert ref_dto.access_token
        new_refresh_cookie = [c for c in ref_resp.headers.getlist("set-cookie") if "votex_refresh_token=" in c][0]
        new_raw_refresh = new_refresh_cookie.split("votex_refresh_token=")[1].split(";")[0]
        assert new_raw_refresh != raw_refresh

        # 5. Token reuse detection: reusing old rotated token MUST raise 401 and revoke family
        with pytest.raises(HTTPException) as reuse_exc:
            refresh_tokens(
                response=Response(),
                votex_refresh_token=raw_refresh,
                auth_service=auth_service,
                db=conn,
                _csrf=None,
            )
        assert reuse_exc.value.status_code == 401
        assert "reuse detected" in reuse_exc.value.detail.lower()

        # 6. Logout
        logout_resp = Response()
        res = logout(
            response=logout_resp,
            votex_refresh_token=new_raw_refresh,
            auth_service=auth_service,
            db=conn,
            _csrf=None,
        )
        assert res.status_code == 204
    finally:
        conn.close()
