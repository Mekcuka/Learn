"""Self-study assignment seed content and loader."""

from sqlalchemy.orm import Session

from app.models.self_study import SelfStudyAssignment, SelfStudyStep

SELF_STUDY_STEPS = [
    {
        "id": "ss-step-01-create-project",
        "sort_order": 1,
        "title": "Создание проекта",
        "instruction_html": (
            "<p>Создайте новый проект для выполнения тестового задания.</p>"
            "<p>Укажите название проекта и сохраните его — он понадобится на следующих шагах.</p>"
        ),
        "deep_link_template": None,
        "verify_type": "manual",
        "verify_config": {},
    },
    {
        "id": "ss-step-02-import-gdp",
        "sort_order": 2,
        "title": "Импорт данных ВВП",
        "instruction_html": (
            "<p>Импортируйте данные ВВП из Excel (лист 4) — макрорегионы по приложению 1.</p>"
            "<p>Загрузите файл через раздел импорта данных.</p>"
        ),
        "deep_link_template": None,
        "verify_type": "manual",
        "verify_config": {},
    },
    {
        "id": "ss-step-03-scenario-params",
        "sort_order": 3,
        "title": "Сценарные параметры",
        "instruction_html": (
            "<p>Настройте сценарные параметры модели:</p>"
            "<ul>"
            "<li>среднегодовой рост ВВП — 20–30%;</li>"
            "<li>рост энергопотребления до 2030 г.;</li>"
            "<li>установленная мощность — 30 ГВт;</li>"
            "<li>привязка к ГЭС и координаты на карте.</li>"
            "</ul>"
            "<p>Настройте электрическую сеть: трансформаторные подстанции 5-й линейкой, "
            "надёжность +200 МВт, мощность линий 500–1000 МВт.</p>"
        ),
        "deep_link_template": None,
        "verify_type": "manual",
        "verify_config": {},
    },
    {
        "id": "ss-step-04-generation-consumption",
        "sort_order": 4,
        "title": "Генерация и потребление",
        "instruction_html": (
            "<p>Добавьте объекты генерации и потребления на карте:</p>"
            "<ul>"
            "<li>2 ветропарка на ветровой карте и буроплощадке на юго-западе;</li>"
            "<li>центры нагрузки в районах потребления;</li>"
            "<li>удельное потребление — 50 МВт/ГВт установленной мощности;</li>"
            "<li>тепловая генерация: до 1300° и 30 лет / 45 лет;</li>"
            "<li>атомная генерация — 10 ГВт;</li>"
            "<li>гидро — с ГЭС или гидроаккумулирующей станцией.</li>"
            "</ul>"
        ),
        "deep_link_template": None,
        "verify_type": "manual",
        "verify_config": {},
    },
    {
        "id": "ss-step-05-fuel-generation",
        "sort_order": 5,
        "title": "Топливная генерация",
        "instruction_html": (
            "<p>Настройте параметры топливной генерации по таблице из задания:</p>"
            "<ul>"
            "<li>удельный расход топлива на электростанции — 3 Гкал/ГВт·ч;</li>"
            "<li>минимальная нагрузка в летний период — 40%;</li>"
            "<li>минимальная нагрузка — 3 ед./ч;</li>"
            "<li>максимальная мощность блока — 190 МВт.</li>"
            "</ul>"
            "<p>Укажите ограничения для генерации: мощность ГЭС 110, 220, 330 и 35 кВ.</p>"
            "<p>Допустимое отклонение напряжения U — не более 10%.</p>"
        ),
        "deep_link_template": None,
        "verify_type": "manual",
        "verify_config": {},
    },
    {
        "id": "ss-step-06-power-grid",
        "sort_order": 6,
        "title": "Импорт электрической сети",
        "instruction_html": (
            "<p>Импортируйте данные электрической сети — 16 трансформаторных подстанций "
            "из списка задания (ТП-5, ТП-9, ТП-Восточная, ТП-Западная и др.).</p>"
            "<p>Разместите подстанции на карте и свяжите с центрами нагрузки.</p>"
        ),
        "deep_link_template": None,
        "verify_type": "manual",
        "verify_config": {},
    },
    {
        "id": "ss-step-07-capex-opex",
        "sort_order": 7,
        "title": "Расчёт CAPEX и OPEX",
        "instruction_html": (
            "<p>Запустите расчётный сценарий в рабочем процессе:</p>"
            "<ul>"
            "<li>импорт данных из Excel (ВВП, цены топлива, сеть);</li>"
            "<li>расчётный сценарий и оптимизация;</li>"
            "<li>расчёт CAPEX и OPEX по методике задания.</li>"
            "</ul>"
            "<p>Убедитесь, что расчёт завершён и результаты доступны в отчётах.</p>"
        ),
        "deep_link_template": None,
        "verify_type": "manual",
        "verify_config": {},
    },
]

SELF_STUDY_ASSIGNMENT = {
    "id": "self-study-test-v1",
    "sort_order": 1,
    "title": "Тестовое задание: модель энергосистемы",
    "description": (
        "Самостоятельная работа по созданию проекта, импорту данных ВВП и сети, "
        "настройке генерации и расчёту CAPEX/OPEX."
    ),
    "steps": SELF_STUDY_STEPS,
}


def seed_self_study(db: Session) -> None:
    spec = SELF_STUDY_ASSIGNMENT
    assignment = db.get(SelfStudyAssignment, spec["id"])
    if assignment:
        assignment.title = spec["title"]
        assignment.description = spec["description"]
        assignment.sort_order = spec["sort_order"]
        assignment.is_published = True
    else:
        assignment = SelfStudyAssignment(
            id=spec["id"],
            title=spec["title"],
            description=spec["description"],
            sort_order=spec["sort_order"],
            is_published=True,
        )
        db.add(assignment)
        db.flush()

    for step_data in spec["steps"]:
        step = db.get(SelfStudyStep, step_data["id"])
        if step:
            step.sort_order = step_data["sort_order"]
            step.title = step_data["title"]
            step.instruction_html = step_data["instruction_html"]
            step.deep_link_template = step_data["deep_link_template"]
            step.verify_type = step_data["verify_type"]
            step.verify_config = step_data["verify_config"]
            continue
        db.add(SelfStudyStep(assignment_id=assignment.id, **step_data))

    db.commit()
