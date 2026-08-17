import os

os.environ.setdefault("ENV", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only-0123456789abcdef")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.db as database
from app.db import Base, get_db
from app.main import app
from app.seed import run_seed


@pytest.fixture()
def db_session(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    monkeypatch.setattr(database, "SessionLocal", testing_session_factory)
    Base.metadata.create_all(engine)
    session = testing_session_factory()
    run_seed(session)
    yield session
    session.close()
    Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def get_tokens(client, email, password):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()


def make_headers(client, email, password):
    tokens = get_tokens(client, email, password)
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.fixture()
def admin_headers(client):
    return make_headers(client, "admin@secureleave.io", "Admin@123")


@pytest.fixture()
def hr_headers(client):
    return make_headers(client, "hr@secureleave.io", "Hr@12345")


@pytest.fixture()
def manager_headers(client):
    return make_headers(client, "eng.manager@secureleave.io", "Manager@123")


@pytest.fixture()
def employee_headers(client):
    return make_headers(client, "dev@secureleave.io", "Employee@123")


@pytest.fixture()
def employee2_headers(client):
    return make_headers(client, "dev2@secureleave.io", "Employee@123")


@pytest.fixture()
def ops_manager_headers(client):
    return make_headers(client, "ops.manager@secureleave.io", "Manager@123")


@pytest.fixture()
def ops_headers(client):
    return make_headers(client, "ops.worker@secureleave.io", "Employee@123")
