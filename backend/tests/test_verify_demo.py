from datetime import UTC, datetime
from unittest.mock import patch

import pytest

from app.config import Settings, get_settings
from app.services.demo_client import (
    ProjectMatch,
    PollResult,
    fetch_projects_once,
    poll_for_project,
)


def _auth_headers(client):
    login = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "student@training.local", "password": "learn123"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def demo_settings() -> Settings:
    return Settings(
        database_url="sqlite://",
        secret_key="test-secret",
        demo_api_base_url="https://demo.example/api/v1",
        demo_api_mock=False,
    )


def test_poll_finds_project_immediately(demo_settings):
    started_at = datetime(2026, 6, 17, 10, 0, 0, tzinfo=UTC)
    projects = [
        {
            "id": "proj-abc",
            "name": "Учебный проект",
            "created_at": "2026-06-17T10:05:12Z",
        }
    ]

    with patch("app.services.demo_client.fetch_projects_once", return_value=(projects, None, 200)):
        result = poll_for_project(
            demo_settings,
            "demo@test.local",
            "pass",
            started_at,
            sleep_fn=lambda _: None,
        )

    assert result.status == "passed"
    assert result.project == ProjectMatch(id="proj-abc", name="Учебный проект")


def test_poll_waits_until_project_appears(demo_settings):
    started_at = datetime(2026, 6, 17, 10, 0, 0, tzinfo=UTC)
    empty: list[dict] = []
    found = [
        {
            "id": "proj-new",
            "name": "Новый",
            "created_at": "2026-06-17T10:06:00Z",
        }
    ]
    responses = [(empty, None, 200), (found, None, 200)]

    def fake_fetch(*_args, **_kwargs):
        return responses.pop(0)

    with patch("app.services.demo_client.fetch_projects_once", side_effect=fake_fetch):
        result = poll_for_project(
            demo_settings,
            "demo@test.local",
            "pass",
            started_at,
            sleep_fn=lambda _: None,
        )

    assert result.status == "passed"
    assert result.project and result.project.id == "proj-new"


def test_poll_times_out_when_no_project(demo_settings):
    started_at = datetime(2026, 6, 17, 10, 0, 0, tzinfo=UTC)
    clock = {"t": 0.0}

    def monotonic():
        return clock["t"]

    def advance_sleep(_seconds):
        clock["t"] += 5

    with patch(
        "app.services.demo_client.fetch_projects_once",
        return_value=([], None, 200),
    ):
        result = poll_for_project(
            demo_settings,
            "demo@test.local",
            "pass",
            started_at,
            sleep_fn=advance_sleep,
            monotonic_fn=monotonic,
        )

    assert result.status == "failed"
    assert "не найден" in result.message.lower()


def test_poll_auth_failure(demo_settings):
    started_at = datetime(2026, 6, 17, 10, 0, 0, tzinfo=UTC)

    with patch(
        "app.services.demo_client.fetch_projects_once",
        return_value=(None, "auth_failed", 401),
    ):
        result = poll_for_project(
            demo_settings,
            "demo@test.local",
            "bad",
            started_at,
            sleep_fn=lambda _: None,
        )

    assert result.status == "failed"
    assert "войти в демо" in result.message.lower()


def test_poll_demo_unavailable_returns_pending(demo_settings):
    started_at = datetime(2026, 6, 17, 10, 0, 0, tzinfo=UTC)

    with patch(
        "app.services.demo_client.fetch_projects_once",
        return_value=(None, "unavailable", 503),
    ):
        result = poll_for_project(
            demo_settings,
            "demo@test.local",
            "pass",
            started_at,
            sleep_fn=lambda _: None,
        )

    assert result.status == "pending"


def test_fetch_projects_once_401_retry_with_httpx(demo_settings, monkeypatch):
    login_calls = {"count": 0}
    project_calls = {"count": 0}

    class FakeResponse:
        def __init__(self, status_code, payload=None):
            self.status_code = status_code
            self._payload = payload or {}

        def json(self):
            return self._payload

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def post(self, path, json=None):
            login_calls["count"] += 1
            return FakeResponse(200, {"access_token": f"token-{login_calls['count']}"})

        def get(self, path, headers=None):
            project_calls["count"] += 1
            if project_calls["count"] == 1:
                return FakeResponse(401)
            return FakeResponse(
                200,
                [{"id": "p1", "name": "X", "created_at": "2026-06-17T12:00:00Z"}],
            )

    monkeypatch.setattr("app.services.demo_client.httpx.Client", FakeClient)

    projects, error, status = fetch_projects_once(demo_settings, "demo@test.local", "pass")

    assert error is None
    assert status == 200
    assert projects and projects[0]["id"] == "p1"
    assert login_calls["count"] == 2
    assert project_calls["count"] == 2


def test_verify_step2_production_poll_passes(client, monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("DEMO_API_MOCK", "false")

    poll_result = PollResult(
        status="passed",
        message="Проект найден",
        project=ProjectMatch(id="real-proj-id", name="Реальный проект"),
        http_status=200,
    )

    with patch("app.services.verify.poll_for_project", return_value=poll_result):
        get_settings.cache_clear()
        headers = _auth_headers(client)
        module_id = "orientation-v1"

        client.post(
            f"/api/v1/learn/modules/{module_id}/steps/step-01-login-context/start",
            headers=headers,
        )
        client.post(
            f"/api/v1/learn/modules/{module_id}/steps/step-01-login-context/verify",
            headers=headers,
        )

        start = client.post(
            f"/api/v1/learn/modules/{module_id}/steps/step-02-create-project/start",
            headers=headers,
        )
        assert start.status_code == 200

        verify = client.post(
            f"/api/v1/learn/modules/{module_id}/steps/step-02-create-project/verify",
            headers=headers,
        )

    assert verify.status_code == 200
    body = verify.json()
    assert body["status"] == "passed"
    assert body["data"]["resource_id"] == "real-proj-id"
