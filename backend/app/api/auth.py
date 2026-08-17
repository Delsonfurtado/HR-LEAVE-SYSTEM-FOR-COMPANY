import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user, get_token_payload
from app.core.security import create_access_token, create_refresh_token, decode_token, revoke_token
from app.db import get_db
from app.models.user import User
from app.repositories import user_repo
from app.schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, TokenPair
from app.schemas.user import UserOut
from app.services import audit_service, auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenPair)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    return auth_service.login(db, body.email, body.password, client_ip(request))


@router.post("/refresh", response_model=TokenPair)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")

    user = user_repo.get_by_id(db, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists or is disabled")

    revoke_token(payload.get("jti"))
    audit_service.log(db, user, None, "auth.refresh", "user", user.id, None, None, "success")
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


@router.post("/logout")
def logout(
    body: LogoutRequest,
    request: Request,
    payload: dict = Depends(get_token_payload),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    revoke_token(payload.get("jti"))
    if body.refresh_token:
        try:
            refresh_payload = decode_token(body.refresh_token)
            revoke_token(refresh_payload.get("jti"))
        except jwt.InvalidTokenError:
            pass
    audit_service.log(db, user, None, "auth.logout", "user", user.id, None, client_ip(request), "success")
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    out = UserOut.model_validate(user)
    out.department_name = user.department.name if user.department else None
    return out
