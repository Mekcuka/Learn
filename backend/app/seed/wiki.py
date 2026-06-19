"""Wiki articles seed content and loader."""

from sqlalchemy.orm import Session

from app.models.wiki_article import WikiArticle

WIKI_ARTICLE_SPECS = [
    {
        "id": "about-learn",
        "sort_order": 1,
        "title": "Что такое Learn Portal",
        "summary": "Зачем нужен портал и как в нём учиться",
        "tags": ["Learn"],
        "body_html": """
      <p><strong>Learn Portal</strong> — учебная платформа с пошаговыми уроками, wiki и самостоятельной работой.</p>
      <img src="/content/orientation-v1/lesson-03-navigation/slide-01.svg" alt="Экран урока с подсветкой интерфейса">
      <ul>
        <li>Уроки со скриншотами и интерактивными зонами</li>
        <li>Подтверждение выполнения заданий кнопкой «Я выполнил»</li>
        <li>Справочная панель на экране урока</li>
      </ul>
      <p>Начните с модуля «Основной интерфейс», затем переходите к тематическим блокам: импорт данных, кустование, карта.</p>
    """,
    },
    {
        "id": "training-account",
        "sort_order": 2,
        "title": "Учебный аккаунт",
        "summary": "Как войти в Learn Portal",
        "tags": ["Старт"],
        "body_html": """
      <p>Для прохождения курса используйте <strong>учебный аккаунт</strong>, выданный администратором.</p>
      <img src="/content/orientation-v1/lesson-01-login/slide-01.svg" alt="Экран входа">
      <p>В первом уроке модуля «Основной интерфейс» изучите инструкцию на слайдах и подтвердите выполнение кнопкой «Я выполнил».</p>
      <p>После входа в портале доступны каталог уроков, wiki и самостоятельная работа.</p>
    """,
    },
    {
        "id": "projects",
        "sort_order": 3,
        "title": "Работа с проектами",
        "summary": "Создание и выбор учебного проекта",
        "tags": ["Проекты"],
        "body_html": """
      <p>Большинство заданий выполняется внутри <strong>проекта</strong> — контейнера для карты, объектов и расчётов.</p>
      <img src="/content/orientation-v1/lesson-02-create-project/slide-01.svg" alt="Список проектов">
      <ol>
        <li>Откройте раздел проектов по инструкции урока</li>
        <li>Создайте проект с учебным именем</li>
        <li>Откройте проект из списка для следующих шагов курса</li>
      </ol>
      <p>После выполнения задания нажмите «Я выполнил» на экране урока.</p>
    """,
    },
    {
        "id": "navigation",
        "sort_order": 4,
        "title": "Навигация по интерфейсу",
        "summary": "Боковое меню, карта, объекты и разделы проекта",
        "tags": ["Интерфейс"],
        "body_html": """
      <p>В открытом проекте основная навигация — <strong>боковая панель слева</strong>: карта, объекты, расчёты и другие разделы.</p>
      <img src="/content/orientation-v1/lesson-03-navigation/slide-01.svg" alt="Боковое меню навигации в проекте">
      <p>На уроках обращайте внимание на подсвеченные зоны скриншота и список «На скрине» в справке — они указывают нужные элементы интерфейса.</p>
    """,
    },
    {
        "id": "job-journal",
        "sort_order": 5,
        "title": "Журнал задач",
        "summary": "Где смотреть статус расчётов и фоновых операций",
        "tags": ["Задачи"],
        "body_html": """
      <p><strong>Журнал задач</strong> показывает ход расчётов и операций: выполнено, в процессе, ошибка.</p>
      <img src="/content/orientation-v1/lesson-04-job-journal/slide-01.svg" alt="Панель журнала задач в проекте">
      <p>Откройте панель журнала по инструкции урока и убедитесь, что видите список записей — затем подтвердите выполнение.</p>
    """,
    },
    {
        "id": "screenshot-tools",
        "sort_order": 6,
        "title": "Работа со скриншотами в уроке",
        "summary": "Зум, метки и справочная панель",
        "tags": ["Learn", "Подсказки"],
        "body_html": """
      <p>На экране урока доступны инструменты просмотра скрина:</p>
      <img src="/content/orientation-v1/lesson-03-navigation/slide-02.svg" alt="Скриншот урока с панелью инструментов">
      <ul>
        <li><strong>Увеличить / уменьшить</strong> — кнопки над изображением или Ctrl + колёсико мыши</li>
        <li><strong>Метки</strong> — показать или скрыть интерактивные зоны</li>
        <li><strong>На весь экран</strong> — развернуть скрин для детального просмотра</li>
      </ul>
      <p>Клик по зоне на скрине синхронизируется со списком в справке справа. При зуме &gt; 100% изображение можно перетаскивать мышью.</p>
    """,
    },
    {
        "id": "data-import",
        "sort_order": 7,
        "title": "Импорт данных",
        "summary": "Загрузка POI и слоёв в проект",
        "tags": ["Данные"],
        "body_html": """
      <p>В модуле «Импорт данных» разбирается загрузка учебных файлов в проект: точечные объекты (POI) и карточные слои.</p>
      <img src="/content/placeholder-slide.svg" alt="Заглушка: раздел импорта данных">
      <p>Следуйте пошаговым инструкциям в уроках модуля и подтверждайте выполнение на экране урока.</p>
    """,
    },
    {
        "id": "map-basics",
        "sort_order": 8,
        "title": "Карта и объекты",
        "summary": "Слои, масштаб и выделение объектов на карте",
        "tags": ["Карта"],
        "body_html": """
      <p>Модуль «Карта» знакомит с панелью инструментов, включением слоёв и работой с объектами на карте проекта.</p>
      <img src="/content/orientation-v1/lesson-02-create-project/slide-02.svg" alt="Карта проекта с объектами">
      <p>Комбинируйте уроки с Wiki: здесь — концепции, в каталоге уроков — пошаговые задания с проверкой.</p>
    """,
    },
]


def seed_wiki_articles(db: Session) -> None:
    for spec in WIKI_ARTICLE_SPECS:
        article = db.get(WikiArticle, spec["id"])
        if article:
            article.sort_order = spec["sort_order"]
            article.title = spec["title"]
            article.summary = spec["summary"]
            article.body_html = spec["body_html"]
            article.tags = list(spec.get("tags", []))
            continue
        db.add(
            WikiArticle(
                id=spec["id"],
                sort_order=spec["sort_order"],
                title=spec["title"],
                summary=spec["summary"],
                body_html=spec["body_html"],
                tags=list(spec.get("tags", [])),
            )
        )
    db.commit()
