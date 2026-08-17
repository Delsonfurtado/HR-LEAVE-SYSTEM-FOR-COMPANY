from tests.conftest import get_tokens


def test_login_success_returns_token_pair(client):
    tokens = get_tokens(client, "dev@secureleave.io", "Employee@123")
    assert tokens["access_token"]
    assert tokens["refresh_token"]
    assert tokens["token_type"] == "bearer"


def test_login_wrong_password(client):
    response = client.post("/api/auth/login", json={"email": "dev@secureleave.io", "password": "Wrong@999"})
    assert response.status_code == 401


def test_login_unknown_user(client):
    response = client.post("/api/auth/login", json={"email": "ghost@secureleave.io", "password": "Whatever@1"})
    assert response.status_code == 401


def test_me_returns_current_user(client, employee_headers):
    response = client.get("/api/auth/me", headers=employee_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "dev@secureleave.io"
    assert body["role"] == "employee"
    assert body["department_name"] == "Engineering"


def test_refresh_rotates_tokens(client):
    tokens = get_tokens(client, "dev@secureleave.io", "Employee@123")
    response = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert response.status_code == 200
    new_tokens = response.json()
    assert new_tokens["access_token"] != tokens["access_token"]

    replay = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert replay.status_code == 401


def test_logout_revokes_access_token(client):
    tokens = get_tokens(client, "dev@secureleave.io", "Employee@123")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    response = client.post(
        "/api/auth/logout",
        headers=headers,
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert response.status_code == 200
    assert client.get("/api/auth/me", headers=headers).status_code == 401
    replay = client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert replay.status_code == 401


def test_audit_trail_records_login(client):
    get_tokens(client, "dev@secureleave.io", "Employee@123")
    from tests.conftest import make_headers

    admin_headers = make_headers(client, "admin@secureleave.io", "Admin@123")
    response = client.get("/api/audit/logs?action=auth.login&status=success", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1
