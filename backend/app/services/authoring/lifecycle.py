"""Draft/publish, revisions, duplicate lesson."""

from __future__ import annotations

import shutil
import uuid
from copy import deepcopy
from datetime import UTC, datetime
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.lesson import Lesson, LessonSlide
from app.models.lesson_revision import LessonRevision
from app.models.module import Module
from app.models.user import User
from app.schemas.author import AuthorLessonDetail
from app.schemas.lessons import VerifyConfigResponse

from .slide_response import slide_snapshot_to_response
from .validation import hotspots_to_storage, slugify, validate_tags, validate_verify_type


def _slides_for_lesson(db: Session, lesson_id: str) -> list[LessonSlide]:
    return (
        db.query(LessonSlide)
        .filter(LessonSlide.lesson_id == lesson_id)
        .order_by(LessonSlide.sort_order)
        .all()
    )


def build_lesson_snapshot(lesson: Lesson, slides: list[LessonSlide]) -> dict:
    return {
        "id": lesson.id,
        "module_id": lesson.module_id,
        "sort_order": lesson.sort_order,
        "title": lesson.title,
        "summary": lesson.summary,
        "instruction_html": lesson.instruction_html,
        "deep_link_template": lesson.deep_link_template,
        "verify_type": lesson.verify_type,
        "verify_config": lesson.verify_config or {},
        "is_optional": lesson.is_optional,
        "tags": list(lesson.tags or []),
        "slides": [
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
    }


def snapshot_to_detail(db: Session, lesson: Lesson, snapshot: dict) -> AuthorLessonDetail:
    module = db.get(Module, lesson.module_id)
    slides = [slide_snapshot_to_response(slide_data) for slide_data in snapshot.get("slides", [])]

    return AuthorLessonDetail(
        id=snapshot.get("id", lesson.id),
        module_id=snapshot.get("module_id", lesson.module_id),
        module_title=module.title if module else lesson.module_id,
        order=snapshot.get("sort_order", lesson.sort_order),
        title=snapshot.get("title", lesson.title),
        summary=snapshot.get("summary", lesson.summary),
        tags=list(snapshot.get("tags") or []),
        instruction_html=snapshot.get("instruction_html", lesson.instruction_html),
        deep_link_template=snapshot.get("deep_link_template", lesson.deep_link_template),
        verify=VerifyConfigResponse(
            type=snapshot.get("verify_type", lesson.verify_type),
            config=snapshot.get("verify_config", lesson.verify_config or {}),
        ),
        is_optional=snapshot.get("is_optional", lesson.is_optional),
        slides=slides,
        has_unpublished_changes=lesson.has_unpublished_changes,
        published_at=lesson.published_at.isoformat() if lesson.published_at else None,
    )


def get_working_snapshot(db: Session, lesson: Lesson) -> dict:
    if lesson.draft_payload:
        return deepcopy(lesson.draft_payload)
    return build_lesson_snapshot(lesson, _slides_for_lesson(db, lesson.id))


def persist_draft(db: Session, lesson: Lesson, snapshot: dict) -> None:
    lesson.draft_payload = snapshot
    lesson.has_unpublished_changes = True


def _content_path_from_url(image_path: str) -> Path | None:
    from .files import content_path_from_url

    return content_path_from_url(image_path)


def copy_content_file(src_path: str, module_id: str, lesson_id: str, filename: str) -> str:
    settings = get_settings()
    content_root = Path(settings.content_root).resolve()
    src = _content_path_from_url(src_path)
    if src is None or not src.is_file():
        return src_path

    if ".." in module_id or ".." in lesson_id or ".." in filename:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"detail": "validation_error", "message": "Недопустимый путь"},
        )

    target_dir = content_root / module_id / lesson_id
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / filename
    shutil.copy2(src, target_path)
    return f"/content/{module_id}/{lesson_id}/{filename}"


def apply_snapshot_to_published(
    db: Session,
    lesson: Lesson,
    snapshot: dict,
    *,
    copy_images: bool = False,
) -> None:
    validate_verify_type(snapshot.get("verify_type", lesson.verify_type))

    lesson.title = snapshot.get("title", lesson.title)
    lesson.summary = snapshot.get("summary", lesson.summary)
    lesson.instruction_html = snapshot.get("instruction_html", lesson.instruction_html)
    lesson.deep_link_template = snapshot.get("deep_link_template", lesson.deep_link_template)
    lesson.verify_type = snapshot.get("verify_type", lesson.verify_type)
    lesson.verify_config = snapshot.get("verify_config", lesson.verify_config or {})
    lesson.is_optional = snapshot.get("is_optional", lesson.is_optional)
    lesson.tags = validate_tags(snapshot.get("tags"))

    if snapshot.get("sort_order") is not None:
        lesson.sort_order = snapshot["sort_order"]

    db.query(LessonSlide).filter(LessonSlide.lesson_id == lesson.id).delete()

    for slide_data in snapshot.get("slides", []):
        image_path = slide_data.get("image_path", "/content/placeholder-slide.svg")
        if copy_images and image_path.startswith(f"/content/{lesson.module_id}/"):
            ext = Path(image_path).suffix or ".png"
            filename = f"slide-{slide_data['sort_order']:02d}{ext}"
            image_path = copy_content_file(image_path, lesson.module_id, lesson.id, filename)

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
                image_path=image_path,
                hotspots=hotspots_to_storage(hotspots_raw),
            )
        )


