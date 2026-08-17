# Threat Model (STRIDE)

## 1. Assets

1. User credentials (bcrypt hashes, plaintext at login moment)
2. JWT signing secret and issued tokens
3. Personal leave data (requests, balances, reasons)
4. Audit log integrity
5. Leave policy data (types, quotas)
6. Availability of the approval workflow

## 2. Actors

- Anonymous internet user
- Authenticated employee / manager / HR / administrator
- Curious insider (legit user probing other users' data)
- Database/process attacker (out of scope of the app tier, mitigations noted)

## 3. STRIDE analysis per system element

| Element | Spoofing | Tampering | Repudiation | Info disclosure | DoS | Elevation of privilege |
|---|---|---|---|---|---|---|
| Login endpoint | Password guessing -> lockout + rate limit | - | auth.login audit (success+denied) | Generic error messages (no user enumeration) | Rate limit (10/min) | - |
| JWT tokens | HS256 signature; forged/replayed tokens rejected | Signature covers claims; type check access vs refresh | jti + revocation list; refresh rotation | Token contains only id/type/timestamps | Short expiry | role claim NOT in token; role read from DB per request |
| Employee leave API | Token required | Pydantic validation; service re-validates | leave.submit/cancel audits | Object-level checks (own records only) | - | require_permission per route |
| Manager decision API | Token + role check | Status transitions guarded (pending only) | leave.approve/reject audits | Department scope enforced | - | Own-request + cross-team blocks |
| HR report API | role check | Query params validated | report access via authenticated HR role only | HR is authorized to see cross-department data by function | - | reports:view permission |
| Admin user API | users:manage permission | Strong password schema; role changes audited | user.update / role_change / password_reset audits | - | Last-admin protection avoids admin lockout | Self-role-change blocked |
| Database | - | SQLAlchemy ORM, parameterized | - | No direct external access | - | Single app DB account (dev) |
| Audit log | - | Append-only via app code | The control itself | audit:view restricted to HR/admin | - | - |

## 4. Assumptions

- SECRET_KEY is kept out of source control via `.env` (git-ignored).
- The host and database file are not directly exposed to the internet.
- HTTPS is terminated in front of the app in any real deployment.

## 5. Findings summary

Full ranked findings and mitigations are tracked in `threat-register.md`; remediation history is in
`remediation.md`.
