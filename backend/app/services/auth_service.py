import time

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, verify_password
from app.repositories import user_repo
from app.services import audit_service
from app.utils.dates import utcnow

_login_attempts: dict[str, list[float]] = {}


def _rate_limited(key: str, limit: int) -> bool:
    now = time.time()
    window = [t for t in _login_attempts.get(key, []) if now - t < 60]
    _login_attempts[key] = window
    return len(window) >= limit


def _record_attempt(key: str) -> None:
    _login_attempts.setdefault(key, []).append(time.time())


def login(db: Session, email: str, password: str, ip: str | None) -> dict:
    settings = get_settings()
    normalized = email.lower()
    key = f"{ip or 'unknown'}:{normalized}"

    if _rate_limited(key, settings.LOGIN_RATE_LIMIT):
        audit_service.log(db, None, normalized, "auth.login", "user", None, {"reason": "rate_limited"}, ip, "denied")
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")

    user = user_repo.get_by_email(db, normalized)
    invalid = HTTPException(status_code=401, detail="Invalid email or password")

    if user is None:
        _record_attempt(key)
        audit_service.log(db, None, normalized, "auth.login", "user", None, {"reason": "unknown_user"}, ip, "denied")
        raise invalid

    now = utcnow()
    if user.locked_until is not None and user.locked_until > now:
        audit_service.log(db, user, None, "auth.login", "user", user.id, {"reason": "account_locked"}, ip, "denied")
        raise HTTPException(status_code=423, detail="Account temporarily locked. Try again later.")

    if not verify_password(password, user.hashed_password):
        _record_attempt(key)
        user.failed_login_attempts += 1
        attempts = user.failed_login_attempts
        if attempts >= settings.MAX_FAILED_LOGINS:
            from datetime import timedelta

            user.locked_until = now + timedelta(minutes=settings.LOCKOUT_MINUTES)
            user.failed_login_attempts = 0
        db.commit()
        audit_service.log(
            db, user, None, "auth.login", "user", user.id, {"reason": "bad_password", "attempts": attempts}, ip, "denied"
        )
        raise invalid

    if not user.is_active:
        audit_service.log(db, user, None, "auth.login", "user", user.id, {"reason": "account_disabled"}, ip, "denied")
        raise HTTPException(status_code=403, detail="Account disabled. Contact your administrator.")

    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    audit_service.log(db, user, None, "auth.login", "user", user.id, None, ip, "success")
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }
