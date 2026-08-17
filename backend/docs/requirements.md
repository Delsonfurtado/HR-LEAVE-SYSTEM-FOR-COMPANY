# Requirements

## 1. Purpose

A web-based leave management system that lets employees request leave, managers approve/reject team
requests, HR produce reports and manage policies, and administrators manage accounts - with security
(RBAC, audit logging, secure authentication) designed in from the start.

## 2. Functional requirements

| ID | Requirement |
|---|---|
| FR-1 | Users log in with email + password and receive JWT access/refresh tokens |
| FR-2 | Employees submit leave requests (type, date range, reason) |
| FR-3 | Employees view and cancel their own pending requests |
| FR-4 | Employees view their leave balances for the current year |
| FR-5 | Managers view their department's members and requests |
| FR-6 | Managers approve or reject pending requests of their own department (never their own) |
| FR-7 | HR runs leave reports filtered by date range and department |
| FR-8 | HR manages leave types (enable/disable, defaults) and adjusts employee balances |
| FR-9 | Administrators create users, change roles/departments, activate/deactivate accounts, reset passwords |
| FR-10 | HR and administrators view the audit log; all security-relevant events are recorded |

## 3. Business rules

| ID | Rule |
|---|---|
| BR-1 | Leave duration counts working days (Mon-Fri) only |
| BR-2 | Start date must be today or in the future; end >= start |
| BR-3 | A request must contain at least one working day |
| BR-4 | Requests must not overlap existing pending/approved leave of the same employee |
| BR-5 | A request cannot exceed the remaining balance for that leave type/year |
| BR-6 | Only pending requests can be cancelled or decided; decisions are final |
| BR-7 | Approving a request deducts its days from the employee's balance |
| BR-8 | A manager cannot decide their own leave request |
| BR-9 | A manager can only decide requests of employees in their own department |

## 4. Security requirements

| ID | Requirement |
|---|---|
| SR-1 | All passwords hashed with bcrypt; plaintext never stored or logged |
| SR-2 | JWT access tokens (30 min) + refresh tokens (7 days) with rotation and revocation on logout |
| SR-3 | Role-based access control enforced server-side on every endpoint (frontend hiding is never security) |
| SR-4 | Object-level authorization: employees access only their own records; managers only their team |
| SR-5 | Account lockout after 5 failed logins (15 min) + per-IP/email login rate limiting |
| SR-6 | Immutable audit trail of authentication, leave, and administration events, including denials |
| SR-7 | Input validation on every payload (Pydantic), strong password policy |
| SR-8 | Security response headers on all API responses (CSP, nosniff, DENY, no-store) |
| SR-9 | Disabled accounts cannot authenticate and their tokens stop working |
| SR-10 | The last active administrator cannot be deactivated or demoted |

## 5. Out of scope

Document uploads for sick leave, email notifications, PostgreSQL deployment, SSO, and mobile apps
(see remediation.md / README "Known limitations").
