import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.lesson import Lesson, LessonSlide
from app.models.module import Module, QuizQuestion, Step
from app.models.training_account import TrainingAccount
from app.models.user import User
from app.services.auth import hash_password
from app.services.crypto import encrypt_secret

DEMO_UI_BASE = "https://97.60.spark.modeltech.ru"
CONTENT_BASE = "/content/orientation-v1"

ORIENTATION_STEPS = [
    {
        "id": "step-01-login-context",
        "sort_order": 1,
        "title": "Учебный аккаунт",
        "instruction_html": "<p>Войдите в демо-приложение под учебным аккаунтом.</p>",
        "deep_link_template": f"{DEMO_UI_BASE}/projects?learn_step=login-context",
        "verify_type": "manual",
        "verify_config": {},
    },
    {
        "id": "step-02-create-project",
        "sort_order": 2,
        "title": "Создание проекта",
        "instruction_html": "<p>Создайте новый учебный проект в демо.</p>",
        "deep_link_template": f"{DEMO_UI_BASE}/projects?learn_step=create-project",
        "verify_type": "resource_exists",
        "verify_config": {
            "demo_endpoint": "GET /api/v1/projects",
            "resource_type": "project",
            "match": {"created_after_step_start": True},
        },
    },
    {
        "id": "step-03-navigation",
        "sort_order": 3,
        "title": "Навигация по интерфейсу",
        "instruction_html": "<p>Ознакомьтесь с основными разделами.</p>",
        "deep_link_template": f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=navigation",
        "verify_type": "navigation",
        "verify_config": {"fallback": "manual"},
    },
    {
        "id": "step-04-job-journal",
        "sort_order": 4,
        "title": "Журнал задач",
        "instruction_html": "<p>Откройте панель журнала задач.</p>",
        "deep_link_template": f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=job-journal",
        "verify_type": "manual",
        "verify_config": {},
    },
    {
        "id": "step-05-mini-quiz",
        "sort_order": 5,
        "title": "Мини-квиз",
        "instruction_html": "<p>Ответьте на вопросы по пройденному материалу.</p>",
        "deep_link_template": None,
        "verify_type": "quiz_passed",
        "verify_config": {"pass_threshold_percent": 80},
    },
]

