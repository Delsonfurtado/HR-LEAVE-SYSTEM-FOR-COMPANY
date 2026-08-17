from fastapi import APIRouter, Depends

from app.api.deps import DbSession, get_current_user
from app.models.user import User
from app.repositories import leave_repo, user_repo
from app.schemas.leave import LeaveTypeOut
from app.schemas.user import DepartmentOut

router = APIRouter(prefix="/meta", tags=["Metadata"])


@router.get("/leave-types", response_model=list[LeaveTypeOut])
def active_leave_types(db: DbSession, user: User = Depends(get_current_user)):
    return leave_repo.list_types(db, active_only=True)


@router.get("/departments", response_model=list[DepartmentOut])
def departments(db: DbSession, user: User = Depends(get_current_user)):
    return user_repo.list_departments(db)
