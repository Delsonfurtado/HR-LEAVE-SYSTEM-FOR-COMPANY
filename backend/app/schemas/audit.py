from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    id: int
    actor_id: int | None = None
    actor_email: str | None = None
    action: str
    resource_type: str | None = None
    resource_id: str | None = None
    details: dict[str, Any] | None = None
    ip_address: str | None = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogPage(BaseModel):
    items: list[AuditLogOut]
    total: int