ORIENTATION_LESSONS = [
    {
        "id": "lesson-01-login-context",
        "sort_order": 1,
        "title": "Учебный аккаунт",
        "summary": "Вход в демо-приложение под учебной учётной записью",
        "tags": ["Старт", "Демо"],
        "instruction_html": "<p>Войдите в демо-приложение под учебным аккаунтом, указанным администратором курса.</p>",
        "deep_link_template": f"{DEMO_UI_BASE}/projects?learn_step=login-context",
        "verify_type": "manual",
        "verify_config": {},
        "slides": [
            {
                "id": "lesson-01-slide-01",
                "sort_order": 1,
                "title": "Экран входа",
                "caption_html": "<p>Откройте демо-приложение и найдите форму входа.</p>",
                "expected_result_html": "<p>Откроется страница авторизации с полями email и пароль.</p>",
                "image_path": f"{CONTENT_BASE}/lesson-01-login/slide-01.svg",
                "hotspots": {
                    "hotspots": [
                        {
                            "id": "login-email",
                            "label": "Поле email",
                            "x_pct": 35,
                            "y_pct": 42,
                            "width_pct": 30,
                            "height_pct": 6,
                            "pulse": True,
                        },
                        {
                            "id": "login-submit",
                            "label": "Кнопка «Войти»",
                            "x_pct": 35,
                            "y_pct": 55,
                            "width_pct": 12,
                            "height_pct": 5,
                            "pulse": True,
                        },
                    ]
                },
            },
            {
                "id": "lesson-01-slide-02",
                "sort_order": 2,
                "title": "Успешный вход",
                "caption_html": "<p>После входа вы попадёте на страницу проектов.</p>",
                "expected_result_html": "<p>В шапке отображается ваш пользователь, доступен список проектов.</p>",
                "image_path": f"{CONTENT_BASE}/lesson-01-login/slide-02.svg",
                "hotspots": {"hotspots": []},
            },
        ],
    },
    {
        "id": "lesson-02-create-project",
        "sort_order": 2,
        "title": "Создание проекта",
        "summary": "Создайте первый учебный проект в демо",
        "tags": ["Демо", "Проекты"],
        "instruction_html": "<p>Создайте новый проект и вернитесь для проверки.</p>",
        "deep_link_template": f"{DEMO_UI_BASE}/projects?learn_step=create-project",
        "verify_type": "resource_exists",
        "verify_config": {
            "demo_endpoint": "GET /api/v1/projects",
            "resource_type": "project",
            "match": {"created_after_step_start": True},
        },
        "slides": [
            {
                "id": "lesson-02-slide-01",
                "sort_order": 1,
                "title": "Список проектов",
                "caption_html": "<p>На странице проектов нажмите кнопку создания.</p>",
                "expected_result_html": "<p>Откроется форма или диалог создания проекта.</p>",
                "image_path": f"{CONTENT_BASE}/lesson-02-create-project/slide-01.svg",
                "hotspots": {
                    "hotspots": [
                        {
                            "id": "create-btn",
                            "label": "Кнопка «Создать проект»",
                            "x_pct": 82,
                            "y_pct": 10,
                            "width_pct": 14,
                            "height_pct": 5,
                            "pulse": True,
                        }
                    ]
                },
            },
            {
                "id": "lesson-02-slide-02",
                "sort_order": 2,
                "title": "Форма проекта",
                "caption_html": "<p>Укажите имя проекта и сохраните.</p>",
                "expected_result_html": "<p>Проект появится в списке на странице проектов.</p>",
                "image_path": f"{CONTENT_BASE}/lesson-02-create-project/slide-02.svg",
                "hotspots": {
                    "hotspots": [
                        {
                            "id": "project-name",
                            "label": "Имя проекта",
                            "x_pct": 30,
                            "y_pct": 35,
                            "width_pct": 40,
                            "height_pct": 6,
                            "pulse": True,
                        }
                    ]
                },
            },
            {
                "id": "lesson-02-slide-03",
                "sort_order": 3,
                "title": "Проект создан",
                "caption_html": "<p>Убедитесь, что новый проект виден в списке.</p>",
                "expected_result_html": "<p>Строка с вашим проектом отображается в таблице.</p>",
                "image_path": f"{CONTENT_BASE}/lesson-02-create-project/slide-03.svg",
                "hotspots": {"hotspots": []},
            },
        ],
    },
    {
        "id": "lesson-03-navigation",
        "sort_order": 3,
        "title": "Навигация по интерфейсу",
        "summary": "Карта, объекты и основные разделы",
        "tags": ["Интерфейс", "Демо"],
        "instruction_html": "<p>Ознакомьтесь с основными разделами интерфейса.</p>",
        "deep_link_template": f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=navigation",
        "verify_type": "navigation",
        "verify_config": {"fallback": "manual", "learn_step": "navigation"},
        "slides": [
            {
                "id": "lesson-03-slide-01",
                "sort_order": 1,
                "title": "Боковое меню",
                "caption_html": "<p>Изучите пункты бокового меню проекта.</p>",
                "expected_result_html": "<p>Доступны разделы: карта, объекты, расчёты и др.</p>",
                "image_path": f"{CONTENT_BASE}/lesson-03-navigation/slide-01.svg",
                "hotspots": {
                    "hotspots": [
                        {
                            "id": "sidebar",
                            "label": "Боковая панель навигации",
                            "x_pct": 2,
                            "y_pct": 15,
                            "width_pct": 18,
                            "height_pct": 60,
                            "pulse": True,
                        }
                    ]
                },
            },
            {
                "id": "lesson-03-slide-02",
                "sort_order": 2,
                "title": "Карта",
                "caption_html": "<p>Откройте раздел с картой.</p>",
                "expected_result_html": "<p>Отображается карта проекта с объектами.</p>",
                "image_path": f"{CONTENT_BASE}/lesson-03-navigation/slide-02.svg",
                "hotspots": {"hotspots": []},
            },
        ],
    },
    {
        "id": "lesson-04-job-journal",
        "sort_order": 4,
        "title": "Журнал задач",
        "summary": "Где смотреть статус расчётов и операций",
        "tags": ["Демо", "Задачи"],
        "instruction_html": "<p>Откройте журнал задач и просмотрите записи.</p>",
        "deep_link_template": f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=job-journal",
        "verify_type": "manual",
        "verify_config": {},
        "slides": [
            {
                "id": "lesson-04-slide-01",
                "sort_order": 1,
                "title": "Панель журнала",
                "caption_html": "<p>Найдите и откройте панель журнала задач.</p>",
                "expected_result_html": "<p>Отображается список задач с их статусами.</p>",
                "image_path": f"{CONTENT_BASE}/lesson-04-job-journal/slide-01.svg",
                "hotspots": {
                    "hotspots": [
                        {
                            "id": "journal-tab",
                            "label": "Вкладка «Журнал задач»",
                            "x_pct": 70,
                            "y_pct": 8,
                            "width_pct": 15,
                            "height_pct": 5,
                            "pulse": True,
                        }
                    ]
                },
            },
            {
                "id": "lesson-04-slide-02",
                "sort_order": 2,
                "title": "Запись в журнале",
                "caption_html": "<p>Обратите внимание на статусы задач.</p>",
                "expected_result_html": "<p>Видны статусы: выполнено, в процессе, ошибка.</p>",
                "image_path": f"{CONTENT_BASE}/lesson-04-job-journal/slide-02.svg",
                "hotspots": {"hotspots": []},
            },
        ],
    },
    {
        "id": "lesson-05-mini-quiz",
        "sort_order": 5,
        "title": "Мини-квиз",
        "summary": "Проверка знаний по пройденному материалу",
        "tags": ["Квиз", "Learn"],
        "instruction_html": "<p>Ответьте на вопросы по пройденному материалу.</p>",
        "deep_link_template": None,
        "verify_type": "quiz_passed",
        "verify_config": {"pass_threshold_percent": 80},
        "slides": [],
    },
]

