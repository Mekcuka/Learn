from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.lesson import Lesson, LessonSlide
from app.models.module import Module
from app.schemas.author import AuthorLessonDetail, AuthorLessonListItem
from app.services.authoring import get_working_snapshot, snapshot_to_detail


def get_module_or_404(db: Session, module_id: str) -> Module:
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "module_not_found", "message": "Модуль не найден"},
        )
    return module


def get_lesson_or_404(db: Session, lesson_id: str) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "lesson_not_found", "message": "Урок не найден"},
        )
    return lesson


def get_slide_or_404(db: Session, slide_id: str) -> LessonSlide:
    slide = db.get(LessonSlide, slide_id)
    if not slide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "slide_not_found", "message": "Слайд не найден"},
        )
    return slide


def next_lesson_order(db: Session, module_id: str) -> int:
    last = (
        db.query(Lesson)
        .filter(Lesson.module_id == module_id)
        .order_by(Lesson.sort_order.desc())
        .first()
    )
    return (last.sort_order + 1) if last else 1


def next_slide_order(db: Session, lesson_id: str) -> int:
    last = (
        db.query(LessonSlide)
        .filter(LessonSlide.lesson_id == lesson_id)
        .order_by(LessonSlide.sort_order.desc())
        .first()
    )
    return (last.sort_order + 1) if last else 1


def lesson_to_detail(db: Session, lesson: Lesson) -> AuthorLessonDetail:
    snapshot = get_working_snapshot(db, lesson)
    return snapshot_to_detail(db, lesson, snapshot)


def lesson_list_items(db: Session, module_id: str) -> list[AuthorLessonListItem]:
    lessons = db.query(Lesson).filter(Lesson.module_id == module_id).order_by(Lesson.sort_order).all()
    published_lesson_ids = [lesson.id for lesson in lessons if not lesson.has_unpublished_changes]
    slide_count_map: dict[str, int] = {}
    if published_lesson_ids:
        slide_count_map = dict(
            db.query(LessonSlide.lesson_id, func.count(LessonSlide.id))
            .filter(LessonSlide.lesson_id.in_(published_lesson_ids))
            .group_by(LessonSlide.lesson_id)
            .all()
        )

    items: list[AuthorLessonListItem] = []
    for lesson in lessons:
        if lesson.has_unpublished_changes:
            snapshot = get_working_snapshot(db, lesson)
            slide_count = len(snapshot.get("slides", []))
            title = snapshot.get("title", lesson.title)
            summary = snapshot.get("summary", lesson.summary)
            verify_type = snapshot.get("verify_type", lesson.verify_type)
        else:
            slide_count = slide_count_map.get(lesson.id, 0)
            title = lesson.title
            summary = lesson.summary
            verify_type = lesson.verify_type
        items.append(
            AuthorLessonListItem(
                id=lesson.id,
                order=lesson.sort_order,
                title=title,
                summary=summary,
                slide_count=slide_count,
                verify_type=verify_type,
                has_unpublished_changes=lesson.has_unpublished_changes,
            )
        )
    return items


def utc_now() -> datetime:
    return datetime.now(UTC)
