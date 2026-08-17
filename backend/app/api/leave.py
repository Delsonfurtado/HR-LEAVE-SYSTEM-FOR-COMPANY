from fastapi import APIRouter, Depends, Request, status

from app.api.deps import DbSession, client_ip, require_permission
from app.repositories import leave_repo
from app.schemas.leave import BalanceOut, LeaveRequestCreate, LeaveRequestOut
from app.services import leave_service

router = APIRouter(prefix="/leave", tags=["Leave"])


@router.get("/requests", response_model=list[LeaveRequestOut])
def my_requests(
    db: DbSession,
    user=Depends(require_permission("leave:view_own")),
):
    return [leave_service.serialize_request(r) for r in leave_repo.list_by_employee(db, user.id)]


@router.post("/requests", response_model=LeaveRequestOut, status_code=status.HTTP_201_CREATED)
def submit_request(
    body: LeaveRequestCreate,
    request: Request,
    db: DbSession,
    user=Depends(require_permission("leave:submit")),
):
    created = leave_service.submit_request(db, user, body, client_ip(request))
    return leave_service.serialize_request(created)


@router.get("/requests/{request_id}", response_model=LeaveRequestOut)
def get_request(
    request_id: int,
    request: Request,
    db: DbSession,
    user=Depends(require_permission("leave:view_own")),
):
    found = leave_service.get_own_request(db, user, request_id, client_ip(request))
    return leave_service.serialize_request(found)


@router.post("/requests/{request_id}/cancel", response_model=LeaveRequestOut)
def cancel_request(
    request_id: int,
    request: Request,
    db: DbSession,
    user=Depends(require_permission("leave:cancel_own")),
):
    cancelled = leave_service.cancel_request(db, user, request_id, client_ip(request))
    return leave_service.serialize_request(cancelled)


@router.get("/balance", response_model=list[BalanceOut])
def my_balance(
    db: DbSession,
    user=Depends(require_permission("balance:view_own")),
):
    from app.utils.dates import today

    balances = leave_repo.list_balances(db, user.id, today().year)
    return [
        BalanceOut(
            leave_type_id=b.leave_type_id,
            leave_type_name=b.leave_type.name,
            year=b.year,
            total_days=b.total_days,
            used_days=b.used_days,
            remaining_days=b.total_days - b.used_days,
        )
        for b in balances
    ]
