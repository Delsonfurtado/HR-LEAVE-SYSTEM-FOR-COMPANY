import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_revoked_jtis: set[str] = set()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(subject: int, expires_delta: timedelta, token_type: str) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user_id: int) -> str:
    minutes = get_settings().ACCESS_TOKEN_EXPIRE_MINUTES
    return _create_token(user_id, timedelta(minutes=minutes), "access")


def create_refresh_token(user_id: int) -> str:
    days = get_settings().REFRESH_TOKEN_EXPIRE_DAYS
    return _create_token(user_id, timedelta(days=days), "refresh")


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("jti") in _revoked_jtis:
        raise jwt.InvalidTokenError("Token has been revoked")
    return payload


def revoke_token(jti: str | None) -> None:
    if jti:
        _revoked_jtis.add(jti)
