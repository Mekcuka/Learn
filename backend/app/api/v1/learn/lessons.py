from collections import defaultdict
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.learn.modules import _get_published_module
from app.db import get_db
from app.models.lesson import Lesson, LessonSlide, LessonState
from app.models.module import Module
from app.schemas.quiz import QuizModuleResponse
from app.services.quiz import get_module_quiz
from app.models.user import User
from app.schemas.lessons import (
    DashboardResponse,
    HotspotItem,
    LessonDetailResponse,
    LessonListItem,
    LessonSlideResponse,
    LessonStateResponse,
    ModuleDashboardItem,
    ModuleLessonOutlineItem,
    VerifyConfigResponse,
)
from app.services.progress import (
    get_or_create_progress,
    get_or_create_progress_map,
    get_project_id_from_progress,
)
from app.services.authoring import get_working_snapshot, hotspots_from_json, slide_to_response

from app.services.verify import run_lesson_verify

router = APIRouter(tags=["lessons"])


def _hotspots_from_json(data: dict) -> list[HotspotItem]:
    return hotspots_from_json(data)


def _slide_to_response(slide: LessonSlide) -> LessonSlideResponse:
    return slide_to_response(slide)


def _lesson_status(lesson_state: LessonState | None) -> str:
    if not lesson_state:
        return "not_started"
    return lesson_state.status


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    modules = db.query(Module).filter(Module.is_published.is_(True)).order_by(Module.sort_order, Module.id).all()
    if not modules:
        return DashboardResponse(modules=[])

    module_ids = [module.id for module in modules]
    progress_map = get_or_create_progress_map(db, current_user.id, module_ids)
    progress_ids = [progress.id for progress in progress_map.values()]

    all_lessons = (
        db.query(Lesson)
        .filter(Lesson.module_id.in_(module_ids))
        .order_by(Lesson.module_id, Lesson.sort_order)
        .all()
    )
    lessons_by_module: dict[str, list[Lesson]] = defaultdict(list)
    for lesson in all_lessons:
        lessons_by_module[lesson.module_id].append(lesson)

    lesson_ids = [lesson.id for lesson in all_lessons]
    slide_count_map: dict[str, int] = {}
    if lesson_ids:
        slide_count_map = dict(
            db.query(LessonSlide.lesson_id, func.count(LessonSlide.id))
            .filter(LessonSlide.lesson_id.in_(lesson_ids))
            .group_by(LessonSlide.lesson_id)
            .all()
        )

    lesson_states_by_progress: dict = defaultdict(dict)
    if progress_ids:
        for state in db.query(LessonState).filter(LessonState.user_progress_id.in_(progress_ids)).all():
            lesson_states_by_progress[state.user_progress_id][state.lesson_id] = state

    completed_count_map: dict = {}
    if progress_ids:
        completed_count_map = dict(
            db.query(LessonState.user_progress_id, func.count(LessonState.id))
            .filter(
                LessonState.user_progress_id.in_(progress_ids),
                LessonState.status == "completed",
            )
            .group_by(LessonState.user_progress_id)
            .all()
        )

    total_lessons_map = dict(
        db.query(Lesson.module_id, func.count(Lesson.id))
        .filter(Lesson.module_id.in_(module_ids), Lesson.is_optional.is_(False))
        .group_by(Lesson.module_id)
        .all()
    )

    result: list[ModuleDashboardItem] = []
    for module in modules:
        progress = progress_map[module.id]
        lesson_states = lesson_states_by_progress.get(progress.id, {})
        module_lessons = lessons_by_module.get(module.id, [])

        lesson_items = [
            LessonListItem(
                id=lesson.id,
                order=lesson.sort_order,
                title=lesson.title,
                summary=lesson.summary,
                tags=list(lesson.tags or []),
                status=_lesson_status(lesson_states.get(lesson.id)),
                slide_count=slide_count_map.get(lesson.id, 0),
            )
            for lesson in module_lessons
        ]

        result.append(
            ModuleDashboardItem(
                id=module.id,
                title=module.title,
                description=module.description,
                status=progress.status,
                progress_percent=progress.progress_percent,
                total_lessons=total_lessons_map.get(module.id, 0),
                completed_lessons=completed_count_map.get(progress.id, 0),
                lessons=lesson_items,
            )
        )

    return DashboardResponse(modules=result)


