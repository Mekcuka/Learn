from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.lesson import Lesson
from app.models.progress import UserProgress
from app.models.lesson import LessonState


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


def _initial_status_for_lesson(
    lesson: Lesson,
    lessons: list[Lesson],
    states: dict[str, LessonState],
) -> str:
    prior = [item for item in lessons if item.sort_order < lesson.sort_order]
    if not prior:
        return "active"
    if not all(states.get(item.id) and states[item.id].status == "completed" for item in prior):
        return "locked"
    has_active = any(state.status == "active" for state in states.values())
    return "locked" if has_active else "active"


def _resolve_current_lesson_id(lessons: list[Lesson], states: dict[str, LessonState]) -> str:
    for lesson in lessons:
        state = states.get(lesson.id)
        if state and state.status == "active":
            return lesson.id
    for lesson in lessons:
        state = states.get(lesson.id)
        if not state or state.status != "completed":
            return lesson.id
    return lessons[-1].id


def _ensure_lesson_states(db: Session, progress: UserProgress, module_id: str) -> None:
    lessons = db.query(Lesson).filter(Lesson.module_id == module_id).order_by(Lesson.sort_order).all()
    if not lessons:
        return

    lesson_ids = {lesson.id for lesson in lessons}
    existing_states: dict[str, LessonState] = {
        state.lesson_id: state
        for state in db.query(LessonState)
        .filter(LessonState.user_progress_id == progress.id)
        .all()
    }

    if not existing_states:
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
        return

    missing_lessons = [lesson for lesson in lessons if lesson.id not in existing_states]
    if not missing_lessons:
        return

    changed = False
    if not progress.current_lesson_id or progress.current_lesson_id not in lesson_ids:
        progress.current_lesson_id = _resolve_current_lesson_id(lessons, existing_states)
        changed = True

    for lesson in missing_lessons:
        status = _initial_status_for_lesson(lesson, lessons, existing_states)
        new_state = LessonState(
            user_progress_id=progress.id,
            lesson_id=lesson.id,
            status=status,
        )
        db.add(new_state)
        existing_states[lesson.id] = new_state
        changed = True
        if status == "active":
            progress.current_lesson_id = lesson.id
            changed = True

    if changed:
        db.commit()


def count_completed_lessons(db: Session, progress_id: UUID) -> int:
    return (
        db.query(LessonState)
        .filter(LessonState.user_progress_id == progress_id, LessonState.status == "completed")
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


def reset_user_lesson_progress(db: Session, user_id: UUID) -> int:
    progress_records = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()
    if not progress_records:
        return 0

    progress_ids = [progress.id for progress in progress_records]
    db.query(LessonState).filter(LessonState.user_progress_id.in_(progress_ids)).delete(
        synchronize_session=False
    )
    modules_reset = len(progress_records)
    db.query(UserProgress).filter(UserProgress.user_id == user_id).delete(synchronize_session=False)
    db.commit()
    return modules_reset


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
    else:
        progress.current_lesson_id = None
        progress.status = "completed"
        progress.completed_at = now
        progress.progress_percent = 100

    if progress.status != "completed":
        db.flush()
        refresh_progress_percent(db, progress)

    db.commit()