QUIZ_PLACEHOLDERS = [
    {
        "id": "q1",
        "sort_order": 1,
        "prompt_html": "<p>Где создаётся новый проект в демо-приложении?</p>",
        "options": [
            {"id": "a", "text": "На странице проектов"},
            {"id": "b", "text": "В журнале задач"},
            {"id": "c", "text": "В настройках профиля"},
        ],
        "correct_option_ids": ["a"],
    },
    {
        "id": "q2",
        "sort_order": 2,
        "prompt_html": "<p>Где находится боковое меню навигации по разделам проекта?</p>",
        "options": [
            {"id": "a", "text": "Слева на экране проекта"},
            {"id": "b", "text": "В шапке сайта"},
            {"id": "c", "text": "Только на странице входа"},
        ],
        "correct_option_ids": ["a"],
    },
    {
        "id": "q3",
        "sort_order": 3,
        "prompt_html": "<p>Для чего нужен журнал задач?</p>",
        "options": [
            {"id": "a", "text": "Смотреть статус расчётов и операций"},
            {"id": "b", "text": "Менять пароль учётной записи"},
            {"id": "c", "text": "Создавать новые проекты"},
        ],
        "correct_option_ids": ["a"],
    },
    {
        "id": "q4",
        "sort_order": 4,
        "prompt_html": "<p>Какой аккаунт используется для прохождения курса?</p>",
        "options": [
            {"id": "a", "text": "Учебный аккаунт, выданный администратором"},
            {"id": "b", "text": "Любой продакшен-аккаунт компании"},
        ],
        "correct_option_ids": ["a"],
    },
    {
        "id": "q5",
        "sort_order": 5,
        "prompt_html": "<p>Что нужно сделать после входа в демо, чтобы перейти к работе с проектом?</p>",
        "options": [
            {"id": "a", "text": "Создать или открыть проект из списка"},
            {"id": "b", "text": "Сразу запустить расчёт без проекта"},
        ],
        "correct_option_ids": ["a"],
    },
]

