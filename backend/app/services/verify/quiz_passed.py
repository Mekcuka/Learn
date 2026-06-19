from sqlalchemy.orm import Session

from app.models.lesson import Lesson, LessonState

from ._common import log_verify, touch_lesson_verify


def verify_quiz_passed_lesson(
    db: Session,
    lesson: Lesson,
    lesson_state: LessonState,
) -> dict:
    touch_lesson_verify(lesson_state)
    log_verify(db, verify_type=lesson.verify_type, outcome="pending", lesson_state=lesson_state)
    db.commit()
    return {
        "status": "pending",
        "message": "Пройдите мини-квиз на этой странице",
        "retry_after_seconds": None,
    }
