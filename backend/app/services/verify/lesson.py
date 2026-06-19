from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.lesson import Lesson, LessonState
from app.models.progress import UserProgress

from .manual import verify_manual_lesson
from .quiz_passed import verify_quiz_passed_lesson

_LEGACY_MANUAL_TYPES = frozenset({"resource_exists", "navigation", "job_completed"})


def run_lesson_verify(
    db: Session,
    progress: UserProgress,
    lesson: Lesson,
    lesson_state: LessonState,
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

    if lesson.verify_type in ("manual", *_LEGACY_MANUAL_TYPES):
        return verify_manual_lesson(db, progress, lesson_state)
    if lesson.verify_type == "quiz_passed":
        return verify_quiz_passed_lesson(db, lesson, lesson_state)
    return {
        "status": "failed",
        "message": "Неизвестный тип проверки",
        "hint_lesson_id": lesson.id,
    }
