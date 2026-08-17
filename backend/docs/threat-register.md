# Threat Register

Risk = Likelihood x Impact (High/Medium/Low). Status: Mitigated / Accepted / Planned.

| ID | Threat (STRIDE) | Risk | Mitigation | Status |
|---|---|---|---|---|
| TR-01 | Password brute force (S) | High | bcrypt cost, account lockout (5 fails / 15 min), per-IP+email rate limit (10/min), failed-login auditing | Mitigated |
| TR-02 | User enumeration via login errors (I) | Medium | Single generic "Invalid email or password" response for unknown user / bad password | Mitigated |
| TR-03 | Stolen/forged JWT (S/E) | High | HS256 signature verification, 30-min expiry, jti revocation on logout, refresh rotation, role read from DB not token | Mitigated |
| TR-04 | Refresh token replay (S) | Medium | Old refresh jti revoked at rotation; replay tested | Mitigated |
| TR-05 | BOLA - employee reads/cancels others' requests (I/E) | High | Owner check in service layer on every object access; 403 + audit denial | Mitigated |
| TR-06 | Manager approves own / cross-team requests (E) | High | Own-request block + department equality check + audit denial | Mitigated |
| TR-07 | Role escalation via API without permission (E) | High | `require_permission` on every admin route; RBAC test suite | Mitigated |
| TR-08 | SQL injection (T) | High | SQLAlchemy ORM parameter binding everywhere; injection attempt test passes | Mitigated |
| TR-09 | Token revocation list / rate limit is per-process (T) | Medium | In-memory set/dict; works for single-worker dev deployment. Redis-backed store planned for multi-worker production | Accepted (documented limitation) |
| TR-10 | Audit log tampering by DB access (T/R) | Medium | App writes only (no update/delete endpoints); DB-level hardening + append-only writes planned | Partially mitigated |
| TR-11 | XSS via leave reason or names (T/I) | Medium | React escaping by default; API returns application/json only; CSP `default-src 'none'` on API responses | Mitigated |
| TR-12 | CSRF on state-changing calls (T) | Low | No cookies used for auth (Bearer headers), CORS restricted to the SPA origin | Mitigated |
| TR-13 | DoS on login endpoint (D) | Medium | Rate limiting; full protection requires reverse-proxy limits in production | Partially mitigated |
| TR-14 | Privileged action without trace (R) | High | Audit service invoked in every privileged code path + denial middleware | Mitigated |
| TR-15 | Last admin deactivated/demoted -> admin lockout (D/E) | Medium | Self-change blocked; last-active-admin protection with unit test | Mitigated |
| TR-16 | SECRET_KEY leakage via repo (I) | High | `.env` git-ignored, `.env.example` documents generation, deployment secret rotation procedure | Mitigated |
| TR-17 | Leave balance manipulation via decision race (T) | Medium | Approval re-checks remaining balance; single-worker SQLite serializes the transaction | Partially mitigated (row locking planned with PostgreSQL) |
| TR-18 | Sensitive data in logs (I) | Medium | Passwords/tokens never logged; audit details store reasons and ids only | Mitigated |
