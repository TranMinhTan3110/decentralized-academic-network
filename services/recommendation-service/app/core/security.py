import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID

import jwt
from fastapi import Depends, Header
from pydantic import BaseModel, ConfigDict

from app.core.config import settings
from app.exceptions.app_exceptions import UnauthorizedException, ForbiddenException

class CurrentUser(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    email: str
    role: str

def create_access_token(
    user_id: str,
    email: str,
    role: str = "ROLE_STUDENT",
    expires_delta: Optional[timedelta] = None
) -> str:
    """Helper to generate JWT token for testing and verification"""
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=24))
    payload = {
        "sub": email,
        "userId": str(user_id),
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify JWT signature using shared secret key"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại")
    except jwt.PyJWTError:
        raise UnauthorizedException("Token xác thực không hợp lệ hoặc chữ ký sai")


def get_current_user(authorization: Optional[str] = Header(None)) -> CurrentUser:
    """FastAPI Dependency: Extract and validate Bearer Token, returning CurrentUser"""
    if not authorization:
        raise UnauthorizedException("Yêu cầu cần có Header Authorization Bearer Token")

    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Định dạng Header Authorization không đúng. Cần dạng 'Bearer <token>'")

    token = parts[1]
    payload = decode_token(token)

    user_id_str = payload.get("userId") or payload.get("user_id") or payload.get("id")
    email = payload.get("email") or payload.get("sub")
    role = payload.get("role", "ROLE_STUDENT")

    if not user_id_str or not email:
        raise UnauthorizedException("Payload Token không chứa thông tin định danh người dùng hợp lệ")

    try:
        user_uuid = UUID(str(user_id_str))
    except (ValueError, TypeError):
        raise UnauthorizedException("Định dạng User ID trong Token không phải là UUID hợp lệ")

    return CurrentUser(id=user_uuid, email=email, role=role)


def get_optional_current_user(authorization: Optional[str] = Header(None)) -> Optional[CurrentUser]:
    """FastAPI Dependency: Returns CurrentUser if token present, or None if guest"""
    if not authorization:
        return None
    return get_current_user(authorization)


def require_role(*allowed_roles: str):
    """Dependency factory to enforce role-based access control"""
    def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(
                f"Quyền '{current_user.role}' không được phép truy cập tài nguyên này. Yêu cầu: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
