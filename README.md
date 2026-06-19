# Learn Portal

Образовательный портал: уроки со слайдами, wiki, самостоятельная работа, редактор методиста.

## Возможности

| Область | Описание |
|---------|----------|
| **Уроки** | Каталог модулей → уроки со слайдами, hotspots, verify (manual / квиз) |
| **Самостоятельная работа** | Отдельные задания с пошаговым подтверждением (`/self-study`) |
| **Wiki** | Справочные статьи для ученика (`/wiki`) |
| **Редактор методиста** | `/author` — уроки, слайды, hotspots, квиз, wiki |
| **Verify** | `manual`, `quiz_passed` (только Learn) |

## Требования

- Python 3.11+
- Node.js 20+
- Docker (опционально, для PostgreSQL)

## Первый запуск

Чеклист для чистой машины:

1. **PostgreSQL** — docker-compose, порт **5433** на хосте.
2. **Миграции** — `alembic upgrade head` (обязательно; ревизия `008_lesson_revisions_drafts`).
3. **Seed** — один раз при старте backend с `SEED_ON_STARTUP=true` (модули, wiki, self-study, учебные аккаунты).
4. **Сервисы** — backend `:8000`, frontend `:5173`.
5. **Учебные аккаунты** — из `backend/seed/training_accounts.json` (см. ниже).

Ниже — полные команды для PowerShell. Корень репозитория: `C:\project\Student` (подставьте свой путь при необходимости).

### 1. PostgreSQL

```powershell
cd C:\project\Student
docker compose -f deploy/docker-compose.yml up -d postgres
docker compose -f deploy/docker-compose.yml ps
```

Контейнер слушает **5433** (`5433:5432`).

### 2. Backend

```powershell
cd C:\project\Student\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env -Force
alembic upgrade head
$env:SEED_ON_STARTUP = "true"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Проверка в другом терминале: http://localhost:8000/health

В `backend/.env` уже задано `DATABASE_URL=postgresql://learn:learn@localhost:5433/learn`. После успешного seed уберите переменную (`Remove-Item Env:SEED_ON_STARTUP`) или поставьте `SEED_ON_STARTUP=false` в `.env` — повторные рестарты будут быстрее.

### 3. Frontend

```powershell
cd C:\project\Student\frontend
npm install
Copy-Item .env.example .env -Force
npm run dev
```

Портал: http://localhost:5173/

Vite проксирует `/api` и `/health` на backend. Для прямого URL API: `VITE_API_URL=http://localhost:8000` в `frontend/.env`.

### Учебные аккаунты (seed)

| Роль | Email | Пароль |
|------|-------|--------|
| Ученик | `student@training.local` | `learn123` |
| Методист | `author@training.local` | `author123` |

**Авторизация временно отключена** (`AUTH_ENABLED=false`) — портал открывается на `/` без входа, запросы идут от ученика. Чтобы включить JWT: `AUTH_ENABLED=true` в `backend/.env`.

Редактор методиста локально: `AUTHORING_ENABLED=true` (backend) + `VITE_AUTHORING_ENABLED=true` (frontend) → http://localhost:5173/author

Подробнее: [content-authoring.md](docs/features/learn/content-authoring.md)

### Маршруты

| Маршрут | Назначение |
|---------|------------|
| `/` | Главная: Уроки, Самостоятельная работа, Wiki |
| `/dashboard` | Каталог модулей |
| `/lessons/{id}` | Урок (слайды, hotspots, verify) |
| `/self-study`, `/self-study/{id}` | Самостоятельная работа |
| `/wiki`, `/wiki/{id}` | Wiki |
| `/author`, `/author/wiki` | Редактор методиста |

## Переменные окружения

Шаблоны: `backend/.env.example`, `frontend/.env.example`, `deploy/.env.example`.

### Backend (`backend/.env`)

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `DATABASE_URL` | `localhost:5433/learn` | PostgreSQL (docker-compose → порт 5433) |
| `SECRET_KEY` | `change-me-in-local-dev` | Подпись JWT |
| `SEED_ON_STARTUP` | `false` | Запуск seed при старте uvicorn; `true` — только первый раз или после очистки БД |
| `DB_CREATE_ALL` | `false` | Dev fallback: `create_all` без Alembic. **Не** использовать вместо миграций в обычной разработке |
| `AUTH_ENABLED` | `false` | `false` — без входа; `true` — JWT по учебным аккаунтам |
| `AUTHORING_ENABLED` | `true` (в example) | `/author` без JWT (локально) |
| `SEED_ACCOUNTS_PATH` | `seed/training_accounts.json` | Файл учебных аккаунтов |
| `CONTENT_ROOT` | `../frontend/public/content` | Статика контента (скрины уроков) |

