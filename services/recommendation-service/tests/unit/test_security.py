import uuid
from datetime import timedelta
import pytest
from app.core.security import (
    create_access_token,
    decode_token,
    get_current_user,
    get_optional_current_user,
    require_role,
    CurrentUser
)
from app.exceptions.app_exceptions import UnauthorizedException, ForbiddenException

def test_create_and_decode_token():
    user_id = str(uuid.uuid4())
    token = create_access_token(user_id=user_id, email="user@academic.edu.vn", role="ROLE_STUDENT")
    payload = decode_token(token)

    assert payload["userId"] == user_id
    assert payload["email"] == "user@academic.edu.vn"
    assert payload["role"] == "ROLE_STUDENT"

def test_decode_expired_token():
    user_id = str(uuid.uuid4())
    expired_token = create_access_token(
        user_id=user_id,
        email="user@academic.edu.vn",
        expires_delta=timedelta(seconds=-10)
    )
    with pytest.raises(UnauthorizedException) as exc:
        decode_token(expired_token)
    assert "hết hạn" in str(exc.value.message)

def test_decode_invalid_signature():
    fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M"
    with pytest.raises(UnauthorizedException) as exc:
        decode_token(fake_token)
    assert "không hợp lệ" in str(exc.value.message)

def test_get_current_user_success():
    user_id = str(uuid.uuid4())
    token = create_access_token(user_id=user_id, email="student@academic.edu.vn", role="ROLE_STUDENT")
    user = get_current_user(f"Bearer {token}")

    assert isinstance(user, CurrentUser)
    assert str(user.id) == user_id
    assert user.email == "student@academic.edu.vn"
    assert user.role == "ROLE_STUDENT"

def test_get_current_user_missing_header():
    with pytest.raises(UnauthorizedException) as exc:
        get_current_user(None)
    assert "Yêu cầu cần có Header Authorization" in str(exc.value.message)

def test_get_current_user_invalid_format():
    with pytest.raises(UnauthorizedException) as exc:
        get_current_user("TokenNotBearer xyz123")
    assert "Bearer" in str(exc.value.message)

def test_get_optional_current_user():
    assert get_optional_current_user(None) is None

    user_id = str(uuid.uuid4())
    token = create_access_token(user_id=user_id, email="guest@academic.edu.vn")
    user = get_optional_current_user(f"Bearer {token}")
    assert user is not None
    assert user.email == "guest@academic.edu.vn"

def test_require_role():
    user = CurrentUser(id=uuid.uuid4(), email="admin@academic.edu.vn", role="ROLE_ADMIN")
    checker = require_role("ROLE_ADMIN", "ROLE_MODERATOR")
    # Should succeed for ROLE_ADMIN
    checked_user = checker(user)
    assert checked_user == user

    # Should raise ForbiddenException for student
    student_user = CurrentUser(id=uuid.uuid4(), email="student@academic.edu.vn", role="ROLE_STUDENT")
    with pytest.raises(ForbiddenException):
        checker(student_user)
