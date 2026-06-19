from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.lesson import Lesson
from app.models.module import Step
from app.models.progress import StepState, UserProgress
from app.models.lesson import LessonState

# Deprecated step id → lesson id (same content)
STEP_TO_LESSON_ID: dict[str, str] = {
    "step-01-login-context": "lesson-01-login-context",
    "step-02-create-project": "lesson-02-create-project",
    "step-03-navigation": "lesson-03-navigation",
    "step-04-job-journal": "lesson-04-job-journal",
    "step-05-mini-quiz": "lesson-05-mini-quiz",
}

LESSON_TO_STEP_ID = {v: k for k, v in STEP_TO_LESSON_ID.items()}


def lesson_id_from_step_id(step_id: str) -> str | None:
    return STEP_TO_LESSON_ID.get(step_id)


def step_id_from_lesson_id(lesson_id: str) -> str | None:
    return LESSON_TO_STEP_ID.get(lesson_id)


def get_or_create_progress(db: Session, user_id: UUID, module_id: str) -> UserProgress:
    progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id, UserProgress.module_id == module_id)
        .first()
    )
    if progress:
        _ensure_lesson_states(db, progress, module_id)
        return progress

    lessons = db.query(Lesson).filter(Lesson.module_id == module_id).order_by(Lesson.sort_order).all()
    first_lesson_id = lessons[0].id if lessons else None
    progress = UserProgress(
        user_id=user_id,
        module_id=module_id,
        status="not_started",
        current_lesson_id=first_lesson_id,
        current_step_id=step_id_from_lesson_id(first_lesson_id) if first_lesson_id else None,
        progress_percent=0,
    )
    db.add(progress)
    db.flush()

    for index, lesson in enumerate(lessons):
        status = "active" if index == 0 else "locked"
        db.add(
            LessonState(
                user_progress_id=progress.id,
                lesson_id=lesson.id,
                status=status,
            )
        )

    # Deprecated step_states for legacy API
    steps = db.query(Step).filter(Step.module_id == module_id).order_by(Step.sort_order).all()
    for index, step in enumerate(steps):
        status = "active" if index == 0 else "locked"
        db.add(
            StepState(
                user_progress_id=progress.id,
                step_id=step.id,
                status=status,
            )
        )

    db.commit()
    db.refresh(progress)
    return progress


def get_or_create_progress_map(
    db: Session, user_id: UUID, module_ids: list[str]
) -> dict[str, UserProgress]:
    if not module_ids:
        return {}

    progress_map = {
        progress.module_id: progress
        for progress in db.query(UserProgress)
        .filter(UserProgress.user_id == user_id, UserProgress.module_id.in_(module_ids))
        .all()
    }
    for module_id in module_ids:
        if module_id not in progress_map:
            progress_map[module_id] = get_or_create_progress(db, user_id, module_id)
    return progress_map


def _ensure_lesson_states(db: Session, progress: UserProgress, module_id: str) -> None:
    existing = (
        db.query(LessonState)
        .filter(LessonState.user_progress_id == progress.id)
        .count()
    )
    if existing:
        return

    lessons = db.query(Lesson).filter(Lesson.module_id == module_id).order_by(Lesson.sort_order).all()
    if not lessons:
        return

    if not progress.current_lesson_id:
        progress.current_lesson_id = lessons[0].id

    for index, lesson in enumerate(lessons):
        status = "active" if index == 0 else "locked"
        db.add(
            LessonState(
                user_progress_id=progress.id,
                lesson_id=lesson.id,
                status=status,
            )
        )
    db.commit()


def count_completed_lessons(db: Session, progress_id: UUID) -> int:
    return (
        db.query(LessonState)
        .filter(LessonState.user_progress_id == progress_id, LessonState.status == "completed")
        .count()
    )


def count_completed_steps(db: Session, progress_id: UUID) -> int:
    return (
        db.query(StepState)
        .filter(StepState.user_progress_id == progress_id, StepState.status == "completed")
        .count()
    )


def get_project_id_from_progress(db: Session, progress_id: UUID) -> str | None:
    lesson_state = (
        db.query(LessonState)
        .filter(
            LessonState.user_progress_id == progress_id,
            LessonState.lesson_id == "lesson-02-create-project",
            LessonState.status == "completed",
        )
        .first()
    )
    if lesson_state and lesson_state.verify_result:
        return lesson_state.verify_result.get("resource_id")
    return None


