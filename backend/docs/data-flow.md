# Data Flow

## 1. Context diagram (Level 0)

```
                +--------------------+
   Employee --> |                    | <-- Manager
                |   Leave Management |
   HR officer ->|      System        | <-- Administrator
                +--------------------+
                         |
                    Audit log store
```

## 2. Level 1 - login flow

```
Browser                FastAPI                     Database
  |  POST /api/auth/login  |                          |
  |----------------------->|  rate-limit check (mem)  |
  |                        |  fetch user by email ---->|
  |                        |<-------------------------|
  |                        |  verify bcrypt hash       |
  |                        |  lockout check / reset    |
  |                        |  write auth.login audit ->|
  |<-----------------------|  access+refresh JWT       |
```

## 3. Level 1 - leave submission

```
Employee browser        FastAPI                     Database
  | POST /api/leave/requests |                         |
  |  (JWT Bearer)            |                         |
  |------------------------->|  decode+validate token  |
  |                          |  require leave:submit   |
  |                          |  validate dates/balance |
  |                          |  overlap query -------->|
  |                          |  balance query -------->|
  |                          |  insert request ------->|
  |                          |  write leave.submit --->|
  |<-------------------------|  201 + request JSON     |
```

## 4. Level 1 - manager decision

```
Manager browser          FastAPI                    Database
  | POST /api/manager/requests/{id}/decision |          |
  |----------------------------------------->|  decode token          |
  |                                          |  require leave:decide_team
  |                                          |  load request --------->|
  |                                          |  check: not own req    |
  |                                          |  check: same department|
  |                                          |  update status+balance >|
  |                                          |  write leave.approve ->|
  |<-----------------------------------------|  200 + updated request |
```

## 5. Trust boundaries crossed by data

| Boundary | Data crossing | Protection |
|---|---|---|
| Internet -> API | Credentials, JWTs, leave payloads | HTTPS, validation, rate limiting, lockout |
| API -> DB | All entities | ORM parameterization, unique constraints |
| API -> Audit | Actor, action, resource, IP | Append-only writes in services + middleware |

## 6. Data stores

| Store | Contents | Sensitivity |
|---|---|---|
| SQLite `users` table | Emails, bcrypt hashes, roles | Confidential |
| `leave_requests` / `leave_balances` | Personal leave data | Internal |
| `audit_logs` | Who did what, when, from where, denials | Confidential (security data) |
| Process memory | Revoked JTIs, login counters | Transient |
