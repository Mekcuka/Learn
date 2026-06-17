"""HTTP client for read-only Demo API calls (verify engine)."""

from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import datetime

import httpx

from app.config import Settings

POLL_INTERVAL_SECONDS = 5
MAX_POLL_SECONDS = 120


class DemoApiError(Exception):
    def __init__(self, kind: str, *, http_status: int | None = None) -> None:
        self.kind = kind
        self.http_status = http_status
        super().__init__(kind)


@dataclass
class JobMatch:
    id: str
    status: str


@dataclass
class JobPollResult:
    status: str  # passed | pending | failed
    message: str
    job: JobMatch | None = None
    http_status: int | None = None
    demo_endpoint: str | None = None


@dataclass
class ProjectMatch:
    id: str
    name: str | None


@dataclass
class PollResult:
    status: str  # passed | pending | failed
    message: str
    project: ProjectMatch | None = None
    http_status: int | None = None
    demo_endpoint: str | None = None


def _parse_created_at(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _find_matching_project(projects: list[dict], started_at: datetime) -> ProjectMatch | None:
    for project in projects:
        created_at_raw = project.get("created_at")
        if not created_at_raw:
            continue
        created_at = _parse_created_at(created_at_raw)
        if created_at >= started_at:
            return ProjectMatch(id=str(project.get("id", "")), name=project.get("name"))
    return None


def _login(client: httpx.Client, email: str, password: str) -> str:
    resp = client.post("/auth/login", json={"email": email, "password": password})
    if resp.status_code >= 500:
        raise DemoApiError("unavailable", http_status=resp.status_code)
    if resp.status_code != 200:
        raise DemoApiError("auth_failed", http_status=resp.status_code)
    token = resp.json().get("access_token")
    if not token:
        raise DemoApiError("auth_failed", http_status=resp.status_code)
    return token


def _get_projects(client: httpx.Client, token: str) -> tuple[list[dict], int]:
    resp = client.get("/projects", headers={"Authorization": f"Bearer {token}"})
    if resp.status_code >= 500:
        raise DemoApiError("unavailable", http_status=resp.status_code)
    if resp.status_code == 401:
        return [], 401
    if resp.status_code != 200:
        raise DemoApiError("error", http_status=resp.status_code)
    return resp.json(), resp.status_code


def fetch_projects_once(
    settings: Settings,
    email: str,
    password: str,
    *,
    token: str | None = None,
    retried_auth: bool = False,
) -> tuple[list[dict] | None, str | None, int | None]:
    """Single Demo API round-trip. Returns (projects, error_kind, http_status)."""
    try:
        with httpx.Client(base_url=settings.demo_api_base_url, timeout=10.0) as client:
            access_token = token or _login(client, email, password)
            projects, status = _get_projects(client, access_token)
            if status == 401 and not retried_auth:
                access_token = _login(client, email, password)
                projects, status = _get_projects(client, access_token)
                if status == 401:
                    return None, "auth_failed", 401
            if status == 401:
                return None, "auth_failed", 401
            return projects, None, 200
    except httpx.RequestError:
        return None, "unavailable", None
    except DemoApiError as exc:
        return None, exc.kind, exc.http_status


def poll_for_project(
    settings: Settings,
    email: str,
    password: str,
    started_at: datetime,
    *,
    sleep_fn=time.sleep,
    monotonic_fn=time.monotonic,
) -> PollResult:
    """Poll GET /projects every 5s for up to ~2 minutes."""
    deadline = monotonic_fn() + MAX_POLL_SECONDS
    demo_endpoint = "GET /api/v1/projects"

    while True:
        projects, error_kind, http_status = fetch_projects_once(settings, email, password)

        if error_kind == "auth_failed":
            return PollResult(
                status="failed",
                message="Не удалось войти в демо под учебным аккаунтом",
                http_status=http_status,
                demo_endpoint="POST /auth/login",
            )
        if error_kind == "unavailable":
            return PollResult(
                status="pending",
                message="Демо-приложение временно недоступно. Попробуйте позже.",
                http_status=http_status,
                demo_endpoint=demo_endpoint,
            )
        if error_kind == "error":
            return PollResult(
                status="pending",
                message="Демо-приложение временно недоступно. Попробуйте позже.",
                http_status=http_status,
                demo_endpoint=demo_endpoint,
            )

        match = _find_matching_project(projects or [], started_at)
        if match:
            return PollResult(
                status="passed",
                message="Проект найден",
                project=match,
                http_status=http_status,
                demo_endpoint=demo_endpoint,
            )

        remaining = deadline - monotonic_fn()
        if remaining <= 0:
            return PollResult(
                status="failed",
                message=(
                    "Проект не найден. Убедитесь, что вы создали проект под учебным аккаунтом."
                ),
                http_status=http_status,
                demo_endpoint=demo_endpoint,
            )

        sleep_fn(min(POLL_INTERVAL_SECONDS, remaining))


def _get_project_jobs(client: httpx.Client, token: str, project_id: str, *, limit: int = 30) -> tuple[dict | None, int]:
    resp = client.get(
        f"/projects/{project_id}/jobs",
        params={"limit": limit},
        headers={"Authorization": f"Bearer {token}"},
    )
    if resp.status_code >= 500:
        raise DemoApiError("unavailable", http_status=resp.status_code)
    if resp.status_code == 401:
        return None, 401
    if resp.status_code != 200:
        raise DemoApiError("error", http_status=resp.status_code)
    return resp.json(), resp.status_code


def _get_job(client: httpx.Client, token: str, project_id: str, job_id: str) -> tuple[dict | None, int]:
    resp = client.get(
        f"/projects/{project_id}/jobs/{job_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    if resp.status_code >= 500:
        raise DemoApiError("unavailable", http_status=resp.status_code)
    if resp.status_code == 401:
        return None, 401
    if resp.status_code == 404:
        return None, 404
    if resp.status_code != 200:
        raise DemoApiError("error", http_status=resp.status_code)
    return resp.json(), resp.status_code


def _job_is_completed(job: dict, expected_status: str) -> bool:
    status = str(job.get("status", "")).lower()
    expected = expected_status.lower()
    if expected in {"completed", "success"}:
        return status in {"completed", "success", "done", "succeeded"}
    return status == expected


def poll_for_job(
    settings: Settings,
    email: str,
    password: str,
    *,
    project_id: str,
    job_id: str | None = None,
    job_type: str | None = None,
    expected_status: str = "completed",
    timeout_seconds: int = MAX_POLL_SECONDS,
    sleep_fn=time.sleep,
    monotonic_fn=time.monotonic,
) -> JobPollResult:
    deadline = monotonic_fn() + timeout_seconds
    demo_endpoint = f"GET /api/v1/projects/{project_id}/jobs"

    while True:
        try:
            with httpx.Client(base_url=settings.demo_api_base_url, timeout=10.0) as client:
                token = _login(client, email, password)
                if job_id:
                    job_payload, status = _get_job(client, token, project_id, job_id)
                    demo_endpoint = f"GET /api/v1/projects/{project_id}/jobs/{job_id}"
                    if status == 401:
                        return JobPollResult(
                            status="failed",
                            message="Не удалось войти в демо под учебным аккаунтом",
                            http_status=status,
                            demo_endpoint="POST /auth/login",
                        )
                    if status == 404:
                        job_payload = None
                    else:
                        jobs = [job_payload] if job_payload else []
                        status = 200
                else:
                    payload, status = _get_project_jobs(client, token, project_id)
                    if status == 401:
                        return JobPollResult(
                            status="failed",
                            message="Не удалось войти в демо под учебным аккаунтом",
                            http_status=status,
                            demo_endpoint="POST /auth/login",
                        )
                    jobs = (payload or {}).get("items", []) if payload else []
        except httpx.RequestError:
            return JobPollResult(
                status="pending",
                message="Демо-приложение временно недоступно. Попробуйте позже.",
                demo_endpoint=demo_endpoint,
            )
        except DemoApiError as exc:
            if exc.kind == "unavailable":
                return JobPollResult(
                    status="pending",
                    message="Демо-приложение временно недоступно. Попробуйте позже.",
                    http_status=exc.http_status,
                    demo_endpoint=demo_endpoint,
                )
            return JobPollResult(
                status="failed",
                message="Не удалось проверить статус задачи в демо",
                http_status=exc.http_status,
                demo_endpoint=demo_endpoint,
            )

        candidate = None
        for job in jobs:
            if job_id and str(job.get("id")) != job_id:
                continue
            if job_type and job.get("job_type") != job_type:
                continue
            candidate = job
            if job_id:
                break

        if candidate and _job_is_completed(candidate, expected_status):
            return JobPollResult(
                status="passed",
                message="Задача выполнена",
                job=JobMatch(id=str(candidate.get("id", "")), status=str(candidate.get("status", ""))),
                demo_endpoint=demo_endpoint,
            )

        remaining = deadline - monotonic_fn()
        if remaining <= 0:
            return JobPollResult(
                status="failed",
                message="Задача не завершилась в отведённое время. Проверьте журнал задач в демо.",
                demo_endpoint=demo_endpoint,
            )

        sleep_fn(min(POLL_INTERVAL_SECONDS, remaining))