def refresh_progress_percent(db: Session, progress: UserProgress) -> None:
    total = (
        db.query(Lesson)
        .filter(Lesson.module_id == progress.module_id, Lesson.is_optional.is_(False))
        .count()
    )
    completed = count_completed_lessons(db, progress.id)
    progress.progress_percent = int((completed / total) * 100) if total else 0


def complete_lesson_and_advance(
    db: Session,
    progress: UserProgress,
    lesson_state: LessonState,
    *,
    verify_result: dict | None = None,
) -> None:
    now = datetime.now(UTC)
    lesson_state.status = "completed"
    lesson_state.completed_at = now
    if not lesson_state.started_at:
        lesson_state.started_at = now
    if verify_result is not None:
        lesson_state.verify_result = verify_result

    if progress.status == "not_started":
        progress.status = "in_progress"
        progress.started_at = now

    current_lesson = db.get(Lesson, lesson_state.lesson_id)
    next_lesson = (
        db.query(Lesson)
        .filter(
            Lesson.module_id == progress.module_id,
            Lesson.sort_order > current_lesson.sort_order,
        )
        .order_by(Lesson.sort_order)
        .first()
    )

    if next_lesson:
        progress.current_lesson_id = next_lesson.id
        progress.current_step_id = step_id_from_lesson_id(next_lesson.id)
        next_state = (
            db.query(LessonState)
            .filter(
                LessonState.user_progress_id == progress.id,
                LessonState.lesson_id == next_lesson.id,
            )
            .first()
        )
        if next_state and next_state.status == "locked":
            next_state.status = "active"

        # Sync deprecated step state
        step_id = step_id_from_lesson_id(next_lesson.id)
        if step_id:
            next_step_state = (
                db.query(StepState)
                .filter(
                    StepState.user_progress_id == progress.id,
                    StepState.step_id == step_id,
                )
                .first()
            )
            if next_step_state and next_step_state.status == "locked":
                next_step_state.status = "active"
    else:
        progress.current_lesson_id = None
        progress.current_step_id = None
        progress.status = "completed"
        progress.completed_at = now
        progress.progress_percent = 100

    # Sync completed step state for deprecated API
    step_id = step_id_from_lesson_id(lesson_state.lesson_id)
    if step_id:
        step_state = (
            db.query(StepState)
            .filter(
                StepState.user_progress_id == progress.id,
                StepState.step_id == step_id,
            )
            .first()
        )
        if step_state:
            step_state.status = "completed"
            step_state.completed_at = now
            if verify_result is not None:
                step_state.verify_result = verify_result

    if progress.status != "completed":
        db.flush()
        refresh_progress_percent(db, progress)

    db.commit()


def complete_step_and_advance(
    db: Session,
    progress: UserProgress,
    step_state: StepState,
    *,
    verify_result: dict | None = None,
) -> None:
    """Deprecated: delegates to lesson flow when mapping exists."""
    lesson_id = lesson_id_from_step_id(step_state.step_id)
    if lesson_id:
        lesson_state = (
            db.query(LessonState)
            .filter(
                LessonState.user_progress_id == progress.id,
                LessonState.lesson_id == lesson_id,
            )
            .first()
        )
        if lesson_state:
            complete_lesson_and_advance(db, progress, lesson_state, verify_result=verify_result)
            return

    # Fallback legacy path without lessons
    from app.models.module import Step

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

    current_step = db.get(Step, step_state.step_id)
    next_step = (
        db.query(Step)
        .filter(
            Step.module_id == progress.module_id,
            Step.sort_order > current_step.sort_order,
        )
        .order_by(Step.sort_order)
        .first()
    )

    if next_step:
        progress.current_step_id = next_step.id
        next_state = (
            db.query(StepState)
            .filter(
                StepState.user_progress_id == progress.id,
                StepState.step_id == next_step.id,
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
        total = (
            db.query(Step)
            .filter(Step.module_id == progress.module_id, Step.is_optional.is_(False))
            .count()
        )
        completed = count_completed_steps(db, progress.id)
        progress.progress_percent = int((completed / total) * 100) if total else 0

    db.commit()