PLACEHOLDER_SLIDE = "/content/placeholder-slide.svg"

# Уроки, снятые с каталога — удаляются при seed (слайды и состояния прогресса).
RETIRED_LESSON_IDS = frozenset({"lesson-import-poi"})


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
                "expected_result_html": "<p>Вы выполнили шаг в демо-приложении и готовы к проверке.</p>",
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
        instruction="Откройте раздел импорта данных в демо-приложении.",
        deep_link=f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=data-import",
        tags=["Данные", "Демо"],
    ),
    _manual_lesson(
        lesson_id="lesson-import-layers",
        sort_order=2,
        title="Импорт слоёв",
        summary="Подключение векторных и растровых слоёв",
        instruction="Добавьте слой на карту проекта через импорт.",
        deep_link=f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=import-layers",
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
        deep_link=f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=clustering",
        tags=["Кустование", "Интерфейс"],
    ),
    _manual_lesson(
        lesson_id="lesson-cluster-create",
        sort_order=2,
        title="Создание куста",
        summary="Новый куст на карте проекта",
        instruction="Создайте учебный куст в демо-приложении.",
        deep_link=f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=cluster-create",
        tags=["Кустование", "Демо"],
    ),
    _manual_lesson(
        lesson_id="lesson-cluster-wells",
        sort_order=3,
        title="Скважины в кусте",
        summary="Привязка скважин к кусту",
        instruction="Добавьте скважины в созданный куст.",
        deep_link=f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=cluster-wells",
        tags=["Кустование", "Демо"],
    ),
]

