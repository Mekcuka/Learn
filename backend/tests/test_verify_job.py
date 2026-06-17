from datetime import UTC, datetime

from app.config import get_settings
from app.models.lesson import Lesson, LessonState
from app.models.user import User
from app.services.progress import get_or_create_progress


def _auth_headers(client):
    login = client.post(
        "/api/v1/learn/auth/login",
        json={"email": "student@training.local", "password": "learn123"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_job_completed_verify_mock(client, db_session, monkeypatch):
    monkeypatch.setenv("DEMO_API_MOCK", "true")
    get_settings.cache_clear()
    headers = _auth_headers(client)
    user = db_session.query(User).filter(User.email == "student@training.local").one()
    progress = get_or_create_progress(db_session, user.id, "orientation-v1")

    now = datetime.now(UTC)
    for lesson_id in [
        "lesson-01-login-context",
        "lesson-02-create-project",
        "lesson-03-navigation",
    ]:
        state = (
            db_session.query(LessonState)
            .filter(LessonState.user_progress_id == progress.id, LessonState.lesson_id == lesson_id)
            .one()
        )
        state.status = "completed"
        state.completed_at = now
        state.started_at = now
        if lesson_id == "lesson-02-create-project":
            state.verify_result = {"passed": True, "resource_id": "mock-project-id"}

    journal_state = (
        db_session.query(LessonState)
        .filter(
            LessonState.user_progress_id == progress.id,
            LessonState.lesson_id == "lesson-04-job-journal",
        )
        .one()
    )
    journal_state.status = "active"
    journal_state.started_at = now

    lesson = db_session.get(Lesson, "lesson-04-job-journal")
    lesson.verify_type = "job_completed"
    lesson.verify_config = {"expected_status": "completed"}
    db_session.commit()
    db_session.expire_all()

    response = client.post("/api/v1/learn/lessons/lesson-04-job-journal/verify", headers=headers)
    assert response.status_code == 200, response.json()
    assert response.json()["status"] == "passed"
