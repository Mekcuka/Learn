"""Orientation module seed content."""

from app.seed.constants import CONTENT_BASE

ORIENTATION_LESSONS = [
    {
        "id": "lesson-01-login-context",
        "sort_order": 1,
        "title": "Учебный аккаунт",
        "summary": "Вход в учебную систему",
        "tags": ["Старт"],
        "instruction_html": "<p>Ознакомьтесь с процедурой входа под учебной учётной записью.</p>",
        "deep_link_template": None,
        "verify_type": "manual",
        "verify_config": {},
        "slides": [
            {
                "id": "lesson-01-slide-01",
                "sort_order": 1,
                "title": "Экран входа",
                "caption_html": "<p>Найдите форму входа на учебном портале.</p>",
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
        "summary": "Создайте первый учебный проект",
        "tags": ["Проекты"],
        "instruction_html": "<p>Изучите шаги создания проекта по слайдам и подтвердите выполнение.</p>",
        "deep_link_template": None,
        "verify_type": "manual",
        "verify_config": {},
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
        "tags": ["Интерфейс"],
        "instruction_html": "<p>Ознакомьтесь с основными разделами интерфейса.</p>",
        "deep_link_template": None,
        "verify_type": "manual",
        "verify_config": {},
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
        "tags": ["Задачи"],
        "instruction_html": "<p>Изучите журнал задач и просмотрите примеры записей.</p>",
        "deep_link_template": None,
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
        "prompt_html": "<p>Где создаётся новый проект в учебном интерфейсе?</p>",
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
        "prompt_html": "<p>Что нужно сделать после входа, чтобы перейти к работе с проектом?</p>",
        "options": [
            {"id": "a", "text": "Создать или открыть проект из списка"},
            {"id": "b", "text": "Сразу запустить расчёт без проекта"},
        ],
        "correct_option_ids": ["a"],
    },
]
