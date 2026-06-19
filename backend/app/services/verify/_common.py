from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.lesson import LessonState
from app.models.progress import StepState
from app.models.self_study import SelfStudyProgress, SelfStudyStepState
from app.models.verify_audit_log import VerifyAuditLog
from app.services.progress import complete_lesson_and_advance, complete_step_and_advance
from app.services.self_study_progress import complete_self_study_step_and_advance


def log_verify(
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


def pass_lesson(
    db: Session,
    progress,
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


def pass_step(
    db: Session,
    progress,
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


def pass_self_study_step(
    db: Session,
    progress: SelfStudyProgress,
    step_state: SelfStudyStepState,
    *,
    verify_result: dict | None = None,
    message: str,
    data: dict | None = None,
) -> dict:
    complete_self_study_step_and_advance(db, progress, step_state, verify_result=verify_result)
    response: dict = {"status": "passed", "message": message}
    if data:
        response["data"] = data
    return response


def touch_lesson_verify(lesson_state: LessonState) -> None:
    lesson_state.verify_attempts += 1
    lesson_state.last_verify_at = datetime.now(UTC)


def touch_step_verify(step_state: StepState) -> None:
    step_state.verify_attempts += 1
    step_state.last_verify_at = datetime.now(UTC)


def touch_self_study_verify(step_state: SelfStudyStepState) -> None:
    step_state.verify_attempts += 1
    step_state.last_verify_at = datetime.now(UTC)
