from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, audit, auth, hr, leave, manager, meta
from app.core.config import get_settings
from app.db import Base, SessionLocal, engine
from app.middleware.audit_middleware import AuditMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if settings.ENV != "test":
        Base.metadata.create_all(bind=engine)
        from app.repositories import user_repo
        from app.seed import run_seed

        with SessionLocal() as db:
            if user_repo.count_users(db) == 0:
                run_seed(db)
    yield


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuditMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(meta.router, prefix="/api")
app.include_router(leave.router, prefix="/api")
app.include_router(manager.router, prefix="/api")
app.include_router(hr.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(audit.router, prefix="/api")


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
