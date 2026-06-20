import time
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_author
from app.db import get_db
from app.models.module import Module
from app.models.user import User
from app.schemas.author import (
    AuthorLessonDetail,
    CreateSlideRequest,
    ReorderSlidesRequest,
    UpdateSlideRequest,
    UpdateSlideResponse,
)
from app.services.authoring import (
    find_lesson_by_slide_id,
    get_working_snapshot,
    persist_draft,
    reorder_slides_in_snapshot,
    slide_exists_in_snapshot,
    slide_snapshot_to_response,
    update_slide_in_snapshot,
    validate_hotspots,
    validate_upload,
    write_content_file,
)
from app.services.authoring.files import delete_lesson_content_file

from .helpers import get_lesson_or_404, lesson_to_detail

router = APIRouter()


def _slide_update_response(db: Session, lesson, snapshot: dict, slide_id: str) -> UpdateSlideResponse:
    slide_data = next(
        (slide for slide in snapshot.get("slides", []) if slide.get("id") == slide_id),
        None,
    )
    if not slide_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "slide_not_found", "message": "Слайд не найден"},
        )
    db.refresh(lesson)
    return UpdateSlideResponse(
        slide=slide_snapshot_to_response(slide_data),
        has_unpublished_changes=lesson.has_unpublished_changes,
    )


@router.post("/lessons/{lesson_id}/slides", response_model=AuthorLessonDetail, status_code=201)
def create_slide(
    lesson_id: str,
    body: CreateSlideRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    lesson = get_lesson_or_404(db, lesson_id)
    snapshot = get_working_snapshot(db, lesson)
    slides = snapshot.get("slides", [])
    next_order = max((slide["sort_order"] for slide in slides), default=0) + 1
    slide_id = body.id or f"{lesson_id}-slide-{next_order:02d}"
    existing_ids = {slide["id"] for slide in slides}
    if slide_id in existing_ids:
        slide_id = f"{slide_id}-{lesson_id[-4:]}"

    slides.append(
        {
            "id": slide_id,
            "sort_order": next_order,
            "title": body.title,
            "caption_html": body.caption_html,
            "expected_result_html": body.expected_result_html,
            "image_path": body.image_path,
            "hotspots": [item.model_dump() for item in body.hotspots],
        }
    )
    snapshot["slides"] = slides
    persist_draft(db, lesson, snapshot)
    db.commit()
    db.refresh(lesson)
    return lesson_to_detail(db, lesson)


@router.put("/slides/{slide_id}", response_model=UpdateSlideResponse)
def update_slide(
    slide_id: str,
    body: UpdateSlideRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    lesson = find_lesson_by_slide_id(db, slide_id)
    snapshot = get_working_snapshot(db, lesson)
    if not slide_exists_in_snapshot(snapshot, slide_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "slide_not_found", "message": "Слайд не найден"},
        )

    updates: dict = {}
    if body.title is not None:
        updates["title"] = body.title
    if body.caption_html is not None:
        updates["caption_html"] = body.caption_html
    if body.expected_result_html is not None:
        updates["expected_result_html"] = body.expected_result_html
    if body.image_path is not None:
        updates["image_path"] = body.image_path
    if body.hotspots is not None:
        updates["hotspots"] = validate_hotspots([item.model_dump() for item in body.hotspots])
    if body.sort_order is not None:
        updates["sort_order"] = body.sort_order

    update_slide_in_snapshot(snapshot, slide_id, updates)
    persist_draft(db, lesson, snapshot)
    db.commit()
    return _slide_update_response(db, lesson, snapshot, slide_id)


@router.delete("/slides/{slide_id}", response_model=AuthorLessonDetail)
def delete_slide(
    slide_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    lesson = find_lesson_by_slide_id(db, slide_id)
    snapshot = get_working_snapshot(db, lesson)
    if not slide_exists_in_snapshot(snapshot, slide_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "slide_not_found", "message": "Слайд не найден"},
        )
    snapshot["slides"] = [slide for slide in snapshot.get("slides", []) if slide.get("id") != slide_id]
    for index, slide in enumerate(snapshot["slides"], start=1):
        slide["sort_order"] = index
    persist_draft(db, lesson, snapshot)
    db.commit()
    db.refresh(lesson)
    return lesson_to_detail(db, lesson)


@router.patch("/lessons/{lesson_id}/slides/reorder", response_model=AuthorLessonDetail)
def reorder_slides(
    lesson_id: str,
    body: ReorderSlidesRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    lesson = get_lesson_or_404(db, lesson_id)
    snapshot = get_working_snapshot(db, lesson)
    reorder_slides_in_snapshot(snapshot, body.slide_ids)
    persist_draft(db, lesson, snapshot)
    db.commit()
    db.refresh(lesson)
    return lesson_to_detail(db, lesson)


@router.post("/slides/{slide_id}/upload")
async def upload_slide_image(
    slide_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
    file: UploadFile = File(...),
):
    lesson = find_lesson_by_slide_id(db, slide_id)
    snapshot = get_working_snapshot(db, lesson)
    slide_data = next((slide for slide in snapshot.get("slides", []) if slide.get("id") == slide_id), None)
    if not slide_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "slide_not_found", "message": "Слайд не найден"},
        )

    module = db.get(Module, lesson.module_id)
    if not module:
        raise HTTPException(status_code=404, detail={"detail": "module_not_found", "message": "Модуль не найден"})

    data = await file.read()
    validate_upload(file.content_type, len(data))

    ext_map = {"image/png": "png", "image/webp": "webp", "image/svg+xml": "svg"}
    ext = ext_map.get(file.content_type or "", "bin")
    previous_image_path = slide_data.get("image_path")
    filename = f"slide-{slide_data['sort_order']:02d}-{int(time.time() * 1000)}.{ext}"
    image_path = write_content_file(module.id, lesson.id, filename, data)
    if previous_image_path and previous_image_path != image_path:
        delete_lesson_content_file(previous_image_path, module.id, lesson.id)
    update_slide_in_snapshot(snapshot, slide_id, {"image_path": image_path})
    persist_draft(db, lesson, snapshot)
    db.commit()
    return {"image_path": image_path}
