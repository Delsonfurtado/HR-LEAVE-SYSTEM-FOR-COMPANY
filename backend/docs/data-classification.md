# Data Classification

Classification levels: **Public**, **Internal**, **Confidential**, **Restricted**.

| Data | Class | Justification | Handling rules |
|---|---|---|---|
| Product/docs pages, /health | Public | No personal data | Freely available |
| Leave types, departments, policy defaults | Internal | Business info, no PII | Authenticated users |
| Leave requests (dates, reason, status) | Confidential | Personal data | Owner, own-department manager, HR, admin (RBAC + object checks) |
| Leave balances | Confidential | Personal data | Owner, HR, admin |
| User profiles (name, email, role, dept) | Confidential | PII | Authenticated minimal use; full list admin-only |
| Password hashes (bcrypt) | Restricted | Credential material | Never returned by any API, never logged |
| JWT access/refresh tokens | Restricted | Bearer credentials | Short expiry, revocation, transported only over HTTPS |
| SECRET_KEY / .env | Restricted | Signing material | Git-ignored, environment-only, rotate on suspicion |
| Audit logs (actor, action, IP, details) | Restricted | Security monitoring data | HR/admin view only; append-only |

## Rules derived

1. Any response containing leave data requires authentication and passes an object-level check.
2. No endpoint ever returns `hashed_password`; the ORM field is excluded from all schemas.
3. Audit `details` must never contain passwords or raw tokens - reviewers check this in PRs
   (enforced by the single audit writer in `audit_service.py`).
4. Tokens carry no PII (only numeric id, type, timestamps, jti).
5. Frontend stores tokens in sessionStorage for the demo only; classification demands
   HttpOnly-cookie transport in production (see remediation.md R-04).
