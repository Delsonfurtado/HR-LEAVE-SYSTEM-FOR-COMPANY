from datetime import date

import pytest

from app.core.permissions import has_permission
from app.core.security import create_access_token, decode_token, hash_password, verify_password
from app.schemas.user import UserCreate
from app.utils.dates import overlaps, working_days
from pydantic import ValidationError


def test_working_days_counts_weekdays_only():
    assert working_days(date(2026, 8, 17), date(2026, 8, 21)) == 5
    assert working_days(date(2026, 8, 22), date(2026, 8, 23)) == 0
    assert working_days(date(2026, 8, 21), date(2026, 8, 23)) == 1


def test_overlaps_detects_ranges():
    assert overlaps(date(2026, 1, 10), date(2026, 1, 15), date(2026, 1, 14), date(2026, 1, 20))
    assert not overlaps(date(2026, 1, 1), date(2026, 1, 5), date(2026, 1, 6), date(2026, 1, 10))


def test_password_hash_roundtrip():
    hashed = hash_password("Secret@123")
    assert hashed != "Secret@123"
    assert verify_password("Secret@123", hashed)
    assert not verify_password("Wrong@123", hashed)


def test_token_roundtrip():
    token = create_access_token(42)
    payload = decode_token(token)
    assert payload["sub"] == "42"
    assert payload["type"] == "access"


def test_permission_matrix():
    assert has_permission("employee", "leave:submit")
    assert not has_permission("employee", "users:manage")
    assert has_permission("manager", "leave:decide_team")
    assert not has_permission("manager", "reports:view")
    assert has_permission("hr", "reports:view")
    assert not has_permission("hr", "users:manage")
    assert has_permission("admin", "users:manage")
    assert not has_permission("unknown_role", "leave:submit")


def test_weak_passwords_rejected():
    with pytest.raises(ValidationError):
        UserCreate(
            email="x@y.io",
            full_name="Test User",
            password="short1A",
            role="employee",
        )
    with pytest.raises(ValidationError):
        UserCreate(
            email="x@y.io",
            full_name="Test User",
            password="alllowercase1",
            role="employee",
        )
    ok = UserCreate(
        email="x@y.io",
        full_name="Test User",
        password="Good@1234",
        role="employee",
    )
    assert ok.password == "Good@1234"
