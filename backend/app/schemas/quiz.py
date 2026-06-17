from pydantic import BaseModel, Field


class QuizOptionPublic(BaseModel):
    id: str
    text: str


class QuizQuestionPublic(BaseModel):
    id: str
    order: int
    prompt_html: str
    options: list[QuizOptionPublic]
    allow_multiple: bool = False


class QuizModuleResponse(BaseModel):
    module_id: str
    pass_threshold_percent: int
    questions: list[QuizQuestionPublic]


class QuizAnswerItem(BaseModel):
    question_id: str
    selected_option_ids: list[str] = Field(default_factory=list)


class QuizSubmitRequest(BaseModel):
    answers: list[QuizAnswerItem]
    lesson_id: str | None = None


class QuizQuestionResult(BaseModel):
    question_id: str
    correct: bool


class QuizSubmitResponse(BaseModel):
    passed: bool
    score_percent: int
    pass_threshold_percent: int
    results: list[QuizQuestionResult]
    lesson_completed: bool = False
