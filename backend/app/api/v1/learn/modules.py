from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models.module import Module, Step
from app.models.lesson import Lesson
from app.models.progress import StepState
from app.models.user import User
from app.schemas.modules import (
    ModuleDetailResponse,
    ModuleListItem,
    ModuleListResponse,
    StepResponse,
    VerifyConfigResponse,
)
from app.services.progress import (
    complete_step_and_advance,
    count_completed_lessons,
    count_completed_steps,
    get_or_create_progress,
    get_project_id_from_progress,
)
from app.schemas.quiz import QuizModuleResponse, QuizSubmitRequest, QuizSubmitResponse
from app.services.quiz import get_module_quiz, submit_module_quiz
from app.services.verify import run_verify

router = APIRouter(tags=["modules"])


def _step_to_response(step: Step) -> StepResponse:
    return StepResponse(
        id=step.id,
        order=step.sort_order,
        title=step.title,
        instruction_html=step.instruction_html,
        deep_link=step.deep_link_template,
        verify=VerifyConfigResponse(type=step.verify_type, config=step.verify_config or {}),
    )


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
        total_steps = db.query(Step).filter(Step.module_id == module.id, Step.is_optional.is_(False)).count()
        total_lessons = db.query(Lesson).filter(Lesson.module_id == module.id, Lesson.is_optional.is_(False)).count()
        completed = count_completed_lessons(db, progress.id) if total_lessons else count_completed_steps(db, progress.id)
        total = total_lessons or total_steps
        items.append(
            ModuleListItem(
                id=module.id,
                title=module.title,
                description=module.description,
                status=progress.status,
                progress_percent=progress.progress_percent,
                total_steps=total,
                completed_steps=completed,
            )
        )
    return ModuleListResponse(items=items)


@router.get("/modules/{module_id}", response_model=ModuleDetailResponse)
def get_module(
    module_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    module = _get_published_module(db, module_id)
    get_or_create_progress(db, current_user.id, module.id)
    steps = db.query(Step).filter(Step.module_id == module.id).order_by(Step.sort_order).all()
    return ModuleDetailResponse(
        id=module.id,
        title=module.title,
        steps=[_step_to_response(step) for step in steps],
    )


@router.get("/modules/{module_id}/steps")
def get_module_steps(
    module_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    module = _get_published_module(db, module_id)
    progress = get_or_create_progress(db, current_user.id, module_id)
    db.refresh(progress)
    step_states = (
        db.query(StepState)
        .filter(StepState.user_progress_id == progress.id)
        .join(Step)
        .order_by(Step.sort_order)
        .all()
    )
    project_id = get_project_id_from_progress(db, progress.id)
    steps = db.query(Step).filter(Step.module_id == module.id).order_by(Step.sort_order).all()
    return {
        "module_id": module.id,
        "title": module.title,
        "current_step_id": progress.current_step_id,
        "progress_percent": progress.progress_percent,
        "project_id": project_id,
        "steps": [_step_to_response(step).model_dump() for step in steps],
        "step_states": [
            {
                "step_id": state.step_id,
                "status": state.status,
                "completed_at": state.completed_at.isoformat() if state.completed_at else None,
                "verify_result": state.verify_result,
            }
            for state in step_states
        ],
    }


@router.get("/modules/{module_id}/progress")
def get_progress(
    module_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    module = _get_published_module(db, module_id)
    progress = get_or_create_progress(db, current_user.id, module.id)
    step_states = (
        db.query(StepState)
        .filter(StepState.user_progress_id == progress.id)
        .join(Step)
        .order_by(Step.sort_order)
        .all()
    )
    return {
        "module_id": module.id,
        "current_step_id": progress.current_step_id,
        "step_states": [
            {
                "step_id": state.step_id,
                "status": state.status,
                "completed_at": state.completed_at.isoformat() if state.completed_at else None,
                "verify_result": state.verify_result,
            }
            for state in step_states
        ],
    }


@router.post("/modules/{module_id}/steps/{step_id}/start")
def start_step(
    module_id: str,
    step_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    _get_published_module(db, module_id)
    progress = get_or_create_progress(db, current_user.id, module_id)
    step_state = (
        db.query(StepState)
        .filter(StepState.user_progress_id == progress.id, StepState.step_id == step_id)
        .first()
    )
    if not step_state:
        raise HTTPException(status_code=404, detail={"detail": "module_not_found", "message": "Шаг не найден"})

    if step_state.status == "locked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "invalid_step_transition",
                "message": "Сначала выполните предыдущие шаги",
            },
        )

    now = datetime.now(UTC)
    if not step_state.started_at:
        step_state.started_at = now
        step_state.status = "active"
        if progress.status == "not_started":
            progress.status = "in_progress"
            progress.started_at = now
        db.commit()

    return {"step_id": step_id, "started_at": step_state.started_at.isoformat()}


@router.post("/modules/{module_id}/steps/{step_id}/verify")
def verify_step(
    module_id: str,
    step_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    module = _get_published_module(db, module_id)
    step = db.get(Step, step_id)
    if not step or step.module_id != module.id:
        raise HTTPException(status_code=404, detail={"detail": "module_not_found", "message": "Шаг не найден"})

    progress = get_or_create_progress(db, current_user.id, module_id)
    step_state = (
        db.query(StepState)
        .filter(StepState.user_progress_id == progress.id, StepState.step_id == step_id)
        .first()
    )
    if not step_state:
        raise HTTPException(status_code=404, detail={"detail": "module_not_found", "message": "Шаг не найден"})

    if step_state.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "step_already_completed", "message": "Шаг уже выполнен"},
        )

    if step_state.status == "locked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "invalid_step_transition",
                "message": "Сначала выполните предыдущие шаги",
            },
        )

    return run_verify(db, progress, step, step_state)


@router.post("/modules/{module_id}/steps/{step_id}/complete-manual")
def complete_manual(
    module_id: str,
    step_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    _get_published_module(db, module_id)
    progress = get_or_create_progress(db, current_user.id, module_id)
    step_state = (
        db.query(StepState)
        .filter(StepState.user_progress_id == progress.id, StepState.step_id == step_id)
        .first()
    )
    if not step_state:
        raise HTTPException(status_code=404, detail={"detail": "module_not_found", "message": "Шаг не найден"})

    if step_state.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "step_already_completed", "message": "Шаг уже выполнен"},
        )

    if step_state.status == "locked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "invalid_step_transition",
                "message": "Сначала выполните предыдущие шаги",
            },
        )

    step = db.get(Step, step_id)
    if not step or step.verify_type not in {"manual", "navigation"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "invalid_step_transition",
                "message": "Для этого шага используйте проверку выполнения",
            },
        )

    if not step_state.started_at:
        step_state.started_at = datetime.now(UTC)
        step_state.status = "active"

    complete_step_and_advance(
        db,
        progress,
        step_state,
        verify_result={"passed": True},
    )
    return {"step_id": step_id, "status": "completed"}


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