def create_revision_snapshot(
    db: Session,
    lesson: Lesson,
    user: User | None,
    *,
    label: str | None = None,
) -> LessonRevision:
    slides = _slides_for_lesson(db, lesson.id)
    revision = LessonRevision(
        id=uuid.uuid4(),
        lesson_id=lesson.id,
        created_by_user_id=user.id if user else None,
        label=label,
        snapshot_json=build_lesson_snapshot(lesson, slides),
    )
    db.add(revision)
    return revision


def publish_lesson(db: Session, lesson: Lesson, user: User) -> None:
    snapshot = get_working_snapshot(db, lesson)
    create_revision_snapshot(db, lesson, user, label="Перед публикацией")
    apply_snapshot_to_published(db, lesson, snapshot)
    lesson.draft_payload = None
    lesson.has_unpublished_changes = False
    lesson.published_at = datetime.now(UTC)


def duplicate_lesson(
    db: Session,
    source: Lesson,
    *,
    new_id: str | None,
    title_suffix: str,
    copy_images: bool = True,
) -> Lesson:
    snapshot = get_working_snapshot(db, source)

    lesson_id = new_id or slugify(f"{source.title}{title_suffix}")
    if db.get(Lesson, lesson_id):
        lesson_id = slugify(f"{source.title}{title_suffix}-{uuid.uuid4().hex[:6]}")

    snapshot["id"] = lesson_id
    snapshot["title"] = f"{source.title}{title_suffix}"
    last = (
        db.query(Lesson)
        .filter(Lesson.module_id == source.module_id)
        .order_by(Lesson.sort_order.desc())
        .first()
    )
    snapshot["sort_order"] = (last.sort_order + 1) if last else 1

    for index, slide_data in enumerate(snapshot.get("slides", []), start=1):
        old_id = slide_data["id"]
        new_slide_id = f"{lesson_id}-slide-{index:02d}"
        slide_data["id"] = new_slide_id
        slide_data["sort_order"] = index

    new_lesson = Lesson(
        id=lesson_id,
        module_id=source.module_id,
        sort_order=snapshot["sort_order"],
        title=snapshot["title"],
        summary=source.summary,
        instruction_html=source.instruction_html,
        deep_link_template=source.deep_link_template,
        verify_type=source.verify_type,
        verify_config=deepcopy(source.verify_config or {}),
        is_optional=source.is_optional,
        tags=list(source.tags or []),
        has_unpublished_changes=False,
        published_at=datetime.now(UTC),
    )
    db.add(new_lesson)
    db.flush()

    apply_snapshot_to_published(db, new_lesson, snapshot, copy_images=copy_images)
    return new_lesson


def update_slide_in_snapshot(snapshot: dict, slide_id: str, updates: dict) -> dict:
    slides = snapshot.get("slides", [])
    for slide in slides:
        if slide["id"] != slide_id:
            continue
        if updates.get("title") is not None:
            slide["title"] = updates["title"]
        if updates.get("caption_html") is not None:
            slide["caption_html"] = updates["caption_html"]
        if updates.get("expected_result_html") is not None:
            slide["expected_result_html"] = updates["expected_result_html"]
        if updates.get("image_path") is not None:
            slide["image_path"] = updates["image_path"]
        if updates.get("hotspots") is not None:
            slide["hotspots"] = updates["hotspots"]
        if updates.get("sort_order") is not None:
            slide["sort_order"] = updates["sort_order"]
        break
    snapshot["slides"] = sorted(slides, key=lambda item: item["sort_order"])
    return snapshot


def find_lesson_by_slide_id(db: Session, slide_id: str) -> Lesson:
    slide = db.get(LessonSlide, slide_id)
    if slide:
        lesson = db.get(Lesson, slide.lesson_id)
        if lesson:
            return lesson

    for lesson in db.query(Lesson).filter(Lesson.draft_payload.isnot(None)).all():
        payload = lesson.draft_payload or {}
        if any(item.get("id") == slide_id for item in payload.get("slides", [])):
            return lesson

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"detail": "slide_not_found", "message": "Слайд не найден"},
    )


def slide_exists_in_snapshot(snapshot: dict, slide_id: str) -> bool:
    return any(slide.get("id") == slide_id for slide in snapshot.get("slides", []))


def reorder_slides_in_snapshot(snapshot: dict, slide_ids: list[str]) -> dict:
    slide_map = {slide["id"]: slide for slide in snapshot.get("slides", [])}
    if set(slide_ids) != set(slide_map.keys()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"detail": "validation_error", "message": "Список slide_ids не совпадает со слайдами урока"},
        )
    for index, slide_id in enumerate(slide_ids, start=1):
        slide_map[slide_id]["sort_order"] = index
    snapshot["slides"] = [slide_map[slide_id] for slide_id in slide_ids]
    return snapshot