### Frontend (`frontend/.env`)

| Переменная | Назначение |
|------------|------------|
| `VITE_AUTHORING_ENABLED` | Показать маршруты `/author` |
| `VITE_API_URL` | Прямой URL API (опционально; иначе Vite proxy) |

## Повседневная разработка

PostgreSQL уже запущен, миграции применены, seed выполнен — два терминала:

```powershell
# Терминал 1 — backend
cd C:\project\Student\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```powershell
# Терминал 2 — frontend
cd C:\project\Student\frontend
npm run dev
```

Сборка production-статики:

```powershell
cd C:\project\Student\frontend
npm run build
```

Результат: `frontend/dist/`.

### Тесты

```powershell
cd C:\project\Student\backend
.\.venv\Scripts\Activate.ps1
pytest -q
```

```powershell
cd C:\project\Student\frontend
npm run test
npm run lint
```

### E2E (Playwright)

Подготовка (один раз): PostgreSQL на `:5433`, миграции, зависимости Playwright.

```powershell
cd C:\project\Student
docker compose -f deploy/docker-compose.yml up -d postgres

cd C:\project\Student\backend
.\.venv\Scripts\Activate.ps1
alembic upgrade head

cd C:\project\Student\frontend
npm install
npx playwright install chromium
```

Запуск E2E — Playwright сам поднимет backend и frontend (`playwright.config.ts`). **Активируйте venv backend** в этом терминале, чтобы `python` находил зависимости:

```powershell
cd C:\project\Student\backend
.\.venv\Scripts\Activate.ps1

cd C:\project\Student\frontend
npm run test:e2e
```

При auto-start backend получает `SEED_ON_STARTUP=true`, `AUTH_ENABLED=false`, `DATABASE_URL=postgresql://learn:learn@localhost:5433/learn`.

Если backend и frontend уже запущены вручную:

```powershell
cd C:\project\Student\frontend
$env:PLAYWRIGHT_SKIP_SERVER = "1"
npm run test:e2e
```

В CI PostgreSQL слушает `:5432`; локально — `:5433`.

Захват скринов с демо-стенда:

```powershell
cd C:\project\Student\frontend
$env:DEMO_EMAIL = "your@demo.account"
$env:DEMO_PASSWORD = "secret"
npm run capture:screens
```

## Troubleshooting

| Симптом | Решение |
|---------|---------|
| Пустой каталог, нет модулей/wiki | Seed не выполнен → `cd C:\project\Student\backend; .\.venv\Scripts\Activate.ps1; $env:SEED_ON_STARTUP="true"; uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` |
| «Загрузка…» на каталоге, ошибки API | Миграции не применены → `cd C:\project\Student\backend; .\.venv\Scripts\Activate.ps1; alembic upgrade head` |
| Backend не подключается к БД | Проверьте `DATABASE_URL` (порт **5433**) и `docker compose -f deploy/docker-compose.yml ps` |
| Порт 5433 / 8000 / 5173 занят | Остановите старый процесс или смените порт в compose / uvicorn / Vite |
| E2E: backend не стартует | Активируйте `backend\.venv` перед `npm run test:e2e` |
| Обновление с более ранней версии | `cd C:\project\Student\backend; .\.venv\Scripts\Activate.ps1; alembic upgrade head` |

## Структура

```
Student/
├── backend/          # FastAPI + PostgreSQL
├── frontend/         # React + Vite + MUI + TipTap + Playwright
├── deploy/           # docker-compose для PostgreSQL
└── docs/features/    # learn, learn-authoring, wiki, self-study
```

Подробнее для агентов: [AGENTS.md](AGENTS.md).

## Деплой (GitHub Pages)

Репозиторий: [github.com/Mekcuka/Learn](https://github.com/Mekcuka/Learn)

После push в `main` CI прогоняет тесты, затем workflow **Deploy frontend to GitHub Pages** публикует SPA:

- URL: `https://mekcuka.github.io/Learn/`

### Настройка API для прода

GitHub Pages отдаёт только статику. Backend нужно поднять отдельно (VM, Render и т.д.) и указать URL в **Settings → Secrets and variables → Actions → Variables**:

| Variable | Пример |
|----------|--------|
| `VITE_API_URL` | `https://your-api.example.com/api/v1/learn` |
| `VITE_AUTHORING_ENABLED` | `false` |

На backend в `.env` добавьте origin Pages в `CORS_ORIGINS` (по умолчанию уже есть `https://mekcuka.github.io`).

Первый раз включите Pages: **Settings → Pages → Source: GitHub Actions**.
