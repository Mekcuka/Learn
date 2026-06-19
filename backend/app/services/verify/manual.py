from sqlalchemy.orm import Session

from app.models.lesson import LessonState
from app.models.self_study import SelfStudyProgress, SelfStudyStepState

from ._common import (
    log_verify,
    pass_lesson,
    pass_self_study_step,
    touch_lesson_verify,
    touch_self_study_verify,
)


def verify_manual_lesson(
    db: Session,
    progress,
    lesson_state: LessonState,
) -> dict:
    touch_lesson_verify(lesson_state)
    log_verify(db, verify_type="manual", outcome="passed", lesson_state=lesson_state)
    return pass_lesson(
        db,
        progress,
        lesson_state,
        verify_result={"passed": True},
        message="Урок выполнен",
    )


def verify_manual_self_study(
    db: Session,
    progress: SelfStudyProgress,
    step_state: SelfStudyStepState,
) -> dict:
    touch_self_study_verify(step_state)
    return pass_self_study_step(
        db,
        progress,
        step_state,
        verify_result={"passed": True},
        message="Шаг выполнен",
    )
