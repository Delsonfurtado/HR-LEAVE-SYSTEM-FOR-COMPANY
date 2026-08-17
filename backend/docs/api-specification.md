# API Specification

Base URL: `http://localhost:8000/api` - Interactive docs at `/docs` (OpenAPI).

All authenticated endpoints require `Authorization: Bearer <access_token>`.

## Authentication

| Method | Path | Auth | Body / Notes | Success | Errors |
|---|---|---|---|---|---|
| POST | /auth/login | none | `{email, password}` -> token pair | 200 | 401 invalid, 423 locked, 429 rate limited, 422 validation |
| POST | /auth/refresh | none | `{refresh_token}` -> new pair (rotates) | 200 | 401 invalid/expired/replayed |
| POST | /auth/logout | Bearer | `{refresh_token?}` revokes tokens | 200 | 401 |
| GET | /auth/me | Bearer | current user profile | 200 | 401 |

## Metadata (any authenticated user)

| Method | Path | Notes |
|---|---|---|
| GET | /meta/leave-types | active leave types |
| GET | /meta/departments | department list |

## Employee leave

| Method | Path | Permission | Notes | Errors |
|---|---|---|---|---|
| GET | /leave/requests | leave:view_own | own requests only | 401 |
| POST | /leave/requests | leave:submit | `{leave_type_id, start_date, end_date, reason(5-500)}` | 400 past/empty-range/insufficient, 404 type, 409 overlap, 422 validation |
| GET | /leave/requests/{id} | leave:view_own | own object check | 403 other's request, 404 |
| POST | /leave/requests/{id}/cancel | leave:cancel_own | pending only | 403 not owner, 409 already decided |
| GET | /leave/balance | balance:view_own | current-year balances | 401 |

## Manager

| Method | Path | Permission | Notes | Errors |
|---|---|---|---|---|
| GET | /manager/team | team:view | own department members | 403 |
| GET | /manager/requests?status_filter= | leave:view_team | own department requests | 403 |
| POST | /manager/requests/{id}/decision | leave:decide_team | `{action: approve\|reject, comment?}` | 403 own/cross-team, 404, 409 already decided / insufficient balance |

## HR

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | /hr/reports/leave?start=&end=&department_id= | reports:view | items + summary (counts, approved days, by-type) |
| GET | /hr/leave-types | reports:view | all types incl. disabled |
| POST | /hr/leave-types | leave_type:manage | `{code, name, default_days, requires_document}` |
| PUT | /hr/leave-types/{id} | leave_type:manage | partial update |
| POST | /hr/balances/adjust | balance:adjust | `{employee_id, leave_type_id, year, total_days}` sets the entitlement |

## Administrator

| Method | Path | Permission | Notes | Errors |
|---|---|---|---|---|
| GET | /admin/users?role=&active= | users:manage | list users | 403 |
| POST | /admin/users | users:manage | `{email, full_name, password, role, department_id?}` | 409 duplicate email, 404 dept, 422 weak password |
| PATCH | /admin/users/{id} | users:manage | any of name/role/department/active | 400 self role/deactivate, 409 last admin |
| PUT | /admin/users/{id}/password | users:manage | `{new_password}` (strong policy) | 422 |
| GET | /admin/departments | users:manage | list departments | 403 |

## Audit

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | /audit/logs?action=&status=&resource_type=&limit=&offset= | audit:view | `{items, total}` newest first |

## Other

| Method | Path | Notes |
|---|---|---|
| GET | /health | liveness probe (no auth) |

## Error format

`{"detail": "message"}` with appropriate HTTP status. Validation errors return FastAPI's
standard 422 array.

## Audit actions emitted

`auth.login / auth.refresh / auth.logout / access.denied / leave.submit / leave.cancel /
leave.approve / leave.reject / user.create / user.update / user.password_reset /
leave_type.create / leave_type.update / balance.adjust`
