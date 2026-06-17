from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.lesson import Lesson, LessonState
from app.models.progress import StepState, UserProgress
from app.models.training_account import TrainingAccount
from app.models.verify_audit_log import VerifyAuditLog
from app.services.crypto import decrypt_secret
from app.services.demo_client import POLL_INTERVAL_SECONDS, poll_for_job, poll_for_project
from app.services.progress import complete_lesson_and_advance, complete_step_and_advance, get_project_id_from_progress


def _log_verify(
    db: Session,
    *,
    verify_type: str,
    outcome: str,
    step_state: StepState | None = None,
    lesson_state: LessonState | None = None,
    demo_endpoint: str | None = None,
    http_status: int | None = None,
    response_snippet: str | None = None,
) -> None:
    db.add(
        VerifyAuditLog(
            step_state_id=step_state.id if step_state else None,
            lesson_state_id=lesson_state.id if lesson_state else None,
            verify_type=verify_type,
            demo_endpoint=demo_endpoint,
            http_status=http_status,
            outcome=outcome,
            response_snippet=response_snippet,
        )
    )


def _pass_lesson(
    db: Session,
    progress: UserProgress,
    lesson_state: LessonState,
    *,
    verify_result: dict | None = None,
    message: str,
    data: dict | None = None,
) -> dict:
    complete_lesson_and_advance(db, progress, lesson_state, verify_result=verify_result)
    response: dict = {"status": "passed", "message": message}
    if data:
        response["data"] = data
    return response


def _pass_step(
    db: Session,
    progress: UserProgress,
    step_state: StepState,
    *,
    verify_result: dict | None = None,
    message: str,
    data: dict | None = None,
) -> dict:
    complete_step_and_advance(db, progress, step_state, verify_result=verify_result)
    response: dict = {"status": "passed", "message": message}
    if data:
        response["data"] = data
    return response


def verify_manual_lesson(
    db: Session,
    progress: UserProgress,
    lesson_state: LessonState,
) -> dict:
    lesson_state.verify_attempts += 1
    lesson_state.last_verify_at = datetime.now(UTC)
    _log_verify(db, verify_type="manual", outcome="passed", lesson_state=lesson_state)
    return _pass_lesson(
        db,
        progress,
        lesson_state,
        verify_result={"passed": True},
        message="Урок выполнен",
    )


def verify_navigation_lesson(
    db: Session,
    progress: UserProgress,
    lesson: Lesson,
    lesson_state: LessonState,
) -> dict:
    config = lesson.verify_config or {}
    if config.get("fallback") == "manual":
        lesson_state.verify_attempts += 1
        lesson_state.last_verify_at = datetime.now(UTC)
        _log_verify(db, verify_type=lesson.verify_type, outcome="passed", lesson_state=lesson_state)
        return _pass_lesson(
            db,
            progress,
            lesson_state,
            verify_result={"passed": True},
            message="Навигация подтверждена",
        )

    lesson_state.verify_attempts += 1
    lesson_state.last_verify_at = datetime.now(UTC)
    _log_verify(db, verify_type=lesson.verify_type, outcome="pending", lesson_state=lesson_state)
    db.commit()
    return {
        "status": "pending",
        "message": "Подтвердите выполнение после просмотра разделов демо",
        "retry_after_seconds": None,
    }


def verify_resource_exists_lesson(
    db: Session,
    progress: UserProgress,
    lesson: Lesson,
    lesson_state: LessonState,
    training_account: TrainingAccount | None,
) -> dict:
    settings = get_settings()
    lesson_state.verify_attempts += 1
    lesson_state.last_verify_at = datetime.now(UTC)

    if not lesson_state.started_at:
        _log_verify(db, verify_type=lesson.verify_type, outcome="failed", lesson_state=lesson_state)
        db.commit()
        return {
            "status": "failed",
            "message": "Сначала начните урок",
            "hint_lesson_id": lesson.id,
        }

    if settings.demo_api_mock or not training_account:
        mock_resource_id = "mock-project-id"
        _log_verify(
            db,
            verify_type=lesson.verify_type,
            outcome="passed",
            lesson_state=lesson_state,
            demo_endpoint="GET /api/v1/projects",
        )
        return _pass_lesson(
            db,
            progress,
            lesson_state,
            verify_result={
                "passed": True,
                "resource_id": mock_resource_id,
                "resource_name": "Учебный проект (mock)",
            },
            message="Проект найден",
            data={
                "resource_id": mock_resource_id,
                "resource_name": "Учебный проект (mock)",
            },
        )

    demo_password = decrypt_secret(settings.secret_key, training_account.demo_password_encrypted)
    result = poll_for_project(
        settings,
        training_account.demo_email,
        demo_password,
        lesson_state.started_at,
    )

    outcome = result.status if result.status != "pending" else "pending"
    _log_verify(
        db,
        verify_type=lesson.verify_type,
        outcome=outcome,
        lesson_state=lesson_state,
        demo_endpoint=result.demo_endpoint,
        http_status=result.http_status,
    )

    if result.status == "passed" and result.project:
        verify_result = {
            "passed": True,
            "resource_id": result.project.id,
            "resource_name": result.project.name,
        }
        return _pass_lesson(
            db,
            progress,
            lesson_state,
            verify_result=verify_result,
            message=result.message,
            data={
                "resource_id": result.project.id,
                "resource_name": result.project.name,
            },
        )

    if result.status == "failed":
        db.commit()
        response: dict = {"status": "failed", "message": result.message}
        if result.message.startswith("Не удалось войти"):
            response["hint_lesson_id"] = "lesson-01-login-context"
        else:
            response["hint_lesson_id"] = lesson.id
        return response

    db.commit()
    return {
        "status": "pending",
        "message": result.message,
        "retry_after_seconds": POLL_INTERVAL_SECONDS,
    }


