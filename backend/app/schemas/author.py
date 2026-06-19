from pydantic import BaseModel, Field

from app.schemas.lessons import HotspotItem, LessonSlideResponse, VerifyConfigResponse


class AuthorModuleItem(BaseModel):
    id: str
    title: str
    description: str | None
    sort_order: int
    is_published: bool
    lesson_count: int


class AuthorLessonListItem(BaseModel):
    id: str
    order: int
    title: str
    summary: str | None
    slide_count: int
    verify_type: str
    has_unpublished_changes: bool = False


class AuthorLessonDetail(BaseModel):
    id: str
    module_id: str
    module_title: str
    order: int
    title: str
    summary: str | None
    tags: list[str] = []
    instruction_html: str
    deep_link_template: str | None
    verify: VerifyConfigResponse
    is_optional: bool
    slides: list[LessonSlideResponse]
    has_unpublished_changes: bool = False
    published_at: str | None = None


class DuplicateLessonRequest(BaseModel):
    new_id: str | None = None
    title_suffix: str = " (копия)"


class CreateRevisionRequest(BaseModel):
    label: str | None = None


class LessonRevisionItem(BaseModel):
    id: str
    created_at: str
    author_user_id: str | None
    summary: str | None


class LessonRevisionListResponse(BaseModel):
    items: list[LessonRevisionItem]


class CreateLessonRequest(BaseModel):
    id: str | None = None
    title: str
    summary: str | None = None
    instruction_html: str = ""
    deep_link_template: str | None = None
    verify_type: str = "manual"
    verify_config: dict = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)


class UpdateLessonRequest(BaseModel):
    title: str | None = None
    summary: str | None = None
    instruction_html: str | None = None
    deep_link_template: str | None = None
    verify_type: str | None = None
    verify_config: dict | None = None
    sort_order: int | None = None
    is_optional: bool | None = None
    tags: list[str] | None = None


class CreateSlideRequest(BaseModel):
    id: str | None = None
    title: str
    caption_html: str = ""
    expected_result_html: str = ""
    image_path: str = "/content/placeholder-slide.svg"
    hotspots: list[HotspotItem] = Field(default_factory=list)


class UpdateSlideRequest(BaseModel):
    title: str | None = None
    caption_html: str | None = None
    expected_result_html: str | None = None
    image_path: str | None = None
    hotspots: list[HotspotItem] | None = None
    sort_order: int | None = None


class UpdateSlideResponse(BaseModel):
    slide: LessonSlideResponse
    has_unpublished_changes: bool


class ReorderSlidesRequest(BaseModel):
    slide_ids: list[str]


class ReorderLessonsRequest(BaseModel):
    lesson_ids: list[str]


class LessonExportPayload(BaseModel):
    id: str
    module_id: str
    sort_order: int
    title: str
    summary: str | None
    instruction_html: str
    deep_link_template: str | None
    verify_type: str
    verify_config: dict
    is_optional: bool
    tags: list[str] = Field(default_factory=list)
    slides: list[dict]


class LessonImportRequest(BaseModel):
    lesson: LessonExportPayload


class AuthorQuizOption(BaseModel):
    id: str
    text: str


class AuthorQuizQuestion(BaseModel):
    id: str
    order: int
    prompt_html: str
    options: list[AuthorQuizOption]
    correct_option_ids: list[str]


class AuthorQuizResponse(BaseModel):
    module_id: str
    pass_threshold_percent: int
    questions: list[AuthorQuizQuestion]


class UpdateModuleQuizRequest(BaseModel):
    pass_threshold_percent: int | None = None
    questions: list[AuthorQuizQuestion]
