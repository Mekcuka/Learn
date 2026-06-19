from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_author
from app.db import get_db
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user import User
from app.schemas.author import AuthorLessonListItem, AuthorModuleItem, ReorderLessonsRequest

from .helpers import get_module_or_404, lesson_list_items

router = APIRouter()


@router.get("/modules", response_model=list[AuthorModuleItem])
def list_modules(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    modules = db.query(Module).order_by(Module.sort_order, Module.id).all()
    module_ids = [module.id for module in modules]
    lesson_count_map: dict[str, int] = {}
    if module_ids:
        lesson_count_map = dict(
            db.query(Lesson.module_id, func.count(Lesson.id))
            .filter(Lesson.module_id.in_(module_ids))
            .group_by(Lesson.module_id)
            .all()
        )
    return [
        AuthorModuleItem(
            id=module.id,
            title=module.title,
            description=module.description,
            sort_order=module.sort_order,
            is_published=module.is_published,
            lesson_count=lesson_count_map.get(module.id, 0),
        )
        for module in modules
    ]


@router.get("/modules/{module_id}/lessons", response_model=list[AuthorLessonListItem])
def list_module_lessons(
    module_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail={"detail": "module_not_found", "message": "Модуль не найден"})

    return lesson_list_items(db, module_id)


@router.patch("/modules/{module_id}/lessons/reorder", response_model=list[AuthorLessonListItem])
def reorder_lessons(
    module_id: str,
    body: ReorderLessonsRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    get_module_or_404(db, module_id)
    lessons = db.query(Lesson).filter(Lesson.module_id == module_id).all()
    lesson_map = {lesson.id: lesson for lesson in lessons}
    if set(body.lesson_ids) != set(lesson_map.keys()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"detail": "validation_error", "message": "Список lesson_ids не совпадает с уроками модуля"},
        )

    for index, lesson_id in enumerate(body.lesson_ids, start=1):
        lesson_map[lesson_id].sort_order = index
    db.commit()
    return lesson_list_items(db, module_id)
