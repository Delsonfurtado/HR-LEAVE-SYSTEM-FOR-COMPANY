from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.leave import LeaveBalance
from app.models.user import Department, Role, User


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def list_users(db: Session, role: Role | None = None, active: bool | None = None) -> list[User]:
    query = select(User).order_by(User.id)
    if role is not None:
        query = query.where(User.role == role)
    if active is not None:
        query = query.where(User.is_active == active)
    return list(db.scalars(query))


def list_by_department(db: Session, department_id: int) -> list[User]:
    return list(db.scalars(select(User).where(User.department_id == department_id).order_by(User.id)))


def count_active_admins(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User).where(User.role == Role.admin, User.is_active == True)) or 0


def count_users(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User)) or 0


def list_departments(db: Session) -> list[Department]:
    return list(db.scalars(select(Department).order_by(Department.name)))


def get_department(db: Session, department_id: int) -> Department | None:
    return db.get(Department, department_id)


def init_balances_for_user(db: Session, user: User, year: int, types: list) -> None:
    for leave_type in types:
        exists = db.scalar(
            select(LeaveBalance).where(
                LeaveBalance.employee_id == user.id,
                LeaveBalance.leave_type_id == leave_type.id,
                LeaveBalance.year == year,
            )
        )
        if exists is None:
            db.add(
                LeaveBalance(
                    employee_id=user.id,
                    leave_type_id=leave_type.id,
                    year=year,
                    total_days=leave_type.default_days,
                    used_days=0,
                )
            )
    db.commit()
