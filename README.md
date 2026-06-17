# Learn Portal

Образовательный портал для прохождения модуля «Ориентация» с интеграцией в демо-приложение СППР.

## Требования

- Python 3.11+
- Node.js 20+
- Docker (опционально, для PostgreSQL)

## Быстрый старт

### 1. PostgreSQL

```powershell
cd C:\project\Student
docker compose -f deploy/docker-compose.yml up -d postgres
```

### 2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Проверка: http://localhost:8000/health

Учебный аккаунт по умолчанию (из `seed/training_accounts.json`) — используется backend при `AUTH_ENABLED=false`:

- Email: `student@training.local`
- Пароль: `learn123`

**Авторизация временно отключена** — портал открывается сразу на `/dashboard` без входа. Чтобы включить снова: `AUTH_ENABLED=true` в `backend/.env`.

### Редактор уроков (методист)

- Аккаунт: `author@training.local` / `author123`
- Локально без входа: в `backend/.env` → `AUTHORING_ENABLED=true`, во `frontend/.env` → `VITE_AUTHORING_ENABLED=true`
- URL: http://localhost:5173/author
- API: `/api/v1/learn/author/*` (только `role=author`)

Подробнее: [content-authoring.md](docs/features/learn/content-authoring.md), [demo-bridge.md](docs/features/learn/demo-bridge.md)

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

UI построен на [Consta Design System](https://github.com/consta-design-system) (`@consta/uikit`): тема `presetGpnDefault`, компоненты Button, Tag, Tabs, TextField и др. Документация: [uikit.consta.design](http://uikit.consta.design/).

Портал: http://localhost:5173/dashboard

После входа — панель обучения (модули → уроки). Урок открывается по `/lessons/{id}`:

- слайды со скриншотами и hotspots;
- **справочная панель** справа (задание, подсказки, ожидаемый результат, оглавление модуля);
- кнопки «Открыть в демо» и «Проверить выполнение» (с auto-retry при polling verify);
- **мини-квиз** на последнем уроке модуля «Ориентация».

> При обновлении с более ранней версии выполните `alembic upgrade head` (актуально до `005_lesson_tags`). Без миграции backend не стартует, а каталог уроков зависает на «Загрузка…».

Vite проксирует `/api` и `/health` на backend. Для прямого URL API задайте `VITE_API_URL=http://localhost:8000` в `frontend/.env`.

## Тесты

```powershell
# Backend
cd backend
pytest -q

# Frontend (unit)
cd frontend
npm run test
npm run lint

# E2E (нужны backend :8000 и frontend :5173)
cd frontend
npm run test:e2e
```

Захват скринов с демо-стенда (Playwright):

```powershell
cd frontend
$env:DEMO_EMAIL="your@demo.account"
$env:DEMO_PASSWORD="secret"
npm run capture:screens
```

## Структура

```
Student/
├── backend/          # FastAPI + PostgreSQL
├── frontend/         # React + Vite (TipTap, DOMPurify, Playwright)
├── deploy/           # docker-compose для PostgreSQL
└── docs/features/    # learn, learn-authoring, demo-bridge
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
