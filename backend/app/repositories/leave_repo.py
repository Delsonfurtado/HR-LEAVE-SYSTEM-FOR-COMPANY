from datetime import date

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.leave import LeaveBalance, LeaveRequest, LeaveType, RequestStatus
from app.models.user import User
from app.utils.dates import overlaps


def get_request(db: Session, request_id: int) -> LeaveRequest | None:
    return db.get(LeaveRequest, request_id)


def list_by_employee(db: Session, employee_id: int) -> list[LeaveRequest]:
    return list(
        db.scalars(
            select(LeaveRequest).where(LeaveRequest.employee_id == employee_id).order_by(LeaveRequest.created_at.desc())
        )
    )


def list_by_department(
    db: Session, department_id: int, status: RequestStatus | None = None
) -> list[LeaveRequest]:
    query = (
        select(LeaveRequest)
        .join(User, LeaveRequest.employee_id == User.id)
        .where(User.department_id == department_id)
        .order_by(LeaveRequest.created_at.desc())
    )
    if status is not None:
        query = query.where(LeaveRequest.status == status)
    return list(db.scalars(query))


def list_for_report(
    db: Session,
    start: date | None = None,
    end: date | None = None,
    department_id: int | None = None,
) -> list[LeaveRequest]:
    query = (
        select(LeaveRequest)
        .join(User, LeaveRequest.employee_id == User.id)
        .order_by(LeaveRequest.created_at.desc())
    )
    if start is not None:
        query = query.where(LeaveRequest.start_date >= start)
    if end is not None:
        query = query.where(LeaveRequest.start_date <= end)
    if department_id is not None:
        query = query.where(User.department_id == department_id)
    return list(db.scalars(query))


def has_overlapping(db: Session, employee_id: int, start: date, end: date) -> bool:
    existing = list(
        db.scalars(
            select(LeaveRequest).where(
                LeaveRequest.employee_id == employee_id,
                LeaveRequest.status.in_([RequestStatus.pending, RequestStatus.approved]),
            )
        )
    )
    return any(overlaps(start, end, req.start_date, req.end_date) for req in existing)


def list_types(db: Session, active_only: bool = True) -> list[LeaveType]:
    query = select(LeaveType).order_by(LeaveType.id)
    if active_only:
        query = query.where(LeaveType.is_active == True)
    return list(db.scalars(query))


def get_type(db: Session, type_id: int) -> LeaveType | None:
    return db.get(LeaveType, type_id)


def get_balance(db: Session, employee_id: int, leave_type_id: int, year: int) -> LeaveBalance | None:
    return db.scalar(
        select(LeaveBalance).where(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type_id == leave_type_id,
            LeaveBalance.year == year,
        )
    )


def list_balances(db: Session, employee_id: int, year: int) -> list[LeaveBalance]:
    return list(
        db.scalars(
            select(LeaveBalance)
            .where(LeaveBalance.employee_id == employee_id, LeaveBalance.year == year)
            .order_by(LeaveBalance.leave_type_id)
        )
    )


def ensure_balance(db: Session, employee_id: int, leave_type: LeaveType, year: int) -> LeaveBalance:
    balance = get_balance(db, employee_id, leave_type.id, year)
    if balance is None:
        balance = LeaveBalance(
            employee_id=employee_id, leave_type_id=leave_type.id, year=year, total_days=leave_type.default_days
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)
    return balance
