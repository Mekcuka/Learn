from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.profile import ResetProgressResponse
from app.services.progress import reset_user_lesson_progress

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("/reset-progress", response_model=ResetProgressResponse)
def reset_progress(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    modules_reset = reset_user_lesson_progress(db, current_user.id)
    return ResetProgressResponse(
        message="Статистика уроков сброшена",
        modules_reset=modules_reset,
    )
