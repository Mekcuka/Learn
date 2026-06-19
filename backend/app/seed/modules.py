"""Module seed orchestration."""

from sqlalchemy.orm import Session

from app.models.lesson import Lesson, LessonSlide
from app.models.module import Module, QuizQuestion, Step

from app.seed.catalog import MODULE_SPECS, _remove_retired_lessons

def _sync_lesson_metadata(db: Session, module_id: str, lessons: list[dict]) -> None:
    for lesson_data in lessons:
        lesson = db.get(Lesson, lesson_data["id"])
        if lesson and lesson.module_id == module_id:
            lesson.sort_order = lesson_data["sort_order"]
            if "tags" in lesson_data:
                lesson.tags = lesson_data["tags"]


def _add_lessons_to_module(db: Session, module_id: str, lessons: list[dict]) -> None:
    _sync_lesson_metadata(db, module_id, lessons)
    for lesson_data in lessons:
        if db.get(Lesson, lesson_data["id"]):
            continue
        slides = lesson_data.get("slides", [])
        lesson_fields = {key: value for key, value in lesson_data.items() if key != "slides"}
        lesson_id = lesson_fields["id"]
        db.add(Lesson(module_id=module_id, **lesson_fields))
        for slide_data in slides:
            db.add(LessonSlide(lesson_id=lesson_id, **slide_data))


def _add_steps_to_module(db: Session, module_id: str, steps: list[dict]) -> None:
    for step_data in steps:
        if db.get(Step, step_data["id"]):
            continue
        db.add(Step(module_id=module_id, **step_data))


def _add_quiz_to_module(db: Session, module_id: str, questions: list[dict]) -> None:
    for question in questions:
        if db.get(QuizQuestion, question["id"]):
            continue
        db.add(QuizQuestion(module_id=module_id, **question))


def seed_module(db: Session, spec: dict) -> None:
    module = db.get(Module, spec["id"])
    if module:
        module.title = spec["title"]
        module.description = spec["description"]
        module.sort_order = spec["sort_order"]
        module.is_published = True
        _add_steps_to_module(db, module.id, spec.get("steps", []))
        _add_lessons_to_module(db, module.id, spec.get("lessons", []))
        _add_quiz_to_module(db, module.id, spec.get("quiz_questions", []))
        db.commit()
        return

    module = Module(
        id=spec["id"],
        title=spec["title"],
        description=spec["description"],
        scenario_version=1,
        sort_order=spec["sort_order"],
        is_published=True,
        pass_threshold_percent=80,
    )
    db.add(module)
    db.flush()

    _add_steps_to_module(db, module.id, spec.get("steps", []))
    _add_lessons_to_module(db, module.id, spec.get("lessons", []))
    _add_quiz_to_module(db, module.id, spec.get("quiz_questions", []))
    db.commit()


def seed_all_modules(db: Session) -> None:
    _remove_retired_lessons(db)
    for spec in MODULE_SPECS:
        seed_module(db, spec)


def seed_orientation_module(db: Session) -> None:
    """Deprecated alias — seeds all catalog modules."""
    seed_all_modules(db)
