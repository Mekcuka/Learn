from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_author
from app.db import get_db
from app.models.lesson import Lesson, LessonSlide, LessonState
from app.models.lesson_revision import LessonRevision
from app.models.module import Module
from app.models.user import User
from app.schemas.author import (
    AuthorLessonDetail,
    CreateLessonRequest,
    DuplicateLessonRequest,
    LessonExportPayload,
    LessonImportRequest,
    UpdateLessonRequest,
)
from app.services.authoring import (
    create_revision_snapshot,
    duplicate_lesson,
    get_working_snapshot,
    hotspots_to_storage,
    persist_draft,
    publish_lesson,
    slugify,
    validate_tags,
    validate_verify_type,
)

from .helpers import get_lesson_or_404, lesson_to_detail, next_lesson_order, utc_now

router = APIRouter()


@router.get("/lessons/{lesson_id}", response_model=AuthorLessonDetail)
def get_author_lesson(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    return lesson_to_detail(db, get_lesson_or_404(db, lesson_id))


@router.post("/modules/{module_id}/lessons", response_model=AuthorLessonDetail, status_code=201)
def create_lesson(
    module_id: str,
    body: CreateLessonRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail={"detail": "module_not_found", "message": "Модуль не найден"})

    validate_verify_type(body.verify_type)
    lesson_id = body.id or slugify(body.title)
    if db.get(Lesson, lesson_id):
        lesson_id = slugify(f"{body.title}-{lesson_id[-4:]}")

    lesson = Lesson(
        id=lesson_id,
        module_id=module_id,
        sort_order=next_lesson_order(db, module_id),
        title=body.title,
        summary=body.summary,
        instruction_html=body.instruction_html,
        deep_link_template=body.deep_link_template,
        verify_type=body.verify_type,
        verify_config=body.verify_config,
        tags=validate_tags(body.tags),
        has_unpublished_changes=False,
        published_at=utc_now(),
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson_to_detail(db, lesson)


@router.put("/lessons/{lesson_id}", response_model=AuthorLessonDetail)
def update_lesson(
    lesson_id: str,
    body: UpdateLessonRequest,
    db: Annotated[Session, Depends(get_db)],
    author: Annotated[User, Depends(get_current_author)],
):
    lesson = get_lesson_or_404(db, lesson_id)
    if not lesson.has_unpublished_changes and lesson.published_at is not None:
        create_revision_snapshot(db, lesson, author, label="Автосохранение")

    snapshot = get_working_snapshot(db, lesson)
    if body.title is not None:
        snapshot["title"] = body.title
    if body.summary is not None:
        snapshot["summary"] = body.summary
    if body.instruction_html is not None:
        snapshot["instruction_html"] = body.instruction_html
    if body.deep_link_template is not None:
        snapshot["deep_link_template"] = body.deep_link_template
    if body.verify_type is not None:
        validate_verify_type(body.verify_type)
        snapshot["verify_type"] = body.verify_type
    if body.verify_config is not None:
        snapshot["verify_config"] = body.verify_config
    if body.sort_order is not None:
        snapshot["sort_order"] = body.sort_order
        lesson.sort_order = body.sort_order
    if body.is_optional is not None:
        snapshot["is_optional"] = body.is_optional
    if body.tags is not None:
        snapshot["tags"] = validate_tags(body.tags)

    persist_draft(db, lesson, snapshot)
    db.commit()
    db.refresh(lesson)
    return lesson_to_detail(db, lesson)


@router.delete("/lessons/{lesson_id}", status_code=204)
def delete_lesson(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    lesson = get_lesson_or_404(db, lesson_id)
    db.query(LessonState).filter(LessonState.lesson_id == lesson_id).delete()
    db.query(LessonSlide).filter(LessonSlide.lesson_id == lesson_id).delete()
    db.query(LessonRevision).filter(LessonRevision.lesson_id == lesson_id).delete()
    db.delete(lesson)
    db.commit()
    return None


@router.get("/lessons/{lesson_id}/export", response_model=LessonExportPayload)
def export_lesson(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    lesson = get_lesson_or_404(db, lesson_id)
    snapshot = get_working_snapshot(db, lesson)
    return LessonExportPayload(**snapshot)


@router.post("/modules/{module_id}/lessons/import", response_model=AuthorLessonDetail)
def import_lesson(
    module_id: str,
    body: LessonImportRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail={"detail": "module_not_found", "message": "Модуль не найден"})

    payload = body.lesson
    if payload.module_id != module_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"detail": "validation_error", "message": "module_id в JSON не совпадает с URL"},
        )

    validate_verify_type(payload.verify_type)
    lesson = db.get(Lesson, payload.id)
    if lesson:
        lesson.title = payload.title
        lesson.summary = payload.summary
        lesson.instruction_html = payload.instruction_html
        lesson.deep_link_template = payload.deep_link_template
        lesson.verify_type = payload.verify_type
        lesson.verify_config = payload.verify_config
        lesson.sort_order = payload.sort_order
        lesson.is_optional = payload.is_optional
        lesson.tags = validate_tags(payload.tags)
        db.query(LessonSlide).filter(LessonSlide.lesson_id == lesson.id).delete()
    else:
        lesson = Lesson(
            id=payload.id,
            module_id=module_id,
            sort_order=payload.sort_order or next_lesson_order(db, module_id),
            title=payload.title,
            summary=payload.summary,
            instruction_html=payload.instruction_html,
            deep_link_template=payload.deep_link_template,
            verify_type=payload.verify_type,
            verify_config=payload.verify_config,
            is_optional=payload.is_optional,
            tags=validate_tags(payload.tags),
        )
        db.add(lesson)
        db.flush()

    for slide_data in payload.slides:
        hotspots_raw = slide_data.get("hotspots", [])
        if isinstance(hotspots_raw, dict):
            hotspots_raw = hotspots_raw.get("hotspots", [])
        db.add(
            LessonSlide(
                id=slide_data["id"],
                lesson_id=lesson.id,
                sort_order=slide_data["sort_order"],
                title=slide_data["title"],
                caption_html=slide_data.get("caption_html", ""),
                expected_result_html=slide_data.get("expected_result_html", ""),
                image_path=slide_data.get("image_path", "/content/placeholder-slide.svg"),
                hotspots=hotspots_to_storage(hotspots_raw),
            )
        )

    lesson.draft_payload = None
    lesson.has_unpublished_changes = False
    db.commit()
    return lesson_to_detail(db, lesson)


@router.post("/lessons/{lesson_id}/duplicate", response_model=AuthorLessonDetail, status_code=201)
def duplicate_lesson_endpoint(
    lesson_id: str,
    body: DuplicateLessonRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    source = get_lesson_or_404(db, lesson_id)
    new_lesson = duplicate_lesson(
        db,
        source,
        new_id=body.new_id,
        title_suffix=body.title_suffix,
        copy_images=True,
    )
    db.commit()
    db.refresh(new_lesson)
    return lesson_to_detail(db, new_lesson)


@router.post("/lessons/{lesson_id}/publish", response_model=AuthorLessonDetail)
def publish_lesson_endpoint(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    author: Annotated[User, Depends(get_current_author)],
):
    lesson = get_lesson_or_404(db, lesson_id)
    publish_lesson(db, lesson, author)
    db.commit()
    db.refresh(lesson)
    return lesson_to_detail(db, lesson)
