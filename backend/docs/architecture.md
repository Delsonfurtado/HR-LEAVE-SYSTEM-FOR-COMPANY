# Architecture

## 1. Overview

```
+---------------------+        HTTPS/JSON (JWT Bearer)        +--------------------------+
| React + Vite SPA    | -----------------------------------> | FastAPI backend           |
| (frontend/)         | <----------------------------------- | (backend/app)             |
+---------------------+        validated responses            +------------+-------------+
                                                                      |
                                                     SQLAlchemy ORM    |
                                                                      v
                                                              +---------------+
                                                              | SQLite (dev)  |
                                                              | audit_logs,   |
                                                              | users, leave  |
                                                              +---------------+
```

## 2. Backend layering

```
app/
├── api/          Routers + dependencies (auth, deps). No business logic here.
├── schemas/      Pydantic request/response models = input validation boundary.
├── services/     Business rules, authorization decisions, audit logging.
├── repositories/ SQL queries only (SQLAlchemy), no HTTP concepts.
├── models/       ORM entities (User, LeaveRequest, LeaveBalance, AuditLog...).
├── core/         Config, JWT/password primitives, permission matrix.
├── middleware/   Security headers + denial audit middleware.
├── utils/        Date helpers (working days, overlap).
├── db.py         Engine/session factory.
└── main.py       App assembly, CORS, lifespan (create tables + seed).
```

Request flow: `HTTP -> middleware (headers) -> router -> require_permission -> service -> repository -> DB`,
with audit entries written by services at every decision point and by middleware on 401/403.

## 3. Technology choices

| Concern | Choice | Why |
|---|---|---|
| API framework | FastAPI | Automatic OpenAPI docs, dependency injection for auth, Pydantic validation |
| ORM | SQLAlchemy 2.0 | Parameterized queries everywhere (SQL injection prevention) |
| Auth | JWT (PyJWT) HS256 | Stateless, short-lived access + rotating refresh tokens |
| Password hashing | bcrypt via passlib | Standard, salted, slow KDF |
| DB | SQLite (dev) | Zero-configuration for assignment; SQLAlchemy allows PostgreSQL swap |
| Tests | pytest + TestClient | Unit, integration and security suites |

## 4. Trust boundaries

1. **Browser <-> Backend**: JWT-bearing HTTPS requests; CORS restricted to the frontend origin.
2. **Backend <-> Database**: local trust zone; all inputs already validated/parameterized.
3. **Process memory**: token revocation list and login rate-limit counters (per-process, see
   threat-register TR-09 for the multi-worker caveat).

## 5. Deployment notes

- `uvicorn app.main:app` starts the API; lifespan creates tables and seeds demo data if empty.
- `ENV=test` disables startup seeding (used by the test suite).
- Frontend is a static SPA served by Vite dev server or any static host.
