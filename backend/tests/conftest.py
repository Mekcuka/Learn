import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["TESTING"] = "1"
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ.setdefault("AUTH_ENABLED", "false")
os.environ["AUTH_ENABLED"] = "true"

from app.config import get_settings
from app.db import Base, get_db
import app.db as db_module
from app.main import app
from app.seed.data import run_seed

get_settings.cache_clear()

_database_url = os.environ["DATABASE_URL"]
_use_sqlite = _database_url.startswith("sqlite")

if _use_sqlite:
    engine = create_engine(
        _database_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(_database_url)

TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db_module.engine = engine
db_module.SessionLocal = TestingSession


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    run_seed(session)
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _login_headers(client: TestClient, email: str, password: str) -> dict[str, str]:
    login = client.post(
        "/api/v1/learn/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_headers(client: TestClient) -> dict[str, str]:
    return _login_headers(client, "student@training.local", "learn123")


@pytest.fixture
def author_headers(client: TestClient) -> dict[str, str]:
    return _login_headers(client, "author@training.local", "author123")
