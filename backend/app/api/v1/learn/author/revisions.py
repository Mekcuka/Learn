import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_author
from app.db import get_db
from app.models.lesson_revision import LessonRevision
from app.models.user import User
from app.schemas.author import AuthorLessonDetail, CreateRevisionRequest, LessonRevisionListResponse
from app.services.authoring import create_revision_snapshot, rollback_revision

from .helpers import get_lesson_or_404, lesson_to_detail

router = APIRouter()


@router.get("/lessons/{lesson_id}/revisions", response_model=LessonRevisionListResponse)
def list_lesson_revisions(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    get_lesson_or_404(db, lesson_id)
    revisions = (
        db.query(LessonRevision)
        .filter(LessonRevision.lesson_id == lesson_id)
        .order_by(LessonRevision.created_at.desc())
        .all()
    )
    return LessonRevisionListResponse(
        items=[
            {
                "id": str(revision.id),
                "created_at": revision.created_at.isoformat(),
                "author_user_id": str(revision.created_by_user_id) if revision.created_by_user_id else None,
                "summary": revision.label,
            }
            for revision in revisions
        ]
    )


@router.post("/lessons/{lesson_id}/revisions", status_code=201)
def create_lesson_revision(
    lesson_id: str,
    body: CreateRevisionRequest,
    db: Annotated[Session, Depends(get_db)],
    author: Annotated[User, Depends(get_current_author)],
):
    lesson = get_lesson_or_404(db, lesson_id)
    revision = create_revision_snapshot(db, lesson, author, label=body.label)
    db.commit()
    db.refresh(revision)
    return {
        "id": str(revision.id),
        "created_at": revision.created_at.isoformat(),
        "author_user_id": str(revision.created_by_user_id) if revision.created_by_user_id else None,
        "summary": revision.label,
    }


@router.post("/lessons/{lesson_id}/revisions/{revision_id}/rollback", response_model=AuthorLessonDetail)
def rollback_lesson_revision(
    lesson_id: str,
    revision_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    author: Annotated[User, Depends(get_current_author)],
):
    lesson = get_lesson_or_404(db, lesson_id)
    rollback_revision(db, lesson, revision_id, author)
    db.commit()
    db.refresh(lesson)
    return lesson_to_detail(db, lesson)
