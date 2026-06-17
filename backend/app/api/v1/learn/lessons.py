from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.learn.modules import _get_published_module
from app.db import get_db
from app.models.lesson import Lesson, LessonSlide, LessonState
from app.models.module import Module
from app.schemas.quiz import QuizModuleResponse
from app.services.quiz import get_module_quiz
from app.models.training_account import TrainingAccount
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
    count_completed_lessons,
    get_or_create_progress,
    get_project_id_from_progress,
)
from app.services.verify import run_lesson_verify

router = APIRouter(tags=["lessons"])


def _hotspots_from_json(data: dict) -> list[HotspotItem]:
    items = data.get("hotspots", []) if data else []
    return [HotspotItem(**item) for item in items]


def _slide_to_response(slide: LessonSlide) -> LessonSlideResponse:
    return LessonSlideResponse(
        id=slide.id,
        order=slide.sort_order,
        title=slide.title,
        caption_html=slide.caption_html,
        expected_result_html=slide.expected_result_html,
        image_path=slide.image_path,
        hotspots=_hotspots_from_json(slide.hotspots or {}),
    )


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
    result: list[ModuleDashboardItem] = []

    for module in modules:
        progress = get_or_create_progress(db, current_user.id, module.id)
        db.refresh(progress)

        lessons = db.query(Lesson).filter(Lesson.module_id == module.id).order_by(Lesson.sort_order).all()
        lesson_states = {
            state.lesson_id: state
            for state in db.query(LessonState)
            .filter(LessonState.user_progress_id == progress.id)
            .all()
        }

        slide_count_map: dict[str, int] = {}
        for lesson in lessons:
            slide_count_map[lesson.id] = (
                db.query(LessonSlide).filter(LessonSlide.lesson_id == lesson.id).count()
            )

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
            for lesson in lessons
        ]

        total = db.query(Lesson).filter(Lesson.module_id == module.id, Lesson.is_optional.is_(False)).count()
        completed = count_completed_lessons(db, progress.id)

        result.append(
            ModuleDashboardItem(
                id=module.id,
                title=module.title,
                description=module.description,
                status=progress.status,
                progress_percent=progress.progress_percent,
                total_lessons=total,
                completed_lessons=completed,
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
                "slide_count": db.query(LessonSlide).filter(LessonSlide.lesson_id == lesson.id).count(),
            }
            for lesson in lessons
        ],
    }


@router.get("/lessons/{lesson_id}", response_model=LessonDetailResponse)
def get_lesson(
    lesson_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "lesson_not_found", "message": "Урок не найден"},
        )

    module = _get_published_module(db, lesson.module_id)
    progress = get_or_create_progress(db, current_user.id, module.id)
    db.refresh(progress)

    slides = db.query(LessonSlide).filter(LessonSlide.lesson_id == lesson.id).order_by(LessonSlide.sort_order).all()
    lesson_states = (
        db.query(LessonState)
        .filter(LessonState.user_progress_id == progress.id)
        .join(Lesson)
        .order_by(Lesson.sort_order)
        .all()
    )
    project_id = get_project_id_from_progress(db, progress.id)

    quiz_payload: QuizModuleResponse | None = None
    if lesson.verify_type == "quiz_passed":
        quiz_payload = QuizModuleResponse(
            module_id=module.id,
            pass_threshold_percent=int(
                (lesson.verify_config or {}).get("pass_threshold_percent", module.pass_threshold_percent)
            ),
            questions=get_module_quiz(db, module),
        )

    all_lessons = db.query(Lesson).filter(Lesson.module_id == module.id).order_by(Lesson.sort_order).all()
    state_map = {state.lesson_id: state for state in lesson_states}

    return LessonDetailResponse(
        id=lesson.id,
        module_id=module.id,
        module_title=module.title,
        order=lesson.sort_order,
        title=lesson.title,
        summary=lesson.summary,
        tags=list(lesson.tags or []),
        instruction_html=lesson.instruction_html,
        deep_link=lesson.deep_link_template,
        verify=VerifyConfigResponse(type=lesson.verify_type, config=lesson.verify_config or {}),
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
        slides=[_slide_to_response(slide) for slide in slides],
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

    training_account = (
        db.query(TrainingAccount).filter(TrainingAccount.user_id == current_user.id).first()
    )
    return run_lesson_verify(db, progress, lesson, lesson_state, training_account)
