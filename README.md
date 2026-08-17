# Secure Leave Management System

A role-based, audit-logged leave management system built to a secure-development assignment
specification: FastAPI + SQLAlchemy backend, React + TypeScript frontend, JWT authentication,
server-side RBAC on every endpoint, and a complete set of security documentation.

```
Employee submits leave -> Manager approves -> Balance updates -> Everything audited
```

## Architecture at a glance

- **backend/** - FastAPI, layered (api -> services -> repositories), Pydantic validation,
  bcrypt password hashing, JWT access/refresh with rotation + revocation, account lockout,
  rate limiting, security headers, denial auditing, 51 automated tests.
- **frontend/** - React + TypeScript SPA that hides unauthorized UI for convenience while the
  backend remains the single enforcement point (direct API calls still get 401/403).

## 1. Setup instructions

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt     # Windows
copy .env.example .env                            # edit SECRET_KEY!
.venv\Scripts\uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
copy .env.example .env
npm run dev
```

## 2. Environment configuration

- `backend/.env` - copy from `.env.example`; set a strong `SECRET_KEY`
  (`python -c "import secrets; print(secrets.token_hex(32))"`), token lifetimes, CORS origin,
  lockout policy. **Never commit `.env`.**
- `frontend/.env` - copy from `.env.example`; `VITE_API_BASE_URL=http://localhost:8000/api`.

## 3. Database setup

SQLite file `backend/leave_management.db` is created automatically on first startup.

## 4. Seed data

First startup seeds 3 departments, 3 leave types (Annual 20 / Sick 10 / Casual 5), balances,
and 7 demo users including one pending request for the manager demo:

| Email | Password | Role |
|---|---|---|
| admin@secureleave.io | Admin@123 | admin |
| hr@secureleave.io | Hr@12345 | hr |
| eng.manager@secureleave.io | Manager@123 | manager (Engineering) |
| dev@secureleave.io | Employee@123 | employee (Engineering) |
| dev2@secureleave.io | Employee@123 | employee (Engineering) |
| ops.manager@secureleave.io | Manager@123 | manager (Operations) |
| ops.worker@secureleave.io | Employee@123 | employee (Operations) |

Reset: stop server, delete the `.db` file, restart. Manual seed: `python -m app.seed`.

## 5. Backend startup

```bash
cd backend
.venv\Scripts\uvicorn app.main:app --reload
```

API http://localhost:8000 - Swagger http://localhost:8000/docs - Health `GET /health`.

## 6. Frontend startup

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 (expects backend on :8000, CORS pre-configured).

## 7. Testing commands

```bash
cd backend
.venv\Scripts\python -m pytest -q               # 51 tests: unit + integration + security
.venv\Scripts\python -m pytest tests/security -q
```

## 8. Security testing

```bash
.venv\Scripts\pip-audit -r requirements.txt     # dependency vulnerabilities
cd frontend && npm audit
```

Automated security tests cover RBAC matrix, BOLA (cross-employee / cross-team access),
expired/tampered/forged/replayed tokens, brute-force lockout, disabled accounts,
SQL-injection attempts, input validation and security headers.
Deliverables: `backend/docs/security-test-plan.md`, `security-test-results.md`, `dependency-scan.md`.

## Final demonstration

### Successful workflows

1. **Login** - sign in as each seeded role.
2. **Employee submits leave** - dev@ creates a request (validated: dates, overlap, balance).
3. **Employee views own leave** - list + detail.
4. **Employee views balance** - remaining days per type.
5. **Manager views team requests** - eng.manager sees Engineering queue (incl. seeded pending).
6. **Manager approves/rejects** - decision with comment; approval deducts balance.
7. **HR report** - hr@ runs `/hr/reports/leave` with filters; manages leave types.
8. **Admin manages accounts/policies** - admin@ lists users, changes a role, resets a password.
9. **Audit trail** - every action above appears in `/audit/logs` (HR/admin).

### Denied / invalid workflows (six required)

1. **Employee accessing another employee's information** - dev2@ calls
   `GET /api/leave/requests/{dev's id}` -> **403** + `access.denied` audit.
2. **Employee attempting administrator action** - dev@ calls `GET /api/admin/users` -> **403**
   (even though the UI hides the button, the API is the real gate).
3. **Manager accessing another team's request** - ops.manager@ decides an Engineering request ->
   **403** "own department" rule.
4. **Restricted field manipulation** - client sends `days: 0` or forged fields -> server recomputes
   days; role changes without `users:manage` -> **403**; weak password on reset -> **422**.
5. **Invalid/expired authentication** - expired, tampered or wrong-type token -> **401**;
   5 wrong passwords -> account locked **423**.
6. **Invalid input** - end before start / past dates / empty range -> **400**; overlap -> **409**;
   insufficient balance -> **400**; malformed JSON -> **422**.

## Documentation index

`backend/docs/`: requirements, rbac, architecture, data-flow, threat-model, threat-register,
secure-design, authentication-authorization, api-specification, data-model, data-classification,
security-test-plan, security-test-results, dependency-scan, remediation, ai-usage.

## GitHub workflow used

Issues -> `feature/<issue>-<name>` branches -> small conventional commits
(`feat(scope): ...`, `fix`, `docs`, `test`, `refactor`, `chore`) -> PRs referencing issues ->
review -> merge to `develop` -> release to `main`. No direct commits to `main`/`develop`.

## Known limitations

- Token revocation list and rate-limit counters are in-process (single worker); Redis needed for scale.
- Refresh token in sessionStorage (demo); production should use HttpOnly cookies + CSRF tokens.
- SQLite: swap `DATABASE_URL` to PostgreSQL for concurrency/row-locking.
- No email notifications, no document upload for sick leave, no SSO.
- Working-day count ignores public holidays (configurable calendar is future work).
