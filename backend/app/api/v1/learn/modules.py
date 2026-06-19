from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user import User
from app.schemas.modules import ModuleListItem, ModuleListResponse
from app.schemas.quiz import QuizModuleResponse, QuizSubmitRequest, QuizSubmitResponse
from app.services.progress import count_completed_lessons, get_or_create_progress
from app.services.quiz import get_module_quiz, submit_module_quiz

router = APIRouter(tags=["modules"])


def _get_published_module(db: Session, module_id: str) -> Module:
    module = db.get(Module, module_id)
    if not module or not module.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "module_not_found", "message": "Модуль не найден"},
        )
    return module


@router.get("/modules", response_model=ModuleListResponse)
def list_modules(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    modules = db.query(Module).filter(Module.is_published.is_(True)).order_by(Module.sort_order, Module.id).all()
    items: list[ModuleListItem] = []
    for module in modules:
        progress = get_or_create_progress(db, current_user.id, module.id)
        db.refresh(progress)
        total_lessons = db.query(Lesson).filter(Lesson.module_id == module.id, Lesson.is_optional.is_(False)).count()
        completed = count_completed_lessons(db, progress.id)
        items.append(
            ModuleListItem(
                id=module.id,
                title=module.title,
                description=module.description,
                status=progress.status,
                progress_percent=progress.progress_percent,
                total_steps=total_lessons,
                completed_steps=completed,
            )
        )
    return ModuleListResponse(items=items)


@router.get("/modules/{module_id}/quiz", response_model=QuizModuleResponse)
def get_module_quiz_endpoint(
    module_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    module = _get_published_module(db, module_id)
    get_or_create_progress(db, current_user.id, module_id)
    return QuizModuleResponse(
        module_id=module.id,
        pass_threshold_percent=module.pass_threshold_percent,
        questions=get_module_quiz(db, module),
    )


@router.post("/modules/{module_id}/quiz/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    module_id: str,
    body: QuizSubmitRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    module = _get_published_module(db, module_id)
    return submit_module_quiz(
        db,
        user_id=current_user.id,
        module=module,
        answers=body.answers,
        lesson_id=body.lesson_id,
    )
