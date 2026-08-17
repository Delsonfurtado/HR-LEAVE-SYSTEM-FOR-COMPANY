from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.deps import DbSession, client_ip, require_permission
from app.models.user import Role
from app.repositories import user_repo
from app.schemas.user import DepartmentOut, PasswordReset, UserCreate, UserOut, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/admin", tags=["Administrator"])


def _serialize(user) -> UserOut:
    out = UserOut.model_validate(user)
    out.department_name = user.department.name if user.department else None
    return out


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: DbSession,
    role: Role | None = None,
    active: bool | None = None,
    user=Depends(require_permission("users:manage")),
):
    return [_serialize(u) for u in user_repo.list_users(db, role, active)]


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    request: Request,
    db: DbSession,
    user=Depends(require_permission("users:manage")),
):
    created = user_service.create_user(db, user, body, client_ip(request))
    return _serialize(created)


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    body: UserUpdate,
    request: Request,
    db: DbSession,
    user=Depends(require_permission("users:manage")),
):
    updated = user_service.update_user(db, user, user_id, body, client_ip(request))
    return _serialize(updated)


@router.put("/users/{user_id}/password")
def reset_password(
    user_id: int,
    body: PasswordReset,
    request: Request,
    db: DbSession,
    user=Depends(require_permission("users:manage")),
):
    user_service.reset_password(db, user, user_id, body.new_password, client_ip(request))
    return {"detail": "Password updated"}


@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(
    db: DbSession,
    user=Depends(require_permission("users:manage")),
):
    return user_repo.list_departments(db)
