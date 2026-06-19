from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_author
from app.db import get_db
from app.models.user import User
from app.schemas.author import AuthorQuizResponse, UpdateModuleQuizRequest
from app.services.quiz import get_author_module_quiz, replace_module_quiz

from .helpers import get_module_or_404

router = APIRouter()


@router.get("/modules/{module_id}/quiz", response_model=AuthorQuizResponse)
def get_author_module_quiz_endpoint(
    module_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    module = get_module_or_404(db, module_id)
    return get_author_module_quiz(db, module)


@router.put("/modules/{module_id}/quiz", response_model=AuthorQuizResponse)
def update_author_module_quiz(
    module_id: str,
    body: UpdateModuleQuizRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    module = get_module_or_404(db, module_id)
    return replace_module_quiz(
        db,
        module,
        questions=body.questions,
        pass_threshold_percent=body.pass_threshold_percent,
    )
