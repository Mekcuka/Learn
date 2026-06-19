from sqlalchemy.orm import Session

from app.models.lesson import Lesson, LessonState
from app.models.progress import UserProgress

from ._common import ensure_active_or_locked_response, is_manual_verify_type
from .manual import verify_manual_lesson
from .quiz_passed import verify_quiz_passed_lesson


def run_lesson_verify(
    db: Session,
    progress: UserProgress,
    lesson: Lesson,
    lesson_state: LessonState,
) -> dict:
    early = ensure_active_or_locked_response(
        db,
        lesson_state,
        locked_message="Сначала завершите предыдущие уроки",
        hint_key="hint_lesson_id",
        hint_id=progress.current_lesson_id,
    )
    if early:
        return early

    if is_manual_verify_type(lesson.verify_type):
        return verify_manual_lesson(db, progress, lesson_state)
    if lesson.verify_type == "quiz_passed":
        return verify_quiz_passed_lesson(db, lesson, lesson_state)
    return {
        "status": "failed",
        "message": "Неизвестный тип проверки",
        "hint_lesson_id": lesson.id,
    }