@router.get("/modules/{module_id}/lessons")
def list_module_lessons(
    module_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    module = _get_published_module(db, module_id)
    progress = get_or_create_progress(db, current_user.id, module_id)
    db.refresh(progress)

    lessons = db.query(Lesson).filter(Lesson.module_id == module.id).order_by(Lesson.sort_order).all()
    lesson_states = {
        state.lesson_id: state
        for state in db.query(LessonState)
        .filter(LessonState.user_progress_id == progress.id)
        .all()
    }

    slide_count_map: dict[str, int] = {}
    if lessons:
        lesson_ids = [lesson.id for lesson in lessons]
        slide_count_rows = (
            db.query(LessonSlide.lesson_id, func.count(LessonSlide.id))
            .filter(LessonSlide.lesson_id.in_(lesson_ids))
            .group_by(LessonSlide.lesson_id)
            .all()
        )
        slide_count_map = dict(slide_count_rows)

    return {
        "module_id": module.id,
        "title": module.title,
        "progress_percent": progress.progress_percent,
        "lessons": [
            {
                "id": lesson.id,
                "order": lesson.sort_order,
                "title": lesson.title,
                "summary": lesson.summary,
                "status": _lesson_status(lesson_states.get(lesson.id)),
                "slide_count": slide_count_map.get(lesson.id, 0),
            }
            for lesson in lessons
        ],
    }


def _lesson_payload_parts(
    fields: str | None,
    include: str | None,
) -> tuple[bool, bool]:
    """Return (load_slides, load_quiz). Default: both True."""
    if fields == "meta":
        return False, False
    if include:
        parts = {part.strip() for part in include.split(",") if part.strip()}
        return "slides" in parts, "quiz" in parts
    return True, True


@router.get("/lessons/{lesson_id}", response_model=LessonDetailResponse)
def get_lesson(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    draft: Annotated[bool, Query(alias="draft")] = False,
    fields: Annotated[str | None, Query()] = None,
    include: Annotated[str | None, Query()] = None,
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "lesson_not_found", "message": "Урок не найден"},
        )

    if draft and current_user.role != "author":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "forbidden", "message": "Черновик доступен только методисту"},
        )

    module = _get_published_module(db, lesson.module_id)
    progress = get_or_create_progress(db, current_user.id, module.id)
    db.refresh(progress)

    load_slides, load_quiz = _lesson_payload_parts(fields, include)

    snapshot = get_working_snapshot(db, lesson) if draft else None
    if snapshot and load_slides:
        slide_items = [
            LessonSlideResponse(
                id=slide["id"],
                order=slide["sort_order"],
                title=slide["title"],
                caption_html=slide.get("caption_html", ""),
                expected_result_html=slide.get("expected_result_html", ""),
                image_path=slide.get("image_path", "/content/placeholder-slide.svg"),
                hotspots=_hotspots_from_json({"hotspots": slide.get("hotspots", [])}),
            )
            for slide in snapshot.get("slides", [])
        ]
        lesson_title = snapshot.get("title", lesson.title)
        lesson_summary = snapshot.get("summary", lesson.summary)
        lesson_tags = list(snapshot.get("tags") or [])
        lesson_instruction = snapshot.get("instruction_html", lesson.instruction_html)
        lesson_deep_link = snapshot.get("deep_link_template", lesson.deep_link_template)
        verify_type = snapshot.get("verify_type", lesson.verify_type)
        verify_config = snapshot.get("verify_config", lesson.verify_config or {})
    elif snapshot:
        slide_items = []
        lesson_title = snapshot.get("title", lesson.title)
        lesson_summary = snapshot.get("summary", lesson.summary)
        lesson_tags = list(snapshot.get("tags") or [])
        lesson_instruction = snapshot.get("instruction_html", lesson.instruction_html)
        lesson_deep_link = snapshot.get("deep_link_template", lesson.deep_link_template)
        verify_type = snapshot.get("verify_type", lesson.verify_type)
        verify_config = snapshot.get("verify_config", lesson.verify_config or {})
    elif load_slides:
        slides = (
            db.query(LessonSlide).filter(LessonSlide.lesson_id == lesson.id).order_by(LessonSlide.sort_order).all()
        )
        slide_items = [_slide_to_response(slide) for slide in slides]
        lesson_title = lesson.title
        lesson_summary = lesson.summary
        lesson_tags = list(lesson.tags or [])
        lesson_instruction = lesson.instruction_html
        lesson_deep_link = lesson.deep_link_template
        verify_type = lesson.verify_type
        verify_config = lesson.verify_config or {}
    else:
        slide_items = []
        lesson_title = lesson.title
        lesson_summary = lesson.summary
        lesson_tags = list(lesson.tags or [])
        lesson_instruction = lesson.instruction_html
        lesson_deep_link = lesson.deep_link_template
        verify_type = lesson.verify_type
        verify_config = lesson.verify_config or {}

    lesson_states = (
        db.query(LessonState)
        .filter(LessonState.user_progress_id == progress.id)
        .join(Lesson)
        .order_by(Lesson.sort_order)
        .all()
    )
    project_id = get_project_id_from_progress(db, progress.id)

    quiz_payload: QuizModuleResponse | None = None
    if load_quiz and verify_type == "quiz_passed":
        quiz_payload = QuizModuleResponse(
            module_id=module.id,
            pass_threshold_percent=int((verify_config or {}).get("pass_threshold_percent", module.pass_threshold_percent)),
            questions=get_module_quiz(db, module),
        )

    all_lessons = db.query(Lesson).filter(Lesson.module_id == module.id).order_by(Lesson.sort_order).all()
    state_map = {state.lesson_id: state for state in lesson_states}

    return LessonDetailResponse(
        id=lesson.id,
        module_id=module.id,
        module_title=module.title,
        order=lesson.sort_order,
        title=lesson_title,
        summary=lesson_summary,
        tags=lesson_tags,
        instruction_html=lesson_instruction,
        deep_link=lesson_deep_link,
        verify=VerifyConfigResponse(type=verify_type, config=verify_config),
        progress_percent=progress.progress_percent,
        project_id=project_id,
        lesson_states=[
            LessonStateResponse(
                lesson_id=state.lesson_id,
                status=state.status,
                completed_at=state.completed_at.isoformat() if state.completed_at else None,
                verify_result=state.verify_result,
            )
            for state in lesson_states
        ],
        module_lessons=[
            ModuleLessonOutlineItem(
                id=item.id,
                order=item.sort_order,
                title=item.title,
                status=_lesson_status(state_map.get(item.id)),
            )
            for item in all_lessons
        ],
        slides=slide_items,
        quiz=quiz_payload,
    )