def verify_job_completed_lesson(
    db: Session,
    progress: UserProgress,
    lesson: Lesson,
    lesson_state: LessonState,
    training_account: TrainingAccount | None,
) -> dict:
    settings = get_settings()
    config = lesson.verify_config or {}
    project_id = config.get("project_id") or get_project_id_from_progress(db, progress.id)
    if not project_id:
        db.commit()
        return {
            "status": "failed",
            "message": "Сначала создайте проект в демо-приложении",
            "hint_lesson_id": "lesson-02-create-project",
        }

    lesson_state.verify_attempts += 1
    lesson_state.last_verify_at = datetime.now(UTC)

    if settings.demo_api_mock or not training_account:
        _log_verify(
            db,
            verify_type=lesson.verify_type,
            outcome="passed",
            lesson_state=lesson_state,
            demo_endpoint=f"GET /api/v1/projects/{project_id}/jobs",
        )
        return _pass_lesson(
            db,
            progress,
            lesson_state,
            verify_result={"passed": True, "job_id": "mock-job-id", "status": "completed"},
            message="Задача выполнена (mock)",
            data={"job_id": "mock-job-id", "status": "completed"},
        )

    demo_password = decrypt_secret(settings.secret_key, training_account.demo_password_encrypted)
    result = poll_for_job(
        settings,
        training_account.demo_email,
        demo_password,
        project_id=str(project_id),
        job_id=config.get("job_id"),
        job_type=config.get("job_type"),
        expected_status=str(config.get("expected_status", "completed")),
        timeout_seconds=int(config.get("timeout_seconds", 120)),
    )

    outcome = result.status if result.status != "pending" else "pending"
    _log_verify(
        db,
        verify_type=lesson.verify_type,
        outcome=outcome,
        lesson_state=lesson_state,
        demo_endpoint=result.demo_endpoint,
        http_status=result.http_status,
    )

    if result.status == "passed" and result.job:
        verify_result = {
            "passed": True,
            "job_id": result.job.id,
            "status": result.job.status,
        }
        return _pass_lesson(
            db,
            progress,
            lesson_state,
            verify_result=verify_result,
            message=result.message,
            data={"job_id": result.job.id, "status": result.job.status},
        )

    if result.status == "failed":
        db.commit()
        return {
            "status": "failed",
            "message": result.message,
            "hint_lesson_id": lesson.id,
        }

    db.commit()
    return {
        "status": "pending",
        "message": result.message,
        "retry_after_seconds": POLL_INTERVAL_SECONDS,
    }


def run_lesson_verify(
    db: Session,
    progress: UserProgress,
    lesson: Lesson,
    lesson_state: LessonState,
    training_account: TrainingAccount | None,
) -> dict:
    if lesson_state.status == "locked":
        db.commit()
        return {
            "status": "failed",
            "message": "Сначала завершите предыдущие уроки",
            "hint_lesson_id": progress.current_lesson_id,
        }

    if not lesson_state.started_at:
        lesson_state.started_at = datetime.now(UTC)
        lesson_state.status = "active"

    if lesson.verify_type == "manual":
        return verify_manual_lesson(db, progress, lesson_state)
    if lesson.verify_type == "resource_exists":
        return verify_resource_exists_lesson(db, progress, lesson, lesson_state, training_account)
    if lesson.verify_type == "navigation":
        return verify_navigation_lesson(db, progress, lesson, lesson_state)
    if lesson.verify_type == "quiz_passed":
        lesson_state.verify_attempts += 1
        lesson_state.last_verify_at = datetime.now(UTC)
        _log_verify(db, verify_type=lesson.verify_type, outcome="pending", lesson_state=lesson_state)
        db.commit()
        return {
            "status": "pending",
            "message": "Пройдите мини-квиз на этой странице",
            "retry_after_seconds": None,
        }
    if lesson.verify_type == "job_completed":
        return verify_job_completed_lesson(db, progress, lesson, lesson_state, training_account)
    return {
        "status": "failed",
        "message": "Неизвестный тип проверки",
        "hint_lesson_id": lesson.id,
    }


# --- Deprecated step-based verify (legacy API) ---

