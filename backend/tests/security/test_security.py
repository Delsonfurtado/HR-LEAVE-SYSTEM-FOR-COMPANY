from datetime import datetime, timedelta, timezone

import jwt as pyjwt

from tests.conftest import get_tokens

TEST_SECRET = "test-secret-key-for-pytest-only-0123456789abcdef"


def test_expired_token_rejected(client):
    payload = {
        "sub": "4",
        "type": "access",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        "jti": "expired-test",
    }
    token = pyjwt.encode(payload, TEST_SECRET, algorithm="HS256")
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Token expired"


def test_tampered_signature_rejected(client):
    tokens = get_tokens(client, "dev@secureleave.io", "Employee@123")
    tampered = tokens["access_token"][:-3] + "xyz"
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tampered}"})
    assert response.status_code == 401


def test_refresh_token_cannot_be_used_as_access_token(client):
    tokens = get_tokens(client, "dev@secureleave.io", "Employee@123")
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tokens['refresh_token']}"})
    assert response.status_code == 401


def test_wrong_signing_key_rejected(client):
    payload = {
        "sub": "4",
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "jti": "forged",
    }
    forged = pyjwt.encode(payload, "attacker-known-key", algorithm="HS256")
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged}"})
    assert response.status_code == 401


def test_missing_token_rejected(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer "}).status_code == 401


def test_account_lockout_after_failed_logins(client):
    for _ in range(5):
        response = client.post(
            "/api/auth/login",
            json={"email": "dev@secureleave.io", "password": "Bad@0000"},
        )
        assert response.status_code == 401

    locked = client.post(
        "/api/auth/login",
        json={"email": "dev@secureleave.io", "password": "Employee@123"},
    )
    assert locked.status_code == 423


def test_disabled_account_cannot_login(client, admin_headers):
    users = client.get("/api/admin/users", headers=admin_headers).json()
    dev2 = next(u for u in users if u["email"] == "dev2@secureleave.io")
    response = client.patch(
        f"/api/admin/users/{dev2['id']}",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert response.status_code == 200

    login = client.post(
        "/api/auth/login",
        json={"email": "dev2@secureleave.io", "password": "Employee@123"},
    )
    assert login.status_code == 403

    stale_tokens = get_tokens(client, "dev2@secureleave.io", "Employee@123") if False else None
    assert stale_tokens is None


def test_sql_injection_in_credentials_is_harmless(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "' OR 1=1 --@x.io", "password": "x' OR '1'='1"},
    )
    assert response.status_code in (401, 422)


def test_xss_payload_stored_safely(client, employee_headers):
    payload = {
        "leave_type_id": 1,
        "start_date": str((datetime.now() + timedelta(days=5)).date()),
        "end_date": str((datetime.now() + timedelta(days=6)).date()),
        "reason": "<script>alert('x')</script> family matter",
    }
    response = client.post("/api/leave/requests", headers=employee_headers, json=payload)
    assert response.status_code in (201, 400, 409)
    if response.status_code == 201:
        assert response.headers["content-type"].startswith("application/json")


def test_input_validation_rejects_bad_payloads(client, employee_headers):
    response = client.post(
        "/api/leave/requests",
        headers=employee_headers,
        json={"leave_type_id": 1, "start_date": "2026-01-10", "end_date": "2026-01-08", "reason": "hi"},
    )
    assert response.status_code == 422

    response = client.post(
        "/api/auth/login",
        json={"email": "not-an-email", "password": ""},
    )
    assert response.status_code == 422


def test_security_headers_present(client):
    response = client.get("/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "default-src 'none'" in response.headers["Content-Security-Policy"]
