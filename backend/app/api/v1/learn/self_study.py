from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models.self_study import SelfStudyAssignment, SelfStudyStep, SelfStudyStepState
from app.models.user import User
from app.schemas.self_study import (
    SelfStudyAssignmentDetailResponse,
    SelfStudyAssignmentListItem,
    SelfStudyAssignmentListResponse,
    SelfStudyStepResponse,
    SelfStudyStepStateResponse,
    VerifyConfigResponse,
)
from app.services.self_study_progress import (
    count_completed_self_study_steps,
    get_or_create_self_study_progress,
    get_or_create_self_study_progress_map,
    get_project_id_from_self_study_progress,
    complete_self_study_step_and_advance,
)
from app.services.verify import run_self_study_verify

router = APIRouter(prefix="/self-study", tags=["self-study"])


def _get_published_assignment(db: Session, assignment_id: str) -> SelfStudyAssignment:
    assignment = db.get(SelfStudyAssignment, assignment_id)
    if not assignment or not assignment.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "assignment_not_found", "message": "Задание не найдено"},
        )
    return assignment


def _step_to_response(step: SelfStudyStep) -> SelfStudyStepResponse:
    return SelfStudyStepResponse(
        id=step.id,
        order=step.sort_order,
        title=step.title,
        instruction_html=step.instruction_html,
        deep_link=step.deep_link_template,
        verify=VerifyConfigResponse(type=step.verify_type, config=step.verify_config or {}),
    )


def _assignment_detail(
    db: Session,
    assignment: SelfStudyAssignment,
    user_id,
) -> SelfStudyAssignmentDetailResponse:
    progress = get_or_create_self_study_progress(db, user_id, assignment.id)
    db.refresh(progress)

    steps = (
        db.query(SelfStudyStep)
        .filter(SelfStudyStep.assignment_id == assignment.id)
        .order_by(SelfStudyStep.sort_order)
        .all()
    )
    step_states = (
        db.query(SelfStudyStepState)
        .filter(SelfStudyStepState.self_study_progress_id == progress.id)
        .join(SelfStudyStep)
        .order_by(SelfStudyStep.sort_order)
        .all()
    )
    project_id = get_project_id_from_self_study_progress(db, progress.id)
    total_steps = len(steps)
    completed_steps = count_completed_self_study_steps(db, progress.id)

    return SelfStudyAssignmentDetailResponse(
        id=assignment.id,
        title=assignment.title,
        description=assignment.description,
        status=progress.status,
        progress_percent=progress.progress_percent,
        current_step_id=progress.current_step_id,
        project_id=project_id,
        steps=[_step_to_response(step) for step in steps],
        step_states=[
            SelfStudyStepStateResponse(
                step_id=state.step_id,
                status=state.status,
                completed_at=state.completed_at.isoformat() if state.completed_at else None,
                verify_result=state.verify_result,
            )
            for state in step_states
        ],
    )


@router.get("/assignments", response_model=SelfStudyAssignmentListResponse)
def list_assignments(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    assignments = (
        db.query(SelfStudyAssignment)
        .filter(SelfStudyAssignment.is_published.is_(True))
        .order_by(SelfStudyAssignment.sort_order, SelfStudyAssignment.id)
        .all()
    )
    if not assignments:
        return SelfStudyAssignmentListResponse(items=[])

    assignment_ids = [assignment.id for assignment in assignments]
    step_count_map = dict(
        db.query(SelfStudyStep.assignment_id, func.count(SelfStudyStep.id))
        .filter(SelfStudyStep.assignment_id.in_(assignment_ids))
        .group_by(SelfStudyStep.assignment_id)
        .all()
    )

    progress_by_assignment = get_or_create_self_study_progress_map(db, current_user.id, assignment_ids)
    progress_ids = [progress.id for progress in progress_by_assignment.values()]

    completed_count_map: dict = {}
    if progress_ids:
        completed_count_map = dict(
            db.query(SelfStudyStepState.self_study_progress_id, func.count(SelfStudyStepState.id))
            .filter(
                SelfStudyStepState.self_study_progress_id.in_(progress_ids),
                SelfStudyStepState.status == "completed",
            )
            .group_by(SelfStudyStepState.self_study_progress_id)
            .all()
        )

    items: list[SelfStudyAssignmentListItem] = []
    for assignment in assignments:
        progress = progress_by_assignment[assignment.id]
        items.append(
            SelfStudyAssignmentListItem(
                id=assignment.id,
                title=assignment.title,
                description=assignment.description,
                status=progress.status,
                progress_percent=progress.progress_percent,
                total_steps=step_count_map.get(assignment.id, 0),
                completed_steps=completed_count_map.get(progress.id, 0),
            )
        )
    return SelfStudyAssignmentListResponse(items=items)


@router.get("/assignments/{assignment_id}", response_model=SelfStudyAssignmentDetailResponse)
def get_assignment(
    assignment_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    assignment = _get_published_assignment(db, assignment_id)
    return _assignment_detail(db, assignment, current_user.id)


@router.post("/assignments/{assignment_id}/steps/{step_id}/start")
def start_step(
    assignment_id: str,
    step_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    _get_published_assignment(db, assignment_id)
    progress = get_or_create_self_study_progress(db, current_user.id, assignment_id)
    step_state = (
        db.query(SelfStudyStepState)
        .filter(
            SelfStudyStepState.self_study_progress_id == progress.id,
            SelfStudyStepState.step_id == step_id,
        )
        .first()
    )
    if not step_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "step_not_found", "message": "Шаг не найден"},
        )

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


@router.post("/assignments/{assignment_id}/steps/{step_id}/verify")
def verify_step(
    assignment_id: str,
    step_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    assignment = _get_published_assignment(db, assignment_id)
    step = db.get(SelfStudyStep, step_id)
    if not step or step.assignment_id != assignment.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "step_not_found", "message": "Шаг не найден"},
        )

    progress = get_or_create_self_study_progress(db, current_user.id, assignment_id)
    step_state = (
        db.query(SelfStudyStepState)
        .filter(
            SelfStudyStepState.self_study_progress_id == progress.id,
            SelfStudyStepState.step_id == step_id,
        )
        .first()
    )
    if not step_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "step_not_found", "message": "Шаг не найден"},
        )

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

    return run_self_study_verify(db, progress, step, step_state)


@router.post("/assignments/{assignment_id}/steps/{step_id}/complete-manual")
def complete_manual(
    assignment_id: str,
    step_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    _get_published_assignment(db, assignment_id)
    progress = get_or_create_self_study_progress(db, current_user.id, assignment_id)
    step_state = (
        db.query(SelfStudyStepState)
        .filter(
            SelfStudyStepState.self_study_progress_id == progress.id,
            SelfStudyStepState.step_id == step_id,
        )
        .first()
    )
    if not step_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "step_not_found", "message": "Шаг не найден"},
        )

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

    step = db.get(SelfStudyStep, step_id)
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

    complete_self_study_step_and_advance(
        db,
        progress,
        step_state,
        verify_result={"passed": True},
    )
    return {"step_id": step_id, "status": "completed"}
