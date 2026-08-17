# Security Test Results

Run date: 2026-08-17 (local assignment run)
Environment: Windows, Python 3.12.9, pytest 9.1.1, fastapi 0.141.1 / starlette 1.6.0, PyJWT 2.13.0,
dependencies pinned in requirements.txt (upgraded after the first dependency scan, see remediation R-15)

## 1. Automated suite summary

```
cd backend
python -m pytest -q
...................................................      [100%]
51 passed in ~90s
```

| Suite | File | Tests | Result |
|---|---|---|---|
| Unit | tests/unit/test_unit.py | 6 | PASS |
| Integration (auth) | tests/integration/test_auth_flow.py | 7 | PASS |
| Integration (leave) | tests/integration/test_leave_flow.py | 10 | PASS |
| Integration (RBAC) | tests/integration/test_rbac.py | 10 | PASS |
| Security (BOLA/object-level) | tests/security/test_bola.py | 6 | PASS |
| Security (auth/validation/headers) | tests/security/test_security.py | 12 | PASS |

All 51 tests map to the IDs in security-test-plan.md (TC-01..TC-38).

## 2. Key security outcomes verified

| Check | Result |
|---|---|
| Expired / tampered / forged / wrong-type tokens rejected | 401 (TC-28..31) |
| Anonymous access to protected APIs | 401 on all 6 probed paths (TC-22) |
| Employee -> admin/HR/manager endpoints | 403 (TC-21) |
| Cross-employee object access | 403 + denial audit (TC-24, TC-27) |
| Manager cross-team / own-request decisions | 403 (TC-25, TC-26) |
| Brute force lockout | 423 after 5 failures (TC-33) |
| Disabled account | login 403 (TC-34) |
| SQL injection attempt | no effect, standard error (TC-35) |
| Weak passwords | rejected by schema (TC-06) |
| Security headers | present on every response (TC-38) |

## 3. Dependency scan

See dependency-scan.md (pip-audit over the pinned requirements, 0 known vulnerabilities at run time).

## 4. Manual demonstration

Completed per the root README "Final demonstration" script: 8 successful workflows and 6
denied/invalid workflows behaved as specified.

## 5. Issues found during testing

| Finding | Resolution |
|---|---|
| Test date offsets could land on weekends causing false failures | Tests now align to the next working day; product rule "range must contain a working day" unchanged |
| Initial draft returned 400 vs 409 ambiguity for overlap | Fixed: overlap = 409, insufficient balance = 400, documented in api-specification.md |
