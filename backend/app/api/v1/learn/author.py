from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_author
from app.api.v1.learn.lessons import _hotspots_from_json, _slide_to_response
from app.db import get_db
from app.models.lesson import Lesson, LessonSlide
from app.models.module import Module
from app.models.user import User
from app.schemas.author import (
    AuthorLessonDetail,
    AuthorLessonListItem,
    AuthorModuleItem,
    CreateLessonRequest,
    CreateSlideRequest,
    LessonExportPayload,
    LessonImportRequest,
    ReorderSlidesRequest,
    UpdateLessonRequest,
    UpdateSlideRequest,
)
from app.schemas.lessons import VerifyConfigResponse
from app.services.authoring import (
    hotspots_to_storage,
    slugify,
    validate_tags,
    validate_upload,
    validate_verify_type,
    write_content_file,
)

router = APIRouter(prefix="/author", tags=["author"])


def _get_lesson_or_404(db: Session, lesson_id: str) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "lesson_not_found", "message": "Урок не найден"},
        )
    return lesson


def _get_slide_or_404(db: Session, slide_id: str) -> LessonSlide:
    slide = db.get(LessonSlide, slide_id)
    if not slide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "slide_not_found", "message": "Слайд не найден"},
        )
    return slide


def _next_lesson_order(db: Session, module_id: str) -> int:
    last = (
        db.query(Lesson)
        .filter(Lesson.module_id == module_id)
        .order_by(Lesson.sort_order.desc())
        .first()
    )
    return (last.sort_order + 1) if last else 1


def _next_slide_order(db: Session, lesson_id: str) -> int:
    last = (
        db.query(LessonSlide)
        .filter(LessonSlide.lesson_id == lesson_id)
        .order_by(LessonSlide.sort_order.desc())
        .first()
    )
    return (last.sort_order + 1) if last else 1


def _lesson_to_detail(db: Session, lesson: Lesson) -> AuthorLessonDetail:
    module = db.get(Module, lesson.module_id)
    slides = (
        db.query(LessonSlide)
        .filter(LessonSlide.lesson_id == lesson.id)
        .order_by(LessonSlide.sort_order)
        .all()
    )
    return AuthorLessonDetail(
        id=lesson.id,
        module_id=lesson.module_id,
        module_title=module.title if module else lesson.module_id,
        order=lesson.sort_order,
        title=lesson.title,
        summary=lesson.summary,
        tags=list(lesson.tags or []),
        instruction_html=lesson.instruction_html,
        deep_link_template=lesson.deep_link_template,
        verify=VerifyConfigResponse(type=lesson.verify_type, config=lesson.verify_config or {}),
        is_optional=lesson.is_optional,
        slides=[_slide_to_response(slide) for slide in slides],
    )


