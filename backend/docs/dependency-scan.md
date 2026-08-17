# Dependency Scan

## 1. Tooling

- Backend: [pip-audit](https://pypi.org/project/pip-audit/) auditing the installed virtual environment
- Frontend: `npm audit` (run in frontend/)

## 2. Backend scan procedure

```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\pip-audit
```

## 3. Backend results (assignment run, 2026-08-17)

Pinned dependency set (after remediation):

```
fastapi==0.141.1, uvicorn==0.34.0, starlette==1.6.0 (transitive),
SQLAlchemy==2.0.36, pydantic==2.10.4, pydantic-settings==2.7.0,
email-validator==2.2.0, PyJWT==2.13.0, passlib==1.7.4, bcrypt==4.0.1,
httpx==0.28.1, pytest==9.1.1, pip-audit==2.7.3
```

Result: **No known vulnerabilities** (`pip-audit`: "No known vulnerabilities found").

### Findings during the first scan and remediation

The initial pin set produced 15 advisories in 3 packages:

| Package | Advisories | Remediation |
|---|---|---|
| starlette 0.41.3 (via fastapi 0.115.6) | 8 (PYSEC-2026-161, -2280, -2281, -1941, -1942, -248, -249, ...) | Upgraded fastapi to 0.141.1, which resolves starlette 1.6.0 |
| PyJWT 2.10.1 | 6 (PYSEC-2025-183, PYSEC-2026-120, -175, -176, -177, -178, -179) | Upgraded to PyJWT 2.13.0 |
| pytest 8.3.4 | 1 (PYSEC-2026-1845) | Upgraded to pytest 9.1.1 |
| pip 24.3.1 (venv tooling) | 4 | Upgraded pip inside the venv |

After upgrades the full test suite was re-run (51/51 passed) and the audit came back clean.

Notes:

- `bcrypt` is pinned to 4.0.1 because passlib 1.7.4 logs warnings (not a vulnerability) with
  bcrypt >= 4.1; the pin keeps behavior deterministic.
- PyJWT 2.13 warns when an HMAC key is shorter than 32 bytes; the test-suite key was lengthened
  accordingly and `.env.example` instructs generating a 32-byte hex secret.

## 4. Frontend

```bash
cd frontend
npm install
npm audit
```

The dependency footprint is intentionally tiny (react, react-dom, react-router-dom + build tooling)
to minimize exposure. Re-run `npm audit` after install and before every release; treat any `high`
finding as a release blocker.

## 5. Ongoing policy

- Pin all versions; upgrade deliberately via PR.
- Re-run both audits as part of the remediation/regression step (day 9-10 of the plan).
- New dependencies require justification in the PR (supply-chain risk).
