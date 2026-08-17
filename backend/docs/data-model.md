# Data Model

## 1. Entity relationship overview

```
Department 1----* User 1----* LeaveRequest *----1 LeaveType
                    |                |
                    |                +---- decided_by (User, nullable)
                    |
                    +----* LeaveBalance *----1 LeaveType
User (actor) 1----* AuditLog
```

## 2. Tables

### departments
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK |
| name | VARCHAR(100) | UNIQUE, NOT NULL |
| created_at | DATETIME | server default now |

### users
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK |
| email | VARCHAR(255) | UNIQUE, indexed |
| hashed_password | VARCHAR(255) | bcrypt hash |
| full_name | VARCHAR(100) | |
| role | ENUM | employee / manager / hr / admin |
| department_id | INTEGER | FK departments.id, nullable |
| is_active | BOOLEAN | default true |
| failed_login_attempts | INTEGER | default 0 (lockout counter) |
| locked_until | DATETIME | nullable |
| created_at / updated_at | DATETIME | |

### leave_types
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK |
| code | VARCHAR(30) | UNIQUE (annual, sick, casual) |
| name | VARCHAR(100) | |
| default_days | INTEGER | entitlement default |
| requires_document | BOOLEAN | sick leave requires docs (policy flag) |
| is_active | BOOLEAN | disabled types cannot be requested |

### leave_requests
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK |
| employee_id | INTEGER | FK users.id, indexed |
| leave_type_id | INTEGER | FK leave_types.id |
| start_date / end_date | DATE | |
| days | INTEGER | working days, computed server-side |
| reason | VARCHAR(500) | min 5 chars |
| status | ENUM | pending / approved / rejected / cancelled |
| decision_comment | VARCHAR(500) | nullable |
| decided_by_id | INTEGER | FK users.id, nullable |
| decided_at | DATETIME | nullable |
| created_at / updated_at | DATETIME | |

### leave_balances
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK |
| employee_id | INTEGER | FK users.id |
| leave_type_id | INTEGER | FK leave_types.id |
| year | INTEGER | |
| total_days | INTEGER | entitlement (HR-adjustable) |
| used_days | INTEGER | incremented on approval |
| | | UNIQUE(employee_id, leave_type_id, year) |

### audit_logs
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK |
| actor_id | INTEGER | nullable FK users.id |
| actor_email | VARCHAR(255) | denormalized for traceability |
| action | VARCHAR(50) | indexed (see api-specification list) |
| resource_type / resource_id | VARCHAR | what was touched |
| details | JSON | structured context |
| ip_address | VARCHAR(45) | IPv6-safe |
| status | VARCHAR(10) | success / denied |
| created_at | DATETIME | indexed, newest first |

## 3. Invariants

- `used_days <= total_days` enforced by balance checks at submit and approval.
- `days = working_days(start_date, end_date)` always computed server-side, never accepted from client.
- One balance row per (employee, type, year) - DB unique constraint.