@router.get("/modules", response_model=list[AuthorModuleItem])
def list_modules(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    modules = db.query(Module).order_by(Module.sort_order, Module.id).all()
    return [
        AuthorModuleItem(
            id=module.id,
            title=module.title,
            description=module.description,
            sort_order=module.sort_order,
            is_published=module.is_published,
            lesson_count=db.query(Lesson).filter(Lesson.module_id == module.id).count(),
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

    lessons = db.query(Lesson).filter(Lesson.module_id == module_id).order_by(Lesson.sort_order).all()
    return [
        AuthorLessonListItem(
            id=lesson.id,
            order=lesson.sort_order,
            title=lesson.title,
            summary=lesson.summary,
            slide_count=db.query(LessonSlide).filter(LessonSlide.lesson_id == lesson.id).count(),
            verify_type=lesson.verify_type,
        )
        for lesson in lessons
    ]


@router.get("/lessons/{lesson_id}", response_model=AuthorLessonDetail)
def get_author_lesson(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    return _lesson_to_detail(db, _get_lesson_or_404(db, lesson_id))


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
        sort_order=_next_lesson_order(db, module_id),
        title=body.title,
        summary=body.summary,
        instruction_html=body.instruction_html,
        deep_link_template=body.deep_link_template,
        verify_type=body.verify_type,
        verify_config=body.verify_config,
        tags=validate_tags(body.tags),
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return _lesson_to_detail(db, lesson)


@router.put("/lessons/{lesson_id}", response_model=AuthorLessonDetail)
def update_lesson(
    lesson_id: str,
    body: UpdateLessonRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    lesson = _get_lesson_or_404(db, lesson_id)
    if body.title is not None:
        lesson.title = body.title
    if body.summary is not None:
        lesson.summary = body.summary
    if body.instruction_html is not None:
        lesson.instruction_html = body.instruction_html
    if body.deep_link_template is not None:
        lesson.deep_link_template = body.deep_link_template
    if body.verify_type is not None:
        validate_verify_type(body.verify_type)
        lesson.verify_type = body.verify_type
    if body.verify_config is not None:
        lesson.verify_config = body.verify_config
    if body.sort_order is not None:
        lesson.sort_order = body.sort_order
    if body.is_optional is not None:
        lesson.is_optional = body.is_optional
    if body.tags is not None:
        lesson.tags = validate_tags(body.tags)
    db.commit()
    db.refresh(lesson)
    return _lesson_to_detail(db, lesson)


@router.delete("/lessons/{lesson_id}", status_code=204)
def delete_lesson(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    lesson = _get_lesson_or_404(db, lesson_id)
    db.query(LessonSlide).filter(LessonSlide.lesson_id == lesson_id).delete()
    db.delete(lesson)
    db.commit()
    return None


@router.post("/lessons/{lesson_id}/slides", response_model=AuthorLessonDetail, status_code=201)
def create_slide(
    lesson_id: str,
    body: CreateSlideRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    lesson = _get_lesson_or_404(db, lesson_id)
    slide_id = body.id or f"{lesson_id}-slide-{_next_slide_order(db, lesson_id):02d}"
    if db.get(LessonSlide, slide_id):
        slide_id = f"{slide_id}-{lesson_id[-4:]}"

    slide = LessonSlide(
        id=slide_id,
        lesson_id=lesson_id,
        sort_order=_next_slide_order(db, lesson_id),
        title=body.title,
        caption_html=body.caption_html,
        expected_result_html=body.expected_result_html,
        image_path=body.image_path,
        hotspots=hotspots_to_storage([item.model_dump() for item in body.hotspots]),
    )
    db.add(slide)
    db.commit()
    return _lesson_to_detail(db, lesson)


@router.put("/slides/{slide_id}", response_model=AuthorLessonDetail)
def update_slide(
    slide_id: str,
    body: UpdateSlideRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    slide = _get_slide_or_404(db, slide_id)
    lesson = _get_lesson_or_404(db, slide.lesson_id)

    if body.title is not None:
        slide.title = body.title
    if body.caption_html is not None:
        slide.caption_html = body.caption_html
    if body.expected_result_html is not None:
        slide.expected_result_html = body.expected_result_html
    if body.image_path is not None:
        slide.image_path = body.image_path
    if body.hotspots is not None:
        slide.hotspots = hotspots_to_storage([item.model_dump() for item in body.hotspots])
    if body.sort_order is not None:
        slide.sort_order = body.sort_order

    db.commit()
    return _lesson_to_detail(db, lesson)


@router.delete("/slides/{slide_id}", response_model=AuthorLessonDetail)
def delete_slide(
    slide_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    slide = _get_slide_or_404(db, slide_id)
    lesson_id = slide.lesson_id
    lesson = _get_lesson_or_404(db, lesson_id)
    db.delete(slide)
    db.commit()
    return _lesson_to_detail(db, lesson)


@router.patch("/lessons/{lesson_id}/slides/reorder", response_model=AuthorLessonDetail)
def reorder_slides(
    lesson_id: str,
    body: ReorderSlidesRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    lesson = _get_lesson_or_404(db, lesson_id)
    slides = db.query(LessonSlide).filter(LessonSlide.lesson_id == lesson_id).all()
    slide_map = {slide.id: slide for slide in slides}
    if set(body.slide_ids) != set(slide_map.keys()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"detail": "validation_error", "message": "Список slide_ids не совпадает со слайдами урока"},
        )

    for index, slide_id in enumerate(body.slide_ids, start=1):
        slide_map[slide_id].sort_order = index
    db.commit()
    return _lesson_to_detail(db, lesson)


@router.post("/slides/{slide_id}/upload")
async def upload_slide_image(
    slide_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
    file: UploadFile = File(...),
):
    slide = _get_slide_or_404(db, slide_id)
    lesson = _get_lesson_or_404(db, slide.lesson_id)
    module = db.get(Module, lesson.module_id)
    if not module:
        raise HTTPException(status_code=404, detail={"detail": "module_not_found", "message": "Модуль не найден"})

    data = await file.read()
    validate_upload(file.content_type, len(data))

    ext_map = {"image/png": "png", "image/webp": "webp", "image/svg+xml": "svg"}
    ext = ext_map.get(file.content_type or "", "bin")
    filename = f"slide-{slide.sort_order:02d}.{ext}"
    image_path = write_content_file(module.id, lesson.id, filename, data)
    slide.image_path = image_path
    db.commit()
    return {"image_path": image_path}


@router.get("/lessons/{lesson_id}/export", response_model=LessonExportPayload)
def export_lesson(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_author)],
):
    lesson = _get_lesson_or_404(db, lesson_id)
    slides = (
        db.query(LessonSlide)
        .filter(LessonSlide.lesson_id == lesson_id)
        .order_by(LessonSlide.sort_order)
        .all()
    )
    return LessonExportPayload(
        id=lesson.id,
        module_id=lesson.module_id,
        sort_order=lesson.sort_order,
        title=lesson.title,
        summary=lesson.summary,
        instruction_html=lesson.instruction_html,
        deep_link_template=lesson.deep_link_template,
        verify_type=lesson.verify_type,
        verify_config=lesson.verify_config or {},
        is_optional=lesson.is_optional,
        tags=list(lesson.tags or []),
        slides=[
            {
                "id": slide.id,
                "sort_order": slide.sort_order,
                "title": slide.title,
                "caption_html": slide.caption_html,
                "expected_result_html": slide.expected_result_html,
                "image_path": slide.image_path,
                "hotspots": slide.hotspots.get("hotspots", []) if slide.hotspots else [],
            }
            for slide in slides
        ],
    )


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
            sort_order=payload.sort_order or _next_lesson_order(db, module_id),
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

    db.commit()
    return _lesson_to_detail(db, lesson)
