# Role-Based Access Control (RBAC)

## 1. Roles

| Role | Description |
|---|---|
| `employee` | Submits and tracks own leave |
| `manager` | Employee permissions + decides own department's requests |
| `hr` | Employee permissions + reports, leave types, balance adjustments, audit view |
| `admin` | Full access including user account management |

## 2. Permission matrix

Enforced in `app/core/permissions.py`, applied via the `require_permission()` dependency
(`app/api/deps.py`). Every route declares its permission; there is no route without one.

| Permission | employee | manager | hr | admin |
|---|:-:|:-:|:-:|:-:|
| leave:submit | X | X | X | X |
| leave:view_own | X | X | X | X |
| leave:cancel_own | X | X | X | X |
| balance:view_own | X | X | X | X |
| team:view | | X | | X |
| leave:view_team | | X | | X |
| leave:decide_team | | X | | X |
| reports:view | | | X | X |
| leave_type:manage | | | X | X |
| balance:adjust | | | X | X |
| audit:view | | | X | X |
| users:manage | | | | X |
| policies:manage | | | | X |

## 3. Object-level rules (beyond role checks)

| Rule | Enforcement point |
|---|---|
| Employee can only read/cancel own requests | `leave_service.get_own_request`, `cancel_request` (403 otherwise) |
| Manager decides only own department, never own requests | `leave_service.decide_request` (403 otherwise) |
| Manager team list limited to own department | `user_repo.list_by_department` |
| HR report can be filtered but reads all departments by design (HR function) | `hr.py` |
| Admin cannot change own role / deactivate self / remove last admin | `user_service.update_user` |

## 4. Enforcement example

```
Employee -> tries DELETE-like admin action /api/admin/users (direct API call)
        -> FastAPI dependency require_permission("users:manage")
        -> employee role lacks permission
        -> 403 Forbidden + "access.denied" audit entry
```

The React frontend hides unauthorized buttons, but hiding a button is never a security control;
the backend is the only authority.

## 5. Test coverage

- `tests/integration/test_rbac.py` - role matrix, anonymous access, admin self-protection
- `tests/security/test_bola.py` - object-level access between employees/teams
- `tests/unit/test_unit.py::test_permission_matrix`
