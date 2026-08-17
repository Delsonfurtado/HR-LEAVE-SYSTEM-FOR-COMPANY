from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.deps import DbSession, client_ip, require_permission
from app.models.leave import RequestStatus
from app.repositories import leave_repo, user_repo
from app.schemas.leave import (
    BalanceAdjustRequest,
    BalanceOut,
    LeaveReport,
    LeaveReportItem,
    LeaveReportSummary,
    LeaveTypeCreate,
    LeaveTypeOut,
    LeaveTypeUpdate,
)
from app.services import audit_service

router = APIRouter(prefix="/hr", tags=["HR"])


@router.get("/reports/leave", response_model=LeaveReport)
def leave_report(
    db: DbSession,
    start: date | None = None,
    end: date | None = None,
    department_id: int | None = None,
    user=Depends(require_permission("reports:view")),
):
    requests = leave_repo.list_for_report(db, start, end, department_id)

    items = [
        LeaveReportItem(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=r.employee.full_name,
            employee_email=r.employee.email,
            department=r.employee.department.name if r.employee.department else None,
            leave_type_name=r.leave_type.name,
            start_date=r.start_date,
            end_date=r.end_date,
            days=r.days,
            status=r.status,
            created_at=r.created_at,
        )
        for r in requests
    ]

    by_type: dict[str, int] = {}
    for r in requests:
        by_type[r.leave_type.name] = by_type.get(r.leave_type.name, 0) + 1

    summary = LeaveReportSummary(
        total_requests=len(requests),
        pending_count=sum(1 for r in requests if r.status == RequestStatus.pending),
        approved_count=sum(1 for r in requests if r.status == RequestStatus.approved),
        rejected_count=sum(1 for r in requests if r.status == RequestStatus.rejected),
        approved_days=sum(r.days for r in requests if r.status == RequestStatus.approved),
        by_type=by_type,
    )
    return LeaveReport(items=items, summary=summary)


@router.get("/leave-types", response_model=list[LeaveTypeOut])
def list_leave_types(
    db: DbSession,
    user=Depends(require_permission("reports:view")),
):
    return leave_repo.list_types(db, active_only=False)


@router.post("/leave-types", response_model=LeaveTypeOut, status_code=status.HTTP_201_CREATED)
def create_leave_type(
    body: LeaveTypeCreate,
    request: Request,
    db: DbSession,
    user=Depends(require_permission("leave_type:manage")),
):
    existing = next((t for t in leave_repo.list_types(db, active_only=False) if t.code == body.code), None)
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Leave type code already exists")

    from app.models.leave import LeaveType

    leave_type = LeaveType(**body.model_dump())
    db.add(leave_type)
    db.commit()
    db.refresh(leave_type)

    audit_service.log(
        db, user, None, "leave_type.create", "leave_type", leave_type.id,
        {"code": leave_type.code, "default_days": leave_type.default_days}, client_ip(request), "success",
    )
    return leave_type


@router.put("/leave-types/{type_id}", response_model=LeaveTypeOut)
def update_leave_type(
    type_id: int,
    body: LeaveTypeUpdate,
    request: Request,
    db: DbSession,
    user=Depends(require_permission("leave_type:manage")),
):
    leave_type = leave_repo.get_type(db, type_id)
    if leave_type is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave type not found")

    changes = body.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(leave_type, field, value)
    db.commit()
    db.refresh(leave_type)

    audit_service.log(db, user, None, "leave_type.update", "leave_type", type_id, changes, client_ip(request), "success")
    return leave_type


@router.post("/balances/adjust", response_model=BalanceOut)
def adjust_balance(
    body: BalanceAdjustRequest,
    request: Request,
    db: DbSession,
    user=Depends(require_permission("balance:adjust")),
):
    employee = user_repo.get_by_id(db, body.employee_id)
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")

    leave_type = leave_repo.get_type(db, body.leave_type_id)
    if leave_type is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave type not found")

    balance = leave_repo.get_balance(db, body.employee_id, body.leave_type_id, body.year)
    old_total = balance.total_days if balance else None
    if balance is None:
        from app.models.leave import LeaveBalance

        balance = LeaveBalance(
            employee_id=body.employee_id,
            leave_type_id=body.leave_type_id,
            year=body.year,
            total_days=body.total_days,
            used_days=0,
        )
        db.add(balance)
    else:
        balance.total_days = body.total_days
    db.commit()
    db.refresh(balance)

    audit_service.log(
        db, user, None, "balance.adjust", "leave_balance", balance.id,
        {"employee_id": body.employee_id, "old_total": old_total, "new_total": body.total_days, "year": body.year},
        client_ip(request), "success",
    )
    return BalanceOut(
        leave_type_id=balance.leave_type_id,
        leave_type_name=leave_type.name,
        year=balance.year,
        total_days=balance.total_days,
        used_days=balance.used_days,
        remaining_days=balance.total_days - balance.used_days,
    )
