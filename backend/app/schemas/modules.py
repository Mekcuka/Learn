from pydantic import BaseModel


class VerifyConfigResponse(BaseModel):
    type: str
    config: dict


class StepResponse(BaseModel):
    id: str
    order: int
    title: str
    instruction_html: str
    deep_link: str | None
    verify: VerifyConfigResponse


class ModuleListItem(BaseModel):
    id: str
    title: str
    description: str | None
    status: str
    progress_percent: int
    total_steps: int
    completed_steps: int


class ModuleListResponse(BaseModel):
    items: list[ModuleListItem]


class ModuleDetailResponse(BaseModel):
    id: str
    title: str
    steps: list[StepResponse]


class ModuleStepsResponse(BaseModel):
    module_id: str
    steps: list[StepResponse]
