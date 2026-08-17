from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import Role, User
from app.repositories import user_repo
from app.schemas.user import UserCreate, UserUpdate
from app.services import audit_service
from app.utils.dates import today


def create_user(db: Session, actor: User, data: UserCreate, ip: str | None) -> User:
    if user_repo.get_by_email(db, data.email) is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    department = None
    if data.department_id is not None:
        department = user_repo.get_department(db, data.department_id)
        if department is None:
            raise HTTPException(status_code=404, detail="Department not found")

    user = User(
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        department_id=data.department_id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    user_repo.init_balances_for_user(db, user, today().year, active_types(db))

    audit_service.log(
        db, actor, None, "user.create", "user", user.id,
        {"email": user.email, "role": user.role.value, "department_id": user.department_id}, ip, "success",
    )
    return user


def update_user(db: Session, actor: User, user_id: int, data: UserUpdate, ip: str | None) -> User:
    user = user_repo.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    changes: dict = {}

    if data.role is not None and data.role != user.role:
        if user.id == actor.id:
            raise HTTPException(status_code=400, detail="You cannot change your own role")
        if user.role == Role.admin and user_repo.count_active_admins(db) <= 1:
            raise HTTPException(status_code=409, detail="Cannot demote the last active administrator")
        changes["role"] = {"old": user.role.value, "new": data.role.value}
        user.role = data.role

    if data.is_active is not None and data.is_active != user.is_active:
        if user.id == actor.id:
            raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
        if not data.is_active and user.role == Role.admin and user_repo.count_active_admins(db) <= 1:
            raise HTTPException(status_code=409, detail="Cannot deactivate the last active administrator")
        changes["is_active"] = {"old": user.is_active, "new": data.is_active}
        user.is_active = data.is_active

    if data.department_id is not None and data.department_id != user.department_id:
        department = user_repo.get_department(db, data.department_id)
        if department is None:
            raise HTTPException(status_code=404, detail="Department not found")
        changes["department_id"] = {"old": user.department_id, "new": data.department_id}
        user.department_id = data.department_id

    if data.full_name is not None and data.full_name != user.full_name:
        changes["full_name"] = "updated"
        user.full_name = data.full_name

    db.commit()
    db.refresh(user)

    audit_service.log(
        db, actor, None, "user.update", "user", user.id, changes if changes else {"info": "no_change"}, ip, "success"
    )
    return user


def reset_password(db: Session, actor: User, user_id: int, new_password: str, ip: str | None) -> User:
    user = user_repo.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    audit_service.log(db, actor, None, "user.password_reset", "user", user.id, None, ip, "success")
    return user


def active_types(db: Session):
    from app.repositories import leave_repo

    return leave_repo.list_types(db, active_only=False)
