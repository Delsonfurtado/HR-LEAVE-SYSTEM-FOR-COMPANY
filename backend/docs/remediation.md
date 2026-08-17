# Remediation Log

Findings discovered during design/implementation/testing, their fix and status.

| ID | Finding | Source | Remediation | Status |
|---|---|---|---|---|
| R-01 | Role taken from JWT would let stale tokens keep old privileges | Design review | `get_current_user` loads the user + role from DB on every request; token carries no role | Fixed |
| R-02 | Login could leak which emails exist (different errors) | Threat model TR-02 | Single generic 401 message for unknown user and wrong password | Fixed |
| R-03 | No brute-force protection initially | Threat model TR-01 | Lockout (5 fails / 15 min) + per ip:email rate limit (10/min) + denied audits | Fixed |
| R-04 | Tokens in localStorage vulnerable to XSS exfiltration | Secure design review | Demo uses sessionStorage + short expiry; production remediation: HttpOnly cookie for refresh token + CSRF strategy. Documented as known limitation | Planned |
| R-05 | Token revocation list in process memory lost on restart / not shared across workers | Test review (TR-09) | Accepted for dev scale; Redis-backed revocation planned for multi-worker deployment | Accepted / Planned |
| R-06 | Manager could theoretically approve their own request | STRIDE (Elevation) | Own-request check + cross-check unit/integration tests | Fixed |
| R-07 | Overlap and insufficient-balance errors returned same status | API review | Split: 409 overlap, 400 insufficient balance; documented in api-specification | Fixed |
| R-08 | Weak passwords accepted at admin-created accounts | Test TC-06 | Shared strong-password validator on UserCreate and PasswordReset schemas | Fixed |
| R-09 | Admin could lock the system by deactivating/demoting self or last admin | Design review TR-15 | Self-change blocked (400) + last-active-admin guard (409) with unit test | Fixed |
| R-10 | Denied requests were not visible in the audit trail | Secure-design (repudiation) | AuditMiddleware records every 401/403 on /api as `access.denied`; service layer logs business denials | Fixed |
| R-11 | Security headers missing | TC-38 draft | SecurityHeadersMiddleware (nosniff, DENY, CSP, no-store, Referrer-Policy) | Fixed |
| R-12 | Balance deduction race between approval paths | TR-17 | Approval re-checks remaining balance inside the same session transaction; row-level locking planned with PostgreSQL | Partially fixed |
| R-13 | Test date fixtures failed on weekends | Test run | Weekday-aligned date helper in tests (product logic unchanged) | Fixed |
| R-14 | Seed sample request could fall on weekend-only range | Implementation | Seed computes working days dynamically via the same util as the service | Fixed |
| R-15 | pip-audit reported 15 advisories (starlette via fastapi, PyJWT, pytest) | Dependency scan | Upgraded to fastapi 0.141.1 / starlette 1.6.0, PyJWT 2.13.0, pytest 9.1.1; re-ran full suite (51/51) and audit (clean) | Fixed |

## Regression policy

Every remediation above is covered by at least one automated test (see security-test-results.md);
the full suite (51 tests) must pass before merging a remediation PR.
