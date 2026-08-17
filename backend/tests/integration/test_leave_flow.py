from datetime import date, timedelta

from app.utils.dates import today


def weekday_start(offset: int) -> date:
    start = today() + timedelta(days=offset)
    while start.weekday() >= 5:
        start += timedelta(days=1)
    return start


def submit(client, headers, start_offset, end_offset, leave_type_id=1, reason="Medical appointment week"):
    start = weekday_start(start_offset)
    end = start + timedelta(days=max(end_offset - start_offset, 0))
    return client.post(
        "/api/leave/requests",
        headers=headers,
        json={
            "leave_type_id": leave_type_id,
            "start_date": str(start),
            "end_date": str(end),
            "reason": reason,
        },
    )


def test_submit_creates_pending_request(client, employee_headers):
    response = submit(client, employee_headers, 14, 16)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert body["days"] >= 1
    assert body["leave_type_name"] == "Annual Leave"


def test_past_start_date_rejected(client, employee_headers):
    response = submit(client, employee_headers, -10, -5)
    assert response.status_code == 400


def test_end_before_start_rejected(client, employee_headers):
    start = weekday_start(20)
    response = client.post(
        "/api/leave/requests",
        headers=employee_headers,
        json={
            "leave_type_id": 1,
            "start_date": str(start + timedelta(days=5)),
            "end_date": str(start),
            "reason": "Invalid range test",
        },
    )
    assert response.status_code == 400


def test_overlapping_request_rejected(client, employee_headers):
    assert submit(client, employee_headers, 14, 16).status_code == 201
    response = submit(client, employee_headers, 15, 17)
    assert response.status_code == 409


def test_insufficient_balance_rejected(client, employee_headers):
    response = submit(client, employee_headers, 100, 135, reason="Long vacation request")
    assert response.status_code == 400
    assert "Insufficient balance" in response.json()["detail"]


def test_manager_approves_and_balance_decreases(client, employee_headers, manager_headers):
    created = submit(client, employee_headers, 30, 32).json()
    response = client.post(
        f"/api/manager/requests/{created['id']}/decision",
        headers=manager_headers,
        json={"action": "approve", "comment": "Approved, enjoy"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "approved"

    balances = client.get("/api/leave/balance", headers=employee_headers).json()
    annual = next(b for b in balances if b["leave_type_id"] == 1)
    assert annual["used_days"] == created["days"]


def test_manager_rejects_with_comment(client, employee2_headers, manager_headers):
    created = submit(client, employee2_headers, 40, 41).json()
    response = client.post(
        f"/api/manager/requests/{created['id']}/decision",
        headers=manager_headers,
        json={"action": "reject", "comment": "Team is short-staffed that week"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "rejected"
    assert body["decision_comment"] == "Team is short-staffed that week"


def test_double_decision_rejected(client, employee_headers, manager_headers):
    created = submit(client, employee_headers, 50, 51).json()
    first = client.post(
        f"/api/manager/requests/{created['id']}/decision",
        headers=manager_headers,
        json={"action": "approve"},
    )
    assert first.status_code == 200
    second = client.post(
        f"/api/manager/requests/{created['id']}/decision",
        headers=manager_headers,
        json={"action": "reject"},
    )
    assert second.status_code == 409


def test_cancel_own_pending_request(client, employee_headers):
    created = submit(client, employee_headers, 60, 61).json()
    response = client.post(f"/api/leave/requests/{created['id']}/cancel", headers=employee_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"

    again = client.post(f"/api/leave/requests/{created['id']}/cancel", headers=employee_headers)
    assert again.status_code == 409


def test_employee_lists_only_own_requests(client, employee_headers):
    response = client.get("/api/leave/requests", headers=employee_headers)
    assert response.status_code == 200
    for item in response.json():
        assert item["employee_id"] == 4
