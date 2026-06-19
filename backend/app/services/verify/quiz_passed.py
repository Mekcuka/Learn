from sqlalchemy.orm import Session

from app.models.lesson import Lesson, LessonState
from app.models.progress import StepState

from ._common import log_verify, touch_lesson_verify, touch_step_verify


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


def verify_quiz_passed_step(
    db: Session,
    step,
    step_state: StepState,
) -> dict:
    touch_step_verify(step_state)
    log_verify(db, verify_type=step.verify_type, outcome="pending", step_state=step_state)
    db.commit()
    return {
        "status": "pending",
        "message": "Пройдите мини-квиз на этой странице",
        "retry_after_seconds": None,
    }