@router.post("/lessons/{lesson_id}/start")
def start_lesson(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail={"detail": "lesson_not_found", "message": "Урок не найден"})

    _get_published_module(db, lesson.module_id)
    progress = get_or_create_progress(db, current_user.id, lesson.module_id)
    lesson_state = (
        db.query(LessonState)
        .filter(LessonState.user_progress_id == progress.id, LessonState.lesson_id == lesson_id)
        .first()
    )
    if not lesson_state:
        raise HTTPException(status_code=404, detail={"detail": "lesson_not_found", "message": "Урок не найден"})

    if lesson_state.status == "locked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "invalid_lesson_transition",
                "message": "Сначала завершите предыдущие уроки",
            },
        )

    now = datetime.now(UTC)
    if not lesson_state.started_at:
        lesson_state.started_at = now
        lesson_state.status = "active"
        if progress.status == "not_started":
            progress.status = "in_progress"
            progress.started_at = now
        db.commit()

    return {"lesson_id": lesson_id, "started_at": lesson_state.started_at.isoformat()}


@router.post("/lessons/{lesson_id}/verify")
def verify_lesson(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail={"detail": "lesson_not_found", "message": "Урок не найден"})

    _get_published_module(db, lesson.module_id)
    progress = get_or_create_progress(db, current_user.id, lesson.module_id)
    lesson_state = (
        db.query(LessonState)
        .filter(LessonState.user_progress_id == progress.id, LessonState.lesson_id == lesson_id)
        .first()
    )
    if not lesson_state:
        raise HTTPException(status_code=404, detail={"detail": "lesson_not_found", "message": "Урок не найден"})

    if lesson_state.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "lesson_already_completed", "message": "Урок уже выполнен"},
        )

    if lesson_state.status == "locked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "invalid_lesson_transition",
                "message": "Сначала завершите предыдущие уроки",
            },
        )

    return run_lesson_verify(db, progress, lesson, lesson_state)
