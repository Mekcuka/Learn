from pydantic import BaseModel, Field


class VerifyConfigResponse(BaseModel):
    type: str
    config: dict = Field(default_factory=dict)


class SelfStudyStepResponse(BaseModel):
    id: str
    order: int
    title: str
    instruction_html: str
    deep_link: str | None
    verify: VerifyConfigResponse


class SelfStudyStepStateResponse(BaseModel):
    step_id: str
    status: str
    completed_at: str | None
    verify_result: dict | None


class SelfStudyAssignmentListItem(BaseModel):
    id: str
    title: str
    description: str | None
    status: str
    progress_percent: int
    total_steps: int
    completed_steps: int


class SelfStudyAssignmentListResponse(BaseModel):
    items: list[SelfStudyAssignmentListItem]


class SelfStudyAssignmentDetailResponse(BaseModel):
    id: str
    title: str
    description: str | None
    status: str
    progress_percent: int
    current_step_id: str | None
    project_id: str | None
    steps: list[SelfStudyStepResponse]
    step_states: list[SelfStudyStepStateResponse]
