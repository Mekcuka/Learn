from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.self_study import SelfStudyProgress, SelfStudyStep, SelfStudyStepState


def count_completed_self_study_steps(db: Session, progress_id: UUID) -> int:
    return (
        db.query(SelfStudyStepState)
        .filter(
            SelfStudyStepState.self_study_progress_id == progress_id,
            SelfStudyStepState.status == "completed",
        )
        .count()
    )


def refresh_self_study_progress_percent(db: Session, progress: SelfStudyProgress) -> None:
    total = (
        db.query(SelfStudyStep)
        .filter(SelfStudyStep.assignment_id == progress.assignment_id)
        .count()
    )
    completed = count_completed_self_study_steps(db, progress.id)
    progress.progress_percent = int((completed / total) * 100) if total else 0


def get_project_id_from_self_study_progress(db: Session, progress_id: UUID) -> str | None:
    step_state = (
        db.query(SelfStudyStepState)
        .filter(
            SelfStudyStepState.self_study_progress_id == progress_id,
            SelfStudyStepState.step_id == "ss-step-01-create-project",
            SelfStudyStepState.status == "completed",
        )
        .first()
    )
    if step_state and step_state.verify_result:
        return step_state.verify_result.get("resource_id")
    return None


def get_or_create_self_study_progress(
    db: Session, user_id: UUID, assignment_id: str
) -> SelfStudyProgress:
    progress = (
        db.query(SelfStudyProgress)
        .filter(
            SelfStudyProgress.user_id == user_id,
            SelfStudyProgress.assignment_id == assignment_id,
        )
        .first()
    )
    if progress:
        _ensure_self_study_step_states(db, progress, assignment_id)
        return progress

    steps = (
        db.query(SelfStudyStep)
        .filter(SelfStudyStep.assignment_id == assignment_id)
        .order_by(SelfStudyStep.sort_order)
        .all()
    )
    first_step_id = steps[0].id if steps else None
    progress = SelfStudyProgress(
        user_id=user_id,
        assignment_id=assignment_id,
        status="not_started",
        current_step_id=first_step_id,
        progress_percent=0,
    )
    db.add(progress)
    db.flush()

    for index, step in enumerate(steps):
        status = "active" if index == 0 else "locked"
        db.add(
            SelfStudyStepState(
                self_study_progress_id=progress.id,
                step_id=step.id,
                status=status,
            )
        )

    db.commit()
    db.refresh(progress)
    return progress


def get_or_create_self_study_progress_map(
    db: Session, user_id: UUID, assignment_ids: list[str]
) -> dict[str, SelfStudyProgress]:
    if not assignment_ids:
        return {}

    progress_map = {
        progress.assignment_id: progress
        for progress in db.query(SelfStudyProgress)
        .filter(
            SelfStudyProgress.user_id == user_id,
            SelfStudyProgress.assignment_id.in_(assignment_ids),
        )
        .all()
    }
    for assignment_id in assignment_ids:
        if assignment_id not in progress_map:
            progress_map[assignment_id] = get_or_create_self_study_progress(db, user_id, assignment_id)
    return progress_map


def _ensure_self_study_step_states(
    db: Session, progress: SelfStudyProgress, assignment_id: str
) -> None:
    existing = (
        db.query(SelfStudyStepState)
        .filter(SelfStudyStepState.self_study_progress_id == progress.id)
        .count()
    )
    if existing:
        return

    steps = (
        db.query(SelfStudyStep)
        .filter(SelfStudyStep.assignment_id == assignment_id)
        .order_by(SelfStudyStep.sort_order)
        .all()
    )
    if not steps:
        return

    if not progress.current_step_id:
        progress.current_step_id = steps[0].id

    for index, step in enumerate(steps):
        status = "active" if index == 0 else "locked"
        db.add(
            SelfStudyStepState(
                self_study_progress_id=progress.id,
                step_id=step.id,
                status=status,
            )
        )
    db.commit()


def complete_self_study_step_and_advance(
    db: Session,
    progress: SelfStudyProgress,
    step_state: SelfStudyStepState,
    *,
    verify_result: dict | None = None,
) -> None:
    now = datetime.now(UTC)
    step_state.status = "completed"
    step_state.completed_at = now
    if not step_state.started_at:
        step_state.started_at = now
    if verify_result is not None:
        step_state.verify_result = verify_result

    if progress.status == "not_started":
        progress.status = "in_progress"
        progress.started_at = now

    current_step = db.get(SelfStudyStep, step_state.step_id)
    next_step = (
        db.query(SelfStudyStep)
        .filter(
            SelfStudyStep.assignment_id == progress.assignment_id,
            SelfStudyStep.sort_order > current_step.sort_order,
        )
        .order_by(SelfStudyStep.sort_order)
        .first()
    )

    if next_step:
        progress.current_step_id = next_step.id
        next_state = (
            db.query(SelfStudyStepState)
            .filter(
                SelfStudyStepState.self_study_progress_id == progress.id,
                SelfStudyStepState.step_id == next_step.id,
            )
            .first()
        )
        if next_state and next_state.status == "locked":
            next_state.status = "active"
    else:
        progress.current_step_id = None
        progress.status = "completed"
        progress.completed_at = now
        progress.progress_percent = 100

    if progress.status != "completed":
        db.flush()
        refresh_self_study_progress_percent(db, progress)

    db.commit()
