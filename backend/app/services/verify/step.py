from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.module import Step
from app.models.progress import StepState, UserProgress

from .manual import verify_manual
from .quiz_passed import verify_quiz_passed_step

_LEGACY_MANUAL_TYPES = frozenset({"resource_exists", "navigation", "job_completed"})


def run_verify(
    db: Session,
    progress: UserProgress,
    step: Step,
    step_state: StepState,
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

    if step.verify_type in ("manual", *_LEGACY_MANUAL_TYPES):
        return verify_manual(db, progress, step_state)
    if step.verify_type == "quiz_passed":
        return verify_quiz_passed_step(db, step, step_state)
    return {
        "status": "failed",
        "message": "Неизвестный тип проверки",
        "hint_step_id": step.id,
    }
