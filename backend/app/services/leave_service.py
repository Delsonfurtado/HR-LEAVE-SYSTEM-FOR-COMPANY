from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.leave import LeaveRequest, LeaveType, RequestStatus
from app.models.user import User
from app.repositories import leave_repo
from app.schemas.leave import LeaveRequestCreate, LeaveRequestOut
from app.services import audit_service
from app.utils.dates import today, utcnow, working_days


def serialize_request(req: LeaveRequest) -> LeaveRequestOut:
    return LeaveRequestOut(
        id=req.id,
        employee_id=req.employee_id,
        employee_name=req.employee.full_name,
        leave_type_id=req.leave_type_id,
        leave_type_name=req.leave_type.name,
        start_date=req.start_date,
        end_date=req.end_date,
        days=req.days,
        reason=req.reason,
        status=req.status,
        decision_comment=req.decision_comment,
        decided_by_name=req.decided_by.full_name if req.decided_by else None,
        decided_at=req.decided_at,
        created_at=req.created_at,
    )


def submit_request(
    db: Session, employee: User, data: LeaveRequestCreate, ip: str | None
) -> LeaveRequest:
    if data.start_date < today():
        raise HTTPException(status_code=400, detail="Start date cannot be in the past")
    if data.end_date < data.start_date:
        raise HTTPException(status_code=400, detail="End date must be on or after start date")

    days = working_days(data.start_date, data.end_date)
    if days == 0:
        raise HTTPException(status_code=400, detail="Requested range contains no working days")

    leave_type = leave_repo.get_type(db, data.leave_type_id)
    if leave_type is None or not leave_type.is_active:
        raise HTTPException(status_code=404, detail="Leave type not found")

    if leave_repo.has_overlapping(db, employee.id, data.start_date, data.end_date):
        audit_service.log(
            db, employee, None, "leave.submit", "leave_request", None,
            {"reason": "overlapping_dates", "start": str(data.start_date), "end": str(data.end_date)}, ip, "denied",
        )
        raise HTTPException(status_code=409, detail="You already have a pending or approved request overlapping these dates")

    balance = leave_repo.ensure_balance(db, employee.id, leave_type, data.start_date.year)
    remaining = balance.total_days - balance.used_days
    if days > remaining:
        audit_service.log(
            db, employee, None, "leave.submit", "leave_request", None,
            {"reason": "insufficient_balance", "requested": days, "remaining": remaining}, ip, "denied",
        )
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance: requested {days} day(s), {remaining} remaining",
        )

    request = LeaveRequest(
        employee_id=employee.id,
        leave_type_id=leave_type.id,
        start_date=data.start_date,
        end_date=data.end_date,
        days=days,
        reason=data.reason,
        status=RequestStatus.pending,
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    audit_service.log(
        db, employee, None, "leave.submit", "leave_request", request.id,
        {"leave_type": leave_type.code, "start": str(data.start_date), "end": str(data.end_date), "days": days}, ip, "success",
    )
    return request


def get_own_request(db: Session, user: User, request_id: int, ip: str | None) -> LeaveRequest:
    request = leave_repo.get_request(db, request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.employee_id != user.id:
        audit_service.log(
            db, user, None, "leave.view", "leave_request", request_id,
            {"reason": "not_owner"}, ip, "denied",
        )
        raise HTTPException(status_code=403, detail="You can only access your own leave requests")
    return request


def cancel_request(db: Session, user: User, request_id: int, ip: str | None) -> LeaveRequest:
    request = get_own_request(db, user, request_id, ip)
    if request.status != RequestStatus.pending:
        raise HTTPException(status_code=409, detail="Only pending requests can be cancelled")

    request.status = RequestStatus.cancelled
    db.commit()
    db.refresh(request)
    audit_service.log(db, user, None, "leave.cancel", "leave_request", request.id, None, ip, "success")
    return request


def decide_request(
    db: Session, manager: User, request_id: int, action: str, comment: str | None, ip: str | None
) -> LeaveRequest:
    request = leave_repo.get_request(db, request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.employee_id == manager.id:
        audit_service.log(db, manager, None, "leave.decide", "leave_request", request_id, {"reason": "own_request"}, ip, "denied")
        raise HTTPException(status_code=403, detail="You cannot approve or reject your own request")

    employee = request.employee
    if employee is None or employee.department_id != manager.department_id:
        audit_service.log(
            db, manager, None, "leave.decide", "leave_request", request_id,
            {"reason": "outside_team", "employee_id": request.employee_id}, ip, "denied",
        )
        raise HTTPException(status_code=403, detail="You can only decide requests from your own department")

    if request.status != RequestStatus.pending:
        raise HTTPException(status_code=409, detail="Request has already been decided")

    if action == "approve":
        balance = leave_repo.ensure_balance(db, request.employee_id, request.leave_type, request.start_date.year)
        remaining = balance.total_days - balance.used_days
        if request.days > remaining:
            audit_service.log(
                db, manager, None, "leave.approve", "leave_request", request_id,
                {"reason": "insufficient_balance", "remaining": remaining}, ip, "denied",
            )
            raise HTTPException(status_code=409, detail="Employee no longer has sufficient balance")
        balance.used_days += request.days
        request.status = RequestStatus.approved
        action_name = "leave.approve"
    else:
        request.status = RequestStatus.rejected
        action_name = "leave.reject"

    request.decision_comment = comment
    request.decided_by_id = manager.id
    request.decided_at = utcnow()
    db.commit()
    db.refresh(request)

    audit_service.log(
        db, manager, None, action_name, "leave_request", request.id,
        {"employee_id": request.employee_id, "days": request.days, "comment": comment}, ip, "success",
    )
    return request
