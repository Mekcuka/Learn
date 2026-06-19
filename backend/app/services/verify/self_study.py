from sqlalchemy.orm import Session

from app.models.self_study import SelfStudyProgress, SelfStudyStep, SelfStudyStepState

from ._common import ensure_active_or_locked_response, is_manual_verify_type
from .manual import verify_manual_self_study


def run_self_study_verify(
    db: Session,
    progress: SelfStudyProgress,
    step: SelfStudyStep,
    step_state: SelfStudyStepState,
) -> dict:
    early = ensure_active_or_locked_response(
        db,
        step_state,
        locked_message="Сначала выполните предыдущие шаги",
        hint_key="hint_step_id",
        hint_id=progress.current_step_id,
    )
    if early:
        return early

    if is_manual_verify_type(step.verify_type):
        return verify_manual_self_study(db, progress, step_state)

    return {
        "status": "failed",
        "message": "Неизвестный тип проверки",
        "hint_step_id": step.id,
    }
