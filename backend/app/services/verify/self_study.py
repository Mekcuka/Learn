from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.self_study import SelfStudyProgress, SelfStudyStep, SelfStudyStepState

from .manual import verify_manual_self_study

_LEGACY_MANUAL_TYPES = frozenset({"resource_exists", "navigation", "job_completed"})


def run_self_study_verify(
    db: Session,
    progress: SelfStudyProgress,
    step: SelfStudyStep,
    step_state: SelfStudyStepState,
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
        return verify_manual_self_study(db, progress, step_state)

    return {
        "status": "failed",
        "message": "Неизвестный тип проверки",
        "hint_step_id": step.id,
    }
