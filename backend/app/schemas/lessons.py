from typing import Literal

from pydantic import BaseModel

from app.schemas.quiz import QuizModuleResponse

HotspotKind = Literal["region", "zoom", "pin"]
HotspotFillColor = Literal[
    "yellow", "blue", "green", "red", "orange", "purple", "pink", "cyan", "gray", "lime"
]
CalloutWidth = Literal["compact", "normal", "wide"]
CalloutSide = Literal["auto", "left", "right", "top", "bottom"]


class HotspotItem(BaseModel):
    id: str
    label: str
    x_pct: float
    y_pct: float
    width_pct: float
    height_pct: float
    kind: HotspotKind = "region"
    pulse: bool = True
    fill_enabled: bool = True
    fill_color: HotspotFillColor | None = None
    border_color: HotspotFillColor | None = None
    description_html: str | None = None
    callout_width: CalloutWidth | None = None
    callout_side: CalloutSide | None = None
    zoom_scale: float | None = None


class LessonSlideResponse(BaseModel):
    id: str
    order: int
    title: str
    caption_html: str
    expected_result_html: str
    image_path: str
    hotspots: list[HotspotItem]


class VerifyConfigResponse(BaseModel):
    type: str
    config: dict


class LessonListItem(BaseModel):
    id: str
    order: int
    title: str
    summary: str | None
    tags: list[str] = []
    status: str
    slide_count: int


class ModuleDashboardItem(BaseModel):
    id: str
    title: str
    description: str | None
    status: str
    progress_percent: int
    total_lessons: int
    completed_lessons: int
    lessons: list[LessonListItem]


class DashboardResponse(BaseModel):
    modules: list[ModuleDashboardItem]


class LessonStateResponse(BaseModel):
    lesson_id: str
    status: str
    completed_at: str | None
    verify_result: dict | None


class ModuleLessonOutlineItem(BaseModel):
    id: str
    order: int
    title: str
    status: str


class LessonDetailResponse(BaseModel):
    id: str
    module_id: str
    module_title: str
    order: int
    title: str
    summary: str | None
    tags: list[str] = []
    instruction_html: str
    deep_link: str | None
    verify: VerifyConfigResponse
    progress_percent: int
    project_id: str | None
    lesson_states: list[LessonStateResponse]
    module_lessons: list[ModuleLessonOutlineItem]
    slides: list[LessonSlideResponse]
    quiz: QuizModuleResponse | None = None