MAP_LESSONS = [
    _manual_lesson(
        lesson_id="lesson-map-overview",
        sort_order=1,
        title="Интерфейс карты",
        summary="Панели, масштаб и базовые инструменты",
        instruction="Откройте карту проекта и изучите панель инструментов.",
        deep_link=f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=map",
        tags=["Карта", "Интерфейс"],
    ),
    _manual_lesson(
        lesson_id="lesson-map-layers",
        sort_order=2,
        title="Слои карты",
        summary="Включение и настройка слоёв",
        instruction="Включите нужные слои на карте проекта.",
        deep_link=f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=map-layers",
        tags=["Карта", "Данные"],
    ),
    _manual_lesson(
        lesson_id="lesson-map-objects",
        sort_order=3,
        title="Объекты на карте",
        summary="POI, инфраструктура и выделение объектов",
        instruction="Найдите и выделите объект на карте.",
        deep_link=f"{DEMO_UI_BASE}/projects/{{project_id}}?learn_step=map-objects",
        tags=["Карта", "Демо"],
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


def _sync_lesson_metadata(db: Session, module_id: str, lessons: list[dict]) -> None:
    for lesson_data in lessons:
        lesson = db.get(Lesson, lesson_data["id"])
        if lesson and lesson.module_id == module_id:
            lesson.sort_order = lesson_data["sort_order"]
            if "tags" in lesson_data:
                lesson.tags = lesson_data["tags"]


def _add_lessons_to_module(db: Session, module_id: str, lessons: list[dict]) -> None:
    _sync_lesson_metadata(db, module_id, lessons)
    for lesson_data in lessons:
        if db.get(Lesson, lesson_data["id"]):
            continue
        slides = lesson_data.get("slides", [])
        lesson_fields = {key: value for key, value in lesson_data.items() if key != "slides"}
        lesson_id = lesson_fields["id"]
        db.add(Lesson(module_id=module_id, **lesson_fields))
        for slide_data in slides:
            db.add(LessonSlide(lesson_id=lesson_id, **slide_data))


def _add_steps_to_module(db: Session, module_id: str, steps: list[dict]) -> None:
    for step_data in steps:
        if db.get(Step, step_data["id"]):
            continue
        db.add(Step(module_id=module_id, **step_data))


def _add_quiz_to_module(db: Session, module_id: str, questions: list[dict]) -> None:
    for question in questions:
        if db.get(QuizQuestion, question["id"]):
            continue
        db.add(QuizQuestion(module_id=module_id, **question))


def seed_module(db: Session, spec: dict) -> None:
    module = db.get(Module, spec["id"])
    if module:
        module.title = spec["title"]
        module.description = spec["description"]
        module.sort_order = spec["sort_order"]
        module.is_published = True
        _add_steps_to_module(db, module.id, spec.get("steps", []))
        _add_lessons_to_module(db, module.id, spec.get("lessons", []))
        _add_quiz_to_module(db, module.id, spec.get("quiz_questions", []))
        db.commit()
        return

    module = Module(
        id=spec["id"],
        title=spec["title"],
        description=spec["description"],
        scenario_version=1,
        sort_order=spec["sort_order"],
        is_published=True,
        pass_threshold_percent=80,
    )
    db.add(module)
    db.flush()

    _add_steps_to_module(db, module.id, spec.get("steps", []))
    _add_lessons_to_module(db, module.id, spec.get("lessons", []))
    _add_quiz_to_module(db, module.id, spec.get("quiz_questions", []))
    db.commit()


def seed_all_modules(db: Session) -> None:
    _remove_retired_lessons(db)
    for spec in MODULE_SPECS:
        seed_module(db, spec)


def seed_orientation_module(db: Session) -> None:
    """Deprecated alias — seeds all catalog modules."""
    seed_all_modules(db)


def seed_training_accounts(db: Session) -> None:
    settings = get_settings()
    seed_path = Path(__file__).resolve().parent.parent.parent / settings.seed_accounts_path
    if not seed_path.exists():
        accounts = [
            {
                "learn_email": "student@training.local",
                "learn_password": "learn123",
                "demo_email": "demo@training.local",
                "demo_password": "demo123",
                "display_name": "Ученик 1",
                "role": "student",
            },
            {
                "learn_email": "author@training.local",
                "learn_password": "author123",
                "demo_email": "demo@training.local",
                "demo_password": "demo123",
                "display_name": "Методист",
                "role": "author",
            },
        ]
    else:
        accounts = json.loads(seed_path.read_text(encoding="utf-8"))

    if db.query(User).count() == 0:
        for account in accounts:
            _create_user_from_account(db, account, settings)
        db.commit()
        return

    _ensure_author_account(db, settings, accounts)


def _create_user_from_account(db: Session, account: dict, settings) -> None:
    user = User(
        email=account["learn_email"],
        password_hash=hash_password(account["learn_password"]),
        display_name=account.get("display_name", account["learn_email"]),
        role=account.get("role", "student"),
    )
    db.add(user)
    db.flush()
    if account.get("demo_email") and account.get("demo_password"):
        db.add(
            TrainingAccount(
                user_id=user.id,
                demo_email=account["demo_email"],
                demo_password_encrypted=encrypt_secret(settings.secret_key, account["demo_password"]),
            )
        )


def _ensure_author_account(db: Session, settings, accounts: list[dict]) -> None:
    author_spec = next((a for a in accounts if a.get("role") == "author"), None)
    if not author_spec:
        return
    author = db.query(User).filter(User.email == author_spec["learn_email"]).first()
    if author:
        if author.role != "author":
            author.role = "author"
            db.commit()
        return
    _create_user_from_account(db, author_spec, settings)
    db.commit()


def run_seed(db: Session) -> None:
    seed_all_modules(db)
    seed_training_accounts(db)
