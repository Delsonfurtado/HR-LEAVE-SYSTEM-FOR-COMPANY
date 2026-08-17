# Authentication and Authorization

## 1. Authentication flow

1. `POST /api/auth/login` with `{email, password}` (JSON).
2. Rate limit check per `ip:email` (10 attempts / minute -> 429).
3. Account lockout check (locked -> 423 Locked).
4. bcrypt verification; 5 consecutive failures lock the account for 15 minutes.
5. Disabled accounts are refused (403) even with correct credentials.
6. Success returns `{access_token, refresh_token}` and writes an `auth.login` audit entry.
   Unknown user and wrong password return the same generic 401 (no enumeration).

## 2. Token design

| Claim | Value |
|---|---|
| sub | user id |
| type | "access" or "refresh" |
| iat / exp | issued / expiry (30 min access, 7 days refresh) |
| jti | unique token id used for revocation |

- Signature: HS256 with `SECRET_KEY` from environment.
- **Roles are not trusted from the token**: `get_current_user` loads the user from the database on
  every request, so deactivation/demotion takes effect immediately.
- `POST /api/auth/refresh` rotates the pair and revokes the old refresh jti (replay -> 401).
- `POST /api/auth/logout` revokes the current access token (and refresh token if provided).
  Revocation list is in-process (see limitations).

## 3. Authorization model

Two layers, both server-side:

1. **Role layer** - `require_permission("<perm>")` dependency on every route; permission sets in
   `app/core/permissions.py` (see rbac.md for the matrix).
2. **Object layer** - inside services:
   - employee -> own requests only (`leave_service.get_own_request`)
   - manager -> same department, not own requests (`leave_service.decide_request`)
   - admin self-protections (`user_service.update_user`)

## 4. Failure behavior

| Situation | Result |
|---|---|
| No/expired/tampered token | 401 + WWW-Authenticate |
| Refresh token used as access | 401 "Invalid token type" |
| Valid token, missing permission | 403 |
| Valid token, wrong object owner | 403 + denial audit |
| Inactive account | 401 on API use, 403 on login |
| Locked account | 423 on login |

## 5. Verification

- `tests/integration/test_auth_flow.py` - login/refresh/logout/rotation
- `tests/security/test_security.py` - expired/tampered/forged tokens, lockout, disabled account
- `tests/integration/test_rbac.py`, `tests/security/test_bola.py` - authorization layers
