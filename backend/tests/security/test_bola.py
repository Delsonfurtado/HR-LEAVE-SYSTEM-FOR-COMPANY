from datetime import date, timedelta

from tests.conftest import get_tokens
from app.utils.dates import today


def weekday_start(offset: int) -> date:
    start = today() + timedelta(days=offset)
    while start.weekday() >= 5:
        start += timedelta(days=1)
    return start


def _submit(client, headers, start_offset, reason="Security test request"):
    start = weekday_start(start_offset)
    return client.post(
        "/api/leave/requests",
        headers=headers,
        json={
            "leave_type_id": 1,
            "start_date": str(start),
            "end_date": str(start + timedelta(days=1)),
            "reason": reason,
        },
    ).json()


def test_employee_cannot_read_other_employees_request(client, employee_headers, employee2_headers):
    created = _submit(client, employee_headers, 10)
    response = client.get(f"/api/leave/requests/{created['id']}", headers=employee2_headers)
    assert response.status_code == 403


def test_employee_cannot_cancel_other_employees_request(client, employee_headers, employee2_headers):
    created = _submit(client, employee_headers, 14)
    response = client.post(f"/api/leave/requests/{created['id']}/cancel", headers=employee2_headers)
    assert response.status_code == 403


def test_manager_cannot_decide_other_departments_request(client, ops_manager_headers):
    team = client.get("/api/manager/team", headers=ops_manager_headers).json()
    emails = [member["email"] for member in team]
    assert "dev@secureleave.io" not in emails

    tokens = get_tokens(client, "dev@secureleave.io", "Employee@123")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    created = _submit(client, headers, 18)
    decision = client.post(
        f"/api/manager/requests/{created['id']}/decision",
        headers=ops_manager_headers,
        json={"action": "approve"},
    )
    assert decision.status_code == 403


def test_manager_cannot_decide_own_request(client, manager_headers):
    created = _submit(client, manager_headers, 22)
    decision = client.post(
        f"/api/manager/requests/{created['id']}/decision",
        headers=manager_headers,
        json={"action": "approve"},
    )
    assert decision.status_code == 403


def test_manager_team_list_excludes_other_departments(client, ops_manager_headers):
    response = client.get("/api/manager/team", headers=ops_manager_headers)
    assert response.status_code == 200
    emails = [member["email"] for member in response.json()]
    assert "dev@secureleave.io" not in emails


def test_denied_access_is_audited(client, employee_headers, admin_headers):
    client.get("/api/admin/users", headers=employee_headers)
    response = client.get("/api/audit/logs?action=access.denied", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1
    entry = response.json()["items"][0]
    assert entry["resource_id"] == "/api/admin/users"
