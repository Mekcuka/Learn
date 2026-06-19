"""Catalog modules seed content (data-import, clustering, map)."""

from sqlalchemy.orm import Session

from app.seed.constants import PLACEHOLDER_SLIDE, RETIRED_LESSON_IDS
from app.seed.orientation import ORIENTATION_LESSONS, ORIENTATION_STEPS, QUIZ_PLACEHOLDERS

def _remove_retired_lessons(db: Session) -> None:
    from app.models.lesson import Lesson, LessonSlide, LessonState

    for lesson_id in RETIRED_LESSON_IDS:
        lesson = db.get(Lesson, lesson_id)
        if not lesson:
            continue
        db.query(LessonSlide).filter(LessonSlide.lesson_id == lesson_id).delete()
        db.query(LessonState).filter(LessonState.lesson_id == lesson_id).delete()
        db.delete(lesson)


def _manual_lesson(
    *,
    lesson_id: str,
    sort_order: int,
    title: str,
    summary: str,
    instruction: str,
    deep_link: str | None = None,
    tags: list[str] | None = None,
) -> dict:
    return {
        "id": lesson_id,
        "sort_order": sort_order,
        "title": title,
        "summary": summary,
        "tags": tags or [],
        "instruction_html": f"<p>{instruction}</p>",
        "deep_link_template": deep_link,
        "verify_type": "manual",
        "verify_config": {},
        "slides": [
            {
                "id": f"{lesson_id}-slide-01",
                "sort_order": 1,
                "title": title,
                "caption_html": f"<p>{instruction}</p>",
                "expected_result_html": "<p>Вы выполнили шаг по инструкции и готовы к проверке.</p>",
                "image_path": PLACEHOLDER_SLIDE,
                "hotspots": {"hotspots": []},
            },
        ],
    }


DATA_IMPORT_LESSONS = [
    _manual_lesson(
        lesson_id="lesson-import-overview",
        sort_order=1,
        title="Обзор импорта",
        summary="Где находится раздел импорта данных в проекте",
        instruction="Откройте раздел импорта данных в проекте.",
        tags=["Данные"],
    ),
    _manual_lesson(
        lesson_id="lesson-import-layers",
        sort_order=2,
        title="Импорт слоёв",
        summary="Подключение векторных и растровых слоёв",
        instruction="Добавьте слой на карту проекта через импорт.",
        tags=["Данные", "Карта"],
    ),
]

CLUSTERING_LESSONS = [
    _manual_lesson(
        lesson_id="lesson-cluster-overview",
        sort_order=1,
        title="Что такое кустование",
        summary="Назначение кустов и связь со скважинами",
        instruction="Ознакомьтесь с разделом кустования в интерфейсе проекта.",
        tags=["Кустование", "Интерфейс"],
    ),
    _manual_lesson(
        lesson_id="lesson-cluster-create",
        sort_order=2,
        title="Создание куста",
        summary="Новый куст на карте проекта",
        instruction="Создайте учебный куст по инструкции.",
        tags=["Кустование"],
    ),
    _manual_lesson(
        lesson_id="lesson-cluster-wells",
        sort_order=3,
        title="Скважины в кусте",
        summary="Привязка скважин к кусту",
        instruction="Добавьте скважины в созданный куст.",
        tags=["Кустование"],
    ),
]

MAP_LESSONS = [
    _manual_lesson(
        lesson_id="lesson-map-overview",
        sort_order=1,
        title="Интерфейс карты",
        summary="Панели, масштаб и базовые инструменты",
        instruction="Откройте карту проекта и изучите панель инструментов.",
        tags=["Карта", "Интерфейс"],
    ),
    _manual_lesson(
        lesson_id="lesson-map-layers",
        sort_order=2,
        title="Слои карты",
        summary="Включение и настройка слоёв",
        instruction="Включите нужные слои на карте проекта.",
        tags=["Карта", "Данные"],
    ),
    _manual_lesson(
        lesson_id="lesson-map-objects",
        sort_order=3,
        title="Объекты на карте",
        summary="POI, инфраструктура и выделение объектов",
        instruction="Найдите и выделите объект на карте.",
        tags=["Карта"],
    ),
]

MODULE_SPECS = [
    {
        "id": "orientation-v1",
        "sort_order": 1,
        "title": "Основной интерфейс",
        "description": "Вход, проекты, навигация, журнал задач",
        "steps": ORIENTATION_STEPS,
        "lessons": ORIENTATION_LESSONS,
        "quiz_questions": QUIZ_PLACEHOLDERS,
    },
    {
        "id": "data-import-v1",
        "sort_order": 2,
        "title": "Импорт данных",
        "description": "Загрузка POI, слоёв и табличных данных в проект",
        "steps": [],
        "lessons": DATA_IMPORT_LESSONS,
        "quiz_questions": [],
    },
    {
        "id": "clustering-v1",
        "sort_order": 3,
        "title": "Кустование",
        "description": "Создание кустов и привязка скважин",
        "steps": [],
        "lessons": CLUSTERING_LESSONS,
        "quiz_questions": [],
    },
    {
        "id": "map-v1",
        "sort_order": 4,
        "title": "Карта",
        "description": "Работа с картой, слоями и объектами проекта",
        "steps": [],
        "lessons": MAP_LESSONS,
        "quiz_questions": [],
    },
]
