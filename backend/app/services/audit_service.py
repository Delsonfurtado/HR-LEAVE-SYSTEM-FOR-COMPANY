from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User
from app.utils.dates import utcnow


def log(
    db: Session,
    actor: User | None,
    actor_email: str | None,
    action: str,
    resource_type: str | None = None,
    resource_id: int | str | None = None,
    details: dict | None = None,
    ip_address: str | None = None,
    status: str = "success",
) -> AuditLog:
    entry = AuditLog(
        actor_id=actor.id if actor else None,
        actor_email=actor_email or (actor.email if actor else None),
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        details=details,
        ip_address=ip_address,
        status=status,
        created_at=utcnow(),
    )
    db.add(entry)
    db.commit()
    return entry
