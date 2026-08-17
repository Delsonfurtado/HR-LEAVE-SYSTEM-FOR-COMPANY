# Secure Leave Management - Backend

FastAPI + SQLAlchemy backend enforcing authentication, RBAC, object-level authorization and
full audit logging.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt        # Windows
# source .venv/bin/activate && pip install -r requirements.txt   # Linux/macOS
copy .env.example .env                               # then edit SECRET_KEY!
```

Generate a strong secret:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## Database setup & seed data

SQLite (`leave_management.db`) is created automatically on first start and seeded with demo
departments, leave types, users and one pending request. To reset:

```bash
del leave_management.db    # delete the file, restart the server
```

Manual seed (optional): `.venv\Scripts\python -m app.seed`

### Seeded accounts

| Email | Password | Role | Department |
|---|---|---|---|
| admin@secureleave.io | Admin@123 | admin | - |
| hr@secureleave.io | Hr@12345 | hr | People |
| eng.manager@secureleave.io | Manager@123 | manager | Engineering |
| dev@secureleave.io | Employee@123 | employee | Engineering |
| dev2@secureleave.io | Employee@123 | employee | Engineering |
| ops.manager@secureleave.io | Manager@123 | manager | Operations |
| ops.worker@secureleave.io | Employee@123 | employee | Operations |

## Start the backend

```bash
.venv\Scripts\uvicorn app.main:app --reload
```

API: http://localhost:8000 - Swagger docs: http://localhost:8000/docs

## Testing

```bash
.venv\Scripts\python -m pytest -q          # all 51 tests
.venv\Scripts\python -m pytest tests/unit -q
.venv\Scripts\python -m pytest tests/integration -q
.venv\Scripts\python -m pytest tests/security -q     # RBAC, BOLA, token attacks, lockout, injection
```

## Security testing

```bash
.venv\Scripts\pip-audit -r requirements.txt
```

Manual attack/denial walkthrough: see root README "Final demonstration".

## Documentation

All assignment deliverables are in `docs/` (requirements, RBAC, architecture, data-flow, threat
model, threat register, secure design, authN/authZ, API spec, data model, data classification,
security test plan + results, dependency scan, remediation, AI usage).

## Known limitations

- In-memory token revocation & rate limiting (single worker). Use Redis for multi-worker.
- SQLite is development-grade; swap `DATABASE_URL` to PostgreSQL for production.
- No email notifications / document uploads yet (see docs/remediation.md).
# HR-LEAVE-SYSTEM-FOR-COMPANY
