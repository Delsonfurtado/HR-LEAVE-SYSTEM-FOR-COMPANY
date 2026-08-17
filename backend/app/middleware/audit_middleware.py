from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app import db as database
from app.models.audit import AuditLog


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if response.status_code in (401, 403) and request.url.path.startswith("/api"):
            session = database.SessionLocal()
            try:
                session.add(
                    AuditLog(
                        actor_id=None,
                        actor_email=None,
                        action="access.denied",
                        resource_type="endpoint",
                        resource_id=request.url.path,
                        details={"method": request.method, "status_code": response.status_code},
                        ip_address=request.client.host if request.client else None,
                        status="denied",
                    )
                )
                session.commit()
            except Exception:
                session.rollback()
            finally:
                session.close()
        return response
