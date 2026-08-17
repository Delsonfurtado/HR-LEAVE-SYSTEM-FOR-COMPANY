from fastapi import APIRouter, Depends, Request, status

from app.api.deps import DbSession, client_ip, require_permission
from app.models.leave import RequestStatus
from app.repositories import leave_repo, user_repo
from app.schemas.leave import DecisionRequest, LeaveRequestOut
from app.schemas.user import UserOut
from app.services import leave_service

router = APIRouter(prefix="/manager", tags=["Manager"])


@router.get("/team", response_model=list[UserOut])
def my_team(
    db: DbSession,
    user=Depends(require_permission("team:view")),
):
    if user.department_id is None:
        return []
    members = user_repo.list_by_department(db, user.department_id)
    result = []
    for member in members:
        out = UserOut.model_validate(member)
        out.department_name = member.department.name if member.department else None
        result.append(out)
    return result


@router.get("/requests", response_model=list[LeaveRequestOut])
def team_requests(
    db: DbSession,
    status_filter: RequestStatus | None = None,
    user=Depends(require_permission("leave:view_team")),
):
    if user.department_id is None:
        return []
    requests = leave_repo.list_by_department(db, user.department_id, status_filter)
    return [leave_service.serialize_request(r) for r in requests]


@router.post("/requests/{request_id}/decision", response_model=LeaveRequestOut)
def decide(
    request_id: int,
    body: DecisionRequest,
    request: Request,
    db: DbSession,
    user=Depends(require_permission("leave:decide_team")),
):
    decided = leave_service.decide_request(db, user, request_id, body.action, body.comment, client_ip(request))
    return leave_service.serialize_request(decided)
