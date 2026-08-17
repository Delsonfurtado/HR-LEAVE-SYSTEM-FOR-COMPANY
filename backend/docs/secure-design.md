# Secure Design

## 1. Principles applied

| Principle | How it is applied |
|---|---|
| Complete mediation | Every route has an auth dependency + permission check; object checks in services |
| Least privilege | Permission sets per role; HR cannot manage users; managers limited to own department |
| Defense in depth | Frontend hides + backend enforces; validation at schema AND service layers |
| Fail secure | Missing/invalid token -> 401; unknown permission -> 403; errors never bypass checks |
| Secure defaults | Inactive users rejected, generic login errors, `CSP default-src 'none'`, no-store caching |
| Separation of duties | Managers cannot decide their own leave; admins cannot edit their own role |
| Economy of mechanism | Small dependency-based permission system, one audit writer |
| Open design | Security rests on the secret key and standard primitives, not on obscurity |

## 2. Controls inventory

| Category | Controls |
|---|---|
| Authentication | bcrypt hashing, JWT (30 min access / 7 day refresh), refresh rotation, logout revocation, lockout, rate limiting |
| Authorization | RBAC permission matrix, object-level ownership/department checks, last-admin protection |
| Audit | Login/logout/refresh, leave submit/cancel/approve/reject, user/role/password changes, balance/policy changes, 401/403 denials via middleware |
| Input validation | Pydantic schemas on every endpoint (types, lengths, ranges, email format, password policy, date sanity, literal action values) |
| Output security | JSON-only responses, security headers (nosniff, DENY, CSP, no-store, Referrer-Policy) |
| Data protection | Passwords hashed; tokens carry no PII; git-ignored secrets |
| Testing | 51 automated tests covering business rules, RBAC matrix, BOLA, token attacks, lockout, injection, headers |

## 3. Key code locations

- Permission matrix: `app/core/permissions.py`
- Enforcement dependency: `app/api/deps.py` (`require_permission`)
- Object-level checks: `app/services/leave_service.py`
- Lockout/rate limit: `app/services/auth_service.py`
- Audit writer: `app/services/audit_service.py`, `app/middleware/audit_middleware.py`
- Security headers: `app/middleware/security_headers.py`

## 4. Frontend rule

Hiding a button is UX, not security. The SPA restricts navigation per role for usability only;
identical API calls made directly (curl/Swagger) receive 401/403 from the backend, which is the
single enforcement point.
