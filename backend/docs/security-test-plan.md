# Security Test Plan

## 1. Scope

Automated: pytest suites under `tests/` (unit, integration, security).
Manual: final demonstration script (root README section "Final demonstration") + dependency scanning.

## 2. Test cases

| ID | Type | Description | Automated test |
|---|---|---|---|
| TC-01 | Unit | Working-day calculation excludes weekends | test_working_days_counts_weekdays_only |
| TC-02 | Unit | Date overlap detection | test_overlaps_detects_ranges |
| TC-03 | Unit | Password hash/verify roundtrip, no plaintext | test_password_hash_roundtrip |
| TC-04 | Unit | JWT create/decode roundtrip | test_token_roundtrip |
| TC-05 | Unit | Permission matrix per role | test_permission_matrix |
| TC-06 | Unit | Password policy rejects weak passwords | test_weak_passwords_rejected |
| TC-07 | Integration | Login returns token pair | test_login_success_returns_token_pair |
| TC-08 | Integration | Wrong password / unknown user -> 401 generic | test_login_wrong_password, test_login_unknown_user |
| TC-09 | Integration | Refresh rotates tokens, replay blocked | test_refresh_rotates_tokens |
| TC-10 | Integration | Logout revokes access + refresh | test_logout_revokes_access_token |
| TC-11 | Integration | Login success audited | test_audit_trail_records_login |
| TC-12 | Integration | Submit creates pending request | test_submit_creates_pending_request |
| TC-13 | Integration | Past / inverted dates rejected | test_past_start_date_rejected, test_end_before_start_rejected |
| TC-14 | Integration | Overlapping request rejected (409) | test_overlapping_request_rejected |
| TC-15 | Integration | Insufficient balance rejected | test_insufficient_balance_rejected |
| TC-16 | Integration | Approve deducts balance | test_manager_approves_and_balance_decreases |
| TC-17 | Integration | Reject records comment | test_manager_rejects_with_comment |
| TC-18 | Integration | Double decision blocked (409) | test_double_decision_rejected |
| TC-19 | Integration | Cancel own pending only | test_cancel_own_pending_request |
| TC-20 | Integration | Employees see only own requests | test_employee_lists_only_own_requests |
| TC-21 | RBAC | Employee/HR/manager blocked from each other's admin/HR/manager endpoints | test_rbac.py suite |
| TC-22 | RBAC | Anonymous calls -> 401 on all protected paths | test_anonymous_requests_rejected |
| TC-23 | RBAC | Admin self-deactivation / self-role-change blocked; last-admin protected | test_admin_cannot_deactivate_own_account, test_last_active_admin_protection |
| TC-24 | BOLA | Employee cannot read/cancel another employee's request | test_bola.py |
| TC-25 | BOLA | Manager cannot decide cross-department request | test_manager_cannot_decide_other_departments_request |
| TC-26 | BOLA | Manager cannot decide own request | test_manager_cannot_decide_own_request |
| TC-27 | BOLA | Denied access produces audit entry | test_denied_access_is_audited |
| TC-28 | Token | Expired token -> 401 | test_expired_token_rejected |
| TC-29 | Token | Tampered signature -> 401 | test_tampered_signature_rejected |
| TC-30 | Token | Refresh token as access -> 401 | test_refresh_token_cannot_be_used_as_access_token |
| TC-31 | Token | Wrong-key forged token -> 401 | test_wrong_signing_key_rejected |
| TC-32 | Token | Missing token -> 401 | test_missing_token_rejected |
| TC-33 | Lockout | 5 failed logins lock account (423) | test_account_lockout_after_failed_logins |
| TC-34 | Account | Disabled account cannot log in (403) | test_disabled_account_cannot_login |
| TC-35 | Injection | SQL injection in credentials harmless | test_sql_injection_in_credentials_is_harmless |
| TC-36 | XSS | Script payload stored as text, JSON-only response | test_xss_payload_stored_safely |
| TC-37 | Validation | Malformed payloads -> 422 | test_input_validation_rejects_bad_payloads |
| TC-38 | Headers | Security headers present | test_security_headers_present |
| TC-39 | Manual | Dependency scan (pip-audit) | dependency-scan.md |
| TC-40 | Manual | Six denied/invalid demo workflows | Root README demonstration script |

## 3. Execution

```bash
cd backend
python -m pytest -q
pip-audit -r requirements.txt
```

## 4. Entry/exit criteria

- Entry: application boots, DB seeded, venv installed.
- Exit: all automated tests pass, pip-audit shows no known vulnerabilities for the pinned set,
  manual demo script completes with expected results.