from app.models.module import Step


def verify_manual(
    db: Session,
    progress: UserProgress,
    step_state: StepState,
) -> dict:
    step_state.verify_attempts += 1
    step_state.last_verify_at = datetime.now(UTC)
    _log_verify(db, verify_type="manual", outcome="passed", step_state=step_state)
    return _pass_step(
        db,
        progress,
        step_state,
        verify_result={"passed": True},
        message="Шаг выполнен",
    )


def verify_navigation(
    db: Session,
    progress: UserProgress,
    step: Step,
    step_state: StepState,
) -> dict:
    config = step.verify_config or {}
    if config.get("fallback") == "manual":
        step_state.verify_attempts += 1
        step_state.last_verify_at = datetime.now(UTC)
        _log_verify(db, verify_type=step.verify_type, outcome="passed", step_state=step_state)
        return _pass_step(
            db,
            progress,
            step_state,
            verify_result={"passed": True},
            message="Навигация подтверждена",
        )

    step_state.verify_attempts += 1
    step_state.last_verify_at = datetime.now(UTC)
    _log_verify(db, verify_type=step.verify_type, outcome="pending", step_state=step_state)
    db.commit()
    return {
        "status": "pending",
        "message": "Подтвердите выполнение после просмотра разделов демо",
        "retry_after_seconds": None,
    }


def verify_resource_exists(
    db: Session,
    progress: UserProgress,
    step: Step,
    step_state: StepState,
    training_account: TrainingAccount | None,
) -> dict:
    settings = get_settings()
    step_state.verify_attempts += 1
    step_state.last_verify_at = datetime.now(UTC)

    if not step_state.started_at:
        _log_verify(db, verify_type=step.verify_type, outcome="failed", step_state=step_state)
        db.commit()
        return {
            "status": "failed",
            "message": "Сначала начните шаг",
            "hint_step_id": step.id,
        }

    if settings.demo_api_mock or not training_account:
        mock_resource_id = "mock-project-id"
        _log_verify(
            db,
            verify_type=step.verify_type,
            outcome="passed",
            step_state=step_state,
            demo_endpoint="GET /api/v1/projects",
        )
        return _pass_step(
            db,
            progress,
            step_state,
            verify_result={
                "passed": True,
                "resource_id": mock_resource_id,
                "resource_name": "Учебный проект (mock)",
            },
            message="Проект найден",
            data={
                "resource_id": mock_resource_id,
                "resource_name": "Учебный проект (mock)",
            },
        )

    demo_password = decrypt_secret(settings.secret_key, training_account.demo_password_encrypted)
    result = poll_for_project(
        settings,
        training_account.demo_email,
        demo_password,
        step_state.started_at,
    )

    outcome = result.status if result.status != "pending" else "pending"
    _log_verify(
        db,
        verify_type=step.verify_type,
        outcome=outcome,
        step_state=step_state,
        demo_endpoint=result.demo_endpoint,
        http_status=result.http_status,
    )

    if result.status == "passed" and result.project:
        verify_result = {
            "passed": True,
            "resource_id": result.project.id,
            "resource_name": result.project.name,
        }
        return _pass_step(
            db,
            progress,
            step_state,
            verify_result=verify_result,
            message=result.message,
            data={
                "resource_id": result.project.id,
                "resource_name": result.project.name,
            },
        )

    if result.status == "failed":
        db.commit()
        response: dict = {"status": "failed", "message": result.message}
        if result.message.startswith("Не удалось войти"):
            response["hint_step_id"] = "step-01-login-context"
        else:
            response["hint_step_id"] = step.id
        return response

    db.commit()
    return {
        "status": "pending",
        "message": result.message,
        "retry_after_seconds": POLL_INTERVAL_SECONDS,
    }


def run_verify(
    db: Session,
    progress: UserProgress,
    step: Step,
    step_state: StepState,
    training_account: TrainingAccount | None,
) -> dict:
    if step_state.status == "locked":
        db.commit()
        return {
            "status": "failed",
            "message": "Сначала выполните предыдущие шаги",
            "hint_step_id": progress.current_step_id,
        }

    if not step_state.started_at:
        step_state.started_at = datetime.now(UTC)
        step_state.status = "active"

    if step.verify_type == "manual":
        return verify_manual(db, progress, step_state)
    if step.verify_type == "resource_exists":
        return verify_resource_exists(db, progress, step, step_state, training_account)
    if step.verify_type == "navigation":
        return verify_navigation(db, progress, step, step_state)
    if step.verify_type == "quiz_passed":
        step_state.verify_attempts += 1
        step_state.last_verify_at = datetime.now(UTC)
        _log_verify(db, verify_type=step.verify_type, outcome="pending", step_state=step_state)
        db.commit()
        return {
            "status": "pending",
            "message": "Пройдите мини-квиз на этой странице",
            "retry_after_seconds": None,
        }
    return {
        "status": "failed",
        "message": "Неизвестный тип проверки",
        "hint_step_id": step.id,
    }
