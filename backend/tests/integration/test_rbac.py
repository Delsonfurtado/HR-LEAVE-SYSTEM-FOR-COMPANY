import pytest


def test_employee_cannot_access_admin_users(client, employee_headers):
    response = client.get("/api/admin/users", headers=employee_headers)
    assert response.status_code == 403


def test_hr_cannot_manage_users(client, hr_headers):
    response = client.get("/api/admin/users", headers=hr_headers)
    assert response.status_code == 403


def test_manager_cannot_view_hr_reports(client, manager_headers):
    response = client.get("/api/hr/reports/leave", headers=manager_headers)
    assert response.status_code == 403


def test_employee_cannot_view_manager_endpoints(client, employee_headers):
    response = client.get("/api/manager/requests", headers=employee_headers)
    assert response.status_code == 403


def test_employee_cannot_view_audit_logs(client, employee_headers):
    response = client.get("/api/audit/logs", headers=employee_headers)
    assert response.status_code == 403


def test_anonymous_requests_rejected(client):
    for path in [
        "/api/auth/me",
        "/api/leave/requests",
        "/api/manager/requests",
        "/api/hr/reports/leave",
        "/api/admin/users",
        "/api/audit/logs",
    ]:
        assert client.get(path).status_code == 401, path


def test_hr_can_view_audit_logs(client, hr_headers):
    response = client.get("/api/audit/logs", headers=hr_headers)
    assert response.status_code == 200


def test_admin_can_manage_users(client, admin_headers):
    response = client.get("/api/admin/users", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 7


def test_admin_cannot_deactivate_own_account(client, admin_headers):
    response = client.patch(
        "/api/admin/users/1",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert response.status_code == 400


def test_last_active_admin_protection(db_session):
    from fastapi import HTTPException

    from app.models.user import Role, User
    from app.schemas.user import UserUpdate
    from app.services import user_service

    admin = db_session.get(User, 1)
    second = User(
        email="second-admin@secureleave.io",
        hashed_password="irrelevant",
        full_name="Second Admin",
        role=Role.admin,
    )
    db_session.add(second)
    db_session.commit()
    admin.is_active = False
    db_session.commit()

    with pytest.raises(HTTPException) as excinfo:
        user_service.update_user(db_session, admin, second.id, UserUpdate(is_active=False), None)
    assert excinfo.value.status_code == 409


def test_admin_cannot_change_own_role(client, admin_headers):
    response = client.patch(
        "/api/admin/users/1",
        headers=admin_headers,
        json={"role": "employee"},
    )
    assert response.status_code == 400
