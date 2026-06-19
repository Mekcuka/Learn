from pydantic import BaseModel


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
