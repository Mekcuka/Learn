from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.lesson import Lesson, LessonState
from app.models.module import Module, QuizQuestion
from app.models.progress import UserProgress
from app.schemas.quiz import QuizAnswerItem, QuizQuestionPublic, QuizSubmitResponse
from app.services.progress import complete_lesson_and_advance, get_or_create_progress


def _question_allows_multiple(question: QuizQuestion) -> bool:
    return len(question.correct_option_ids or []) > 1


def get_module_quiz(db: Session, module: Module) -> list[QuizQuestionPublic]:
    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.module_id == module.id)
        .order_by(QuizQuestion.sort_order)
        .all()
    )
    return [
        QuizQuestionPublic(
            id=question.id,
            order=question.sort_order,
            prompt_html=question.prompt_html,
            options=[{"id": opt["id"], "text": opt["text"]} for opt in (question.options or [])],
            allow_multiple=_question_allows_multiple(question),
        )
        for question in questions
    ]


def _grade_answer(question: QuizQuestion, selected: list[str]) -> bool:
    correct = set(question.correct_option_ids or [])
    chosen = set(selected)
    return chosen == correct and len(chosen) > 0


def submit_module_quiz(
    db: Session,
    *,
    user_id,
    module: Module,
    answers: list[QuizAnswerItem],
    lesson_id: str | None = None,
) -> QuizSubmitResponse:
    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.module_id == module.id)
        .order_by(QuizQuestion.sort_order)
        .all()
    )
    if not questions:
        return QuizSubmitResponse(
            passed=False,
            score_percent=0,
            pass_threshold_percent=module.pass_threshold_percent,
            results=[],
            lesson_completed=False,
        )

    answer_map = {item.question_id: item.selected_option_ids for item in answers}
    results: list[dict] = []
    correct_count = 0

    for question in questions:
        selected = answer_map.get(question.id, [])
        is_correct = _grade_answer(question, selected)
        if is_correct:
            correct_count += 1
        results.append({"question_id": question.id, "correct": is_correct})

    score_percent = int((correct_count / len(questions)) * 100)
    threshold = module.pass_threshold_percent
    lesson_config = {}
    if lesson_id:
        lesson = db.get(Lesson, lesson_id)
        if lesson and lesson.verify_config:
            lesson_config = lesson.verify_config
    threshold = int(lesson_config.get("pass_threshold_percent", threshold))
    passed = score_percent >= threshold

    lesson_completed = False
    if passed:
        quiz_lesson = _resolve_quiz_lesson(db, module.id, lesson_id)
        if quiz_lesson:
            progress = get_or_create_progress(db, user_id, module.id)
            lesson_state = (
                db.query(LessonState)
                .filter(
                    LessonState.user_progress_id == progress.id,
                    LessonState.lesson_id == quiz_lesson.id,
                )
                .first()
            )
            if lesson_state and lesson_state.status != "completed":
                progress.quiz_score_percent = score_percent
                complete_lesson_and_advance(
                    db,
                    progress,
                    lesson_state,
                    verify_result={
                        "passed": True,
                        "score_percent": score_percent,
                        "pass_threshold_percent": threshold,
                    },
                )
                lesson_completed = True
            elif lesson_state and lesson_state.status == "completed":
                lesson_completed = True
                progress.quiz_score_percent = score_percent
                db.commit()

    if not lesson_completed:
        db.commit()

    return QuizSubmitResponse(
        passed=passed,
        score_percent=score_percent,
        pass_threshold_percent=threshold,
        results=results,
        lesson_completed=lesson_completed,
    )


def _resolve_quiz_lesson(db: Session, module_id: str, lesson_id: str | None) -> Lesson | None:
    if lesson_id:
        lesson = db.get(Lesson, lesson_id)
        if lesson and lesson.module_id == module_id:
            return lesson
    return (
        db.query(Lesson)
        .filter(Lesson.module_id == module_id, Lesson.verify_type == "quiz_passed")
        .order_by(Lesson.sort_order)
        .first()
    )
