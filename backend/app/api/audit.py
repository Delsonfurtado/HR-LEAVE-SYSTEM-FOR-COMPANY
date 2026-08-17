from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, require_permission
from app.repositories import audit_repo
from app.schemas.audit import AuditLogOut, AuditLogPage

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/logs", response_model=AuditLogPage)
def list_logs(
    db: DbSession,
    action: str | None = None,
    status: str | None = None,
    resource_type: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user=Depends(require_permission("audit:view")),
):
    items, total = audit_repo.list_logs(db, action, status, resource_type, limit, offset)
    return AuditLogPage(items=[AuditLogOut.model_validate(i) for i in items], total=total)
