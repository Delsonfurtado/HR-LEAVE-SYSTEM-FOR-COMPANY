from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def list_logs(
    db: Session,
    action: str | None = None,
    status: str | None = None,
    resource_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[AuditLog], int]:
    query = select(AuditLog).order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
    count_query = select(func.count()).select_from(AuditLog)
    if action:
        query = query.where(AuditLog.action == action)
        count_query = count_query.where(AuditLog.action == action)
    if status:
        query = query.where(AuditLog.status == status)
        count_query = count_query.where(AuditLog.status == status)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
        count_query = count_query.where(AuditLog.resource_type == resource_type)
    total = db.scalar(count_query) or 0
    items = list(db.scalars(query.limit(limit).offset(offset)))
    return items, total
