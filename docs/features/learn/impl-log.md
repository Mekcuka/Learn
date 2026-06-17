# Impl log — Learn Phase 1 (Builder)

**Дата:** 2026-06-17  
**Фаза:** 1 — каркас Learn Portal  
**Статус:** завершена (Builder)

## Цель фазы

Пользователь логинится, видит модуль «Ориентация», прогресс 0%.

## Сделано

### Правки документации

- Опечатка в `orchestration.mdc` («раз development» → «разработки») — **уже была исправлена** до начала работы.

### Backend (`backend/`)

| Компонент | Файлы | Описание |
|-----------|-------|----------|
| Config | `app/config.py`, `.env.example` | `DATABASE_URL`, `SECRET_KEY`, `DEMO_API_BASE_URL`, `DEMO_API_MOCK` |
| DB | `app/db.py` | SQLAlchemy engine, `SessionLocal`, `get_db` |
| Models | `app/models/*` | `users`, `training_accounts`, `modules`, `steps`, `quiz_questions`, `user_progress`, `step_states`, `verify_audit_log` |
| Auth | `app/services/auth.py`, `app/api/v1/learn/auth.py` | bcrypt, JWT, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Modules API | `app/api/v1/learn/modules.py` | `GET /modules`, `GET /modules/{id}`, `GET /modules/{id}/steps`, progress/start/verify/complete-manual/quiz stubs |
| Verify | `app/services/verify.py`, `app/services/demo_client` logic inline | `manual` → pending; `resource_exists` → Demo API или mock pending при `DEMO_API_MOCK=true` |
| Progress | `app/services/progress.py` | Создание `user_progress` + `step_states` при первом запросе |
| Seed | `app/seed/data.py`, `seed/training_accounts.json` | Модуль `orientation-v1` (5 шагов), 1 учебный аккаунт |
| Migrations | `alembic/`, `alembic.ini` | Initial migration `001_initial_schema` |
| Tests | `tests/conftest.py`, `tests/test_auth.py` | login, modules list, health |

### Frontend (`frontend/`)

| Компонент | Файлы | Описание |
|-----------|-------|----------|
| API client | `src/api/learnApi.ts` | Bearer token, `VITE_API_URL` |
| Auth | `src/auth/AuthContext.tsx` | localStorage JWT, `/auth/me` restore |
| Pages | `src/pages/LoginPage.tsx`, `ModulesPage.tsx` | Вход, «Мои модули» с прогрессом 0% |
| Routing | `src/App.tsx`, `src/main.tsx` | react-router-dom, protected `/modules` |
| Tests | `src/App.test.ts` | smoke test `LearnApiError` |
| Env | `.env.example` | `VITE_API_URL` |

### Dev / deploy

- `README.md` — инструкция локального запуска
- `deploy/docker-compose.yml` — PostgreSQL (без изменений)
- `deploy/.env.example`, `backend/.env.example`, `frontend/.env.example` — актуализированы

## Эндпоинты Phase 1 (рабочие)

| Method | Path | Поведение |
|--------|------|-----------|
| POST | `/api/v1/learn/auth/login` | JWT + user |
| GET | `/api/v1/learn/auth/me` | Текущий пользователь |
| GET | `/api/v1/learn/modules` | Список с progress 0% |
| GET | `/api/v1/learn/modules/{id}/steps` | 5 placeholder steps |
| POST | `/api/v1/learn/modules/{id}/steps/{id}/verify` | manual / resource_exists (mock или Demo API) |
| GET | `/health` | `{"status":"ok"}` |

Остальные эндпоинты из `contract.md` — stub/minimal (progress, start, complete-manual, quiz/submit).

## Отложено на Phase 2+

| Тема | Фаза |
|------|------|
| `StepPanel`, UI шагов, deep link CTA | Phase 2 |
| Полный happy path с переходами между шагами | Phase 2 |
| Polling verify engine (step 2 production-ready) | Phase 3 |
| Deep links / tour hooks | Phase 4 |
| Мини-квиз UI + `quiz_passed` | Phase 5 |
| Обработка ошибок Demo API, polish | Phase 6 |
| Phase 2 verify types (`job_completed`, …) | не в MVP |

## Локальный запуск

См. [README.md](../../README.md) в корне репозитория.

## Зависимости (новые)

**Backend:** sqlalchemy, alembic, psycopg2-binary, bcrypt, python-jose, httpx, cryptography, pytest  

**Frontend:** react-router-dom

## Примечания для Reviewer

1. **Fix:** `LoginRequest.email` — `EmailStr` заменён на `str` с regex-валидацией (принимает учебные адреса `*.local`, напр. `student@training.local`).
2. При `DEMO_API_MOCK=true` (в `.env.example`) verify step 2 возвращает mock-pass без вызова Demo API — для dev без доступа к стенду.
3. Seed выполняется при старте приложения (`lifespan`) и в pytest fixtures; Alembic migration — для production-like setup.
4. Demo password хранится encrypted (Fernet derived from `SECRET_KEY`).

---

# Impl log — Learn Phase 2 (Builder)

**Дата:** 2026-06-17  
**Фаза:** 2 — сценарий ориентации (контент + UI шагов)  
**Статус:** завершена (Builder)

## Цель фазы

5 шагов с текстом, `StepPanel`, deep link CTA, переходы между шагами; happy path с mock verify для step 2.

## Сделано

### Backend

| Компонент | Изменения |
|-----------|-----------|
| Seed | `app/seed/data.py` — 5 шагов `orientation-v1` с русскими инструкциями, deep link templates (`learn_step`), verify types |
| Verify | `app/services/verify.py` — `manual` → passed; `navigation` + `fallback: manual` → passed; `resource_exists` → mock pass при `DEMO_API_MOCK=true` |
| Progress | `app/services/progress.py` — блокировка locked шагов, `progress_percent`, `project_id` из step 2 |
| API | `GET /modules/{id}/steps` — flow с `step_states`, `project_id`, `progress_percent` |
| Tests | `tests/test_steps.py` — flow states, manual+mock resource, locked reject, full flow до квиза, progress % |

### Frontend

| Компонент | Файлы | Описание |
|-----------|-------|----------|
| StepPanel | `src/components/StepPanel.tsx` | Шаг N/5, инструкция, «Открыть в демо», «Проверить выполнение», outline locked/active/completed |
| ModulePage | `src/pages/ModulePage.tsx` | Route `/modules/:moduleId`, auto-start текущего шага, refresh после verify |
| Deep links | `src/utils/deepLink.ts` | `return_url`, подстановка `{project_id}`, сохранение `learn_step` |
| ModulesPage | `src/pages/ModulesPage.tsx` | Link на `/modules/{id}` |
| Styles | `src/index.css` | step-panel, outline, status badges |
| Tests | `stepPanel.test.ts`, `deepLink.test.ts` | resolveCurrentStep, buildDeepLink |

## Поведение verify (Phase 2)

| Шаг | verify type | UI action | Backend |
|-----|-------------|-----------|---------|
| 1 — учебный аккаунт | `manual` | «Проверить выполнение» | `POST .../verify` → passed |
| 2 — создание проекта | `resource_exists` | «Открыть в демо» → start; «Проверить» | mock: passed + `mock-project-id`; prod: polling Demo API |
| 3 — навигация | `navigation` (fallback manual) | deep link + «Проверить» | passed |
| 4 — журнал | `manual` | deep link + «Проверить» | passed |
| 5 — квиз | `quiz_passed` | placeholder (Phase 5) | pending |

`started_at` фиксируется при загрузке модуля, после перехода на следующий шаг и при «Открыть в демо» — до создания проекта в демо.

## Deep links

Формат: `https://97.60.spark.modeltech.ru/projects[/{project_id}]?learn_step=...&return_url=<learn module url>`

| step_id | learn_step |
|---------|------------|
| step-01-login-context | `login-context` |
| step-02-create-project | `create-project` |
| step-03-navigation | `navigation` (requires `{project_id}`) |
| step-04-job-journal | `job-journal` (requires `{project_id}`) |

## Тесты

```text
backend:  pytest -q  → 10 passed
frontend: npm test    → 8 passed
```

## Отложено на Phase 3+

| Тема | Фаза |
|------|------|
| Production polling verify step 2 (без mock) | Phase 3 |
| Deep links / tour hooks в UI демо | Phase 4 |
| Мини-квиз UI + `quiz_passed` | Phase 5 |
| Обработка ошибок Demo API, polish | Phase 6 |

---

# Impl log — Learn Phase 2 (Builder)

**Дата:** 2026-06-17  
**Фаза:** 2 — сценарий ориентации (контент + UI шагов)  
**Статус:** завершена (Builder)

## Цель фазы

5 шагов с текстом, `StepPanel`, deep link CTA, переходы между шагами; happy path в mock-режиме без реального Demo API.

## Сделано

### Backend

| Компонент | Файлы | Описание |
|-----------|-------|----------|
| Progress | `app/services/progress.py` | `complete_step_and_advance`, `get_project_id_from_progress`, пересчёт `%` |
| Verify | `app/services/verify.py` | manual/navigation → passed; mock `resource_exists` → passed; unlock next step |
| Modules API | `app/api/v1/learn/modules.py` | `GET .../steps` возвращает steps + step_states + project_id; verify/complete-manual обновляют прогресс |
| Seed | `app/seed/data.py` | deep links с `{project_id}` для шагов 3–4 |
| Tests | `tests/test_steps.py` | flow: start → verify → unlock; locked step 400 |

### Frontend

| Компонент | Файлы | Описание |
|-----------|-------|----------|
| API | `src/api/learnApi.ts` | `getModuleFlow`, `startStep`, `verifyStep`, типы flow |
| Deep links | `src/utils/deepLink.ts` | `buildDeepLink` + `return_url`, подстановка `project_id` |
| StepPanel | `src/components/StepPanel.tsx` | заголовок, инструкция, «Шаг N из 5», CTA, verify feedback, outline |
| Module page | `src/pages/ModulePage.tsx` | `/modules/:moduleId`, auto-start текущего шага |
| Routing | `src/App.tsx`, `ModulesPage.tsx` | ссылка из списка модулей на урок |
| Styles | `src/index.css` | step panel, status colors, outline |
| Tests | `src/utils/deepLink.test.ts`, `src/components/stepPanel.test.ts` | deep link + resolveCurrentStep |

## Поведение verify (Phase 2)

| Тип | POST `/verify` | Mock (`DEMO_API_MOCK=true`) |
|-----|----------------|----------------------------|
| `manual` | `passed`, unlock next | то же |
| `navigation` (fallback manual) | `passed`, unlock next | то же |
| `resource_exists` | Demo API или mock | `passed` + mock `resource_id` |
| `quiz_passed` | `pending` (UI Phase 5) | то же |

## Эндпоинты Phase 2 (расширено)

| Method | Path | Поведение |
|--------|------|-----------|
| GET | `/modules/{id}/steps` | steps + step_states + progress_percent + project_id |
| POST | `.../start` | started_at; reject locked |
| POST | `.../verify` | passed → completed + unlock next + % |
| POST | `.../complete-manual` | manual/navigation confirm (альтернатива verify) |

## Отложено на Phase 3+

| Тема | Фаза |
|------|------|
| Production polling step 2 (без mock) | Phase 3 |
| Tour hooks / deep link parsing в демо | Phase 4 |
| Quiz UI + `quiz_passed` | Phase 5 |

## Примечания для Reviewer

1. При `DEMO_API_MOCK=true` шаг 2 сразу `passed` — для happy path без стенда.
2. Шаг 5 (квиз) отображается, но завершение — Phase 5.
3. `return_url` добавляется на клиенте при открытии демо.

---

# Impl log — Learn Phase 3 (Builder)

**Дата:** 2026-06-17  
**Фаза:** 3 — Verify engine (production `resource_exists`)  
**Статус:** завершена (Builder)

## Цель фазы

Автоматическая проверка шага 2 через Demo API без mock: polling `GET /projects`, Bearer auth из учебного аккаунта, refresh token on 401.

## Сделано

### Backend

| Компонент | Файлы | Описание |
|-----------|-------|----------|
| Demo client | `app/services/demo_client.py` | `POST /auth/login`, `GET /projects`, retry login on 401, polling 5s × ~120s |
| Verify | `app/services/verify.py` | `resource_exists` → `poll_for_project` при `DEMO_API_MOCK=false` |
| Tests | `tests/test_verify_demo.py` | mock httpx 401→retry, poll pass/timeout/unavailable, verify endpoint integration |

### Frontend

| Компонент | Файлы | Описание |
|-----------|-------|----------|
| API errors | `src/api/learnApi.ts` | F1: парсинг вложенного `detail.message` |
| StepPanel | `src/components/StepPanel.tsx` | F4: «Я выполнил» для manual/navigation (fallback manual) |
| Tests | `src/App.test.ts` | parseApiError nested + invalid_credentials |

## Поведение verify step 2 (Phase 3)

| Режим | Поведение |
|-------|-----------|
| `DEMO_API_MOCK=true` | Mock pass (dev без стенда) |
| `DEMO_API_MOCK=false` | Login Demo API → poll `GET /projects` каждые 5s до 2 мин; `created_at >= started_at` → passed; timeout → failed; 5xx → pending |

## Тесты

```text
backend:  pytest -q  → 17 passed
frontend: npm test    → 10 passed
```

## Отложено на Phase 4+

| Тема | Фаза |
|------|------|
| Deep links / tour hooks в UI демо | Phase 4 |
| Мини-квиз UI + `quiz_passed` | Phase 5 |
| F2: единый формат ошибок + `request_id`, HTTP 502/503/504 | Phase 6 |
| F3: скрыть `verify.config` от клиента | polish |

---

# Impl log — Learn Phase «Dashboard & Screenshot guides»

**Дата:** 2026-06-17  
**Фаза:** UI уроков со скриншотами  
**Статус:** завершена (Builder)

## Цель

Стартовая панель «модули → уроки» с прогрессом; экран урока со слайдами, hotspots на скриншотах и блоком «Ожидаемый результат».

## Сделано

### Backend

| Компонент | Описание |
|-----------|----------|
| Models | `lessons`, `lesson_slides`, `lesson_states`; `user_progress.current_lesson_id` |
| Migration | `002_lessons_schema.py` |
| API | `GET /dashboard`, `GET /lessons/{id}`, `POST /lessons/{id}/start`, `POST /lessons/{id}/verify` |
| Seed | 5 уроков orientation + slides + hotspots; placeholder SVG в `frontend/public/content/` |
| Progress | `complete_lesson_and_advance`, sync с deprecated step_states |
| Tests | `tests/test_lessons.py` (4 tests) |

### Frontend

| Компонент | Файлы |
|-----------|-------|
| Dashboard | `pages/DashboardPage.tsx` — модули и список уроков |
| Lesson | `pages/LessonPage.tsx` |
| Screenshot UI | `ScreenshotGuide.tsx`, `SlideCarousel.tsx`, `ExpectedResult.tsx`, `LessonActions.tsx` |
| Routing | `/dashboard`, `/lessons/:lessonId`; `/modules/*` → redirect |
| Removed | `StepPanel`, `ModulePage`, `ModulesPage` (deprecated) |

### Docs

- [content-authoring.md](content-authoring.md)
- Обновлены `contract.md`, `impl-log.md`

## Тесты

```text
backend:  pytest -q  → 21 passed
frontend: npm test    → 7 passed
```

## Отложено

- Admin UI загрузки скринов (частично закрыто `/author` + upload API)
- Production deploy

---

# Impl log — Roadmap tools (Builder)

**Дата:** 2026-06-17  
**Scope:** квиз, UX, authoring, verify polling, Phase 2 `job_completed`, demo bridge  
**Статус:** завершена (Builder)

## Backend

| Компонент | Файлы | Описание |
|-----------|-------|----------|
| Quiz | `app/services/quiz.py`, `app/schemas/quiz.py` | `GET /modules/{id}/quiz`, `POST .../quiz/submit`, grading, `lesson_completed` |
| Lesson API | `app/api/v1/learn/lessons.py` | поле `quiz` в `LessonDetail` для уроков с `quiz_passed` |
| Verify | `app/services/verify.py`, `app/services/demo_client.py` | `job_completed` + `poll_for_job`; seed `learn_step: navigation` |
| Authoring | `app/services/authoring.py` | `job_completed` в `ALLOWED_VERIFY_TYPES` |
| Seed | `app/seed/data.py` | 5 вопросов квиза orientation |
| Tests | `tests/test_quiz.py`, `tests/test_verify_job.py` | quiz flow, job_completed mock |

## Frontend

| Компонент | Файлы | Описание |
|-----------|-------|----------|
| Quiz | `QuizPanel.tsx`, `LessonPage.tsx` | UI квиза, submit, завершение урока |
| Reference | `LessonReferencePanel.tsx` | справка справа; клик по hotspot → подсветка на скрине |
| Verify polling | `hooks/useVerifyPolling.ts` | auto-retry при `retry_after_seconds` |
| Safe HTML | `SafeHtml.tsx` + DOMPurify | санитизация HTML контента |
| Author WYSIWYG | `author/RichTextEditor.tsx` (TipTap) | instruction, caption, expected result |
| Demo bridge | `utils/learnBridge.ts` | postMessage `learn:step_done` |
| Session | `LessonPage.tsx` | `sessionStorage` для индекса слайда |
| E2E | `e2e/lesson-smoke.spec.ts`, `playwright.config.ts` | dashboard → lesson → verify |
| Capture | `scripts/capture-demo-screens.mjs` | WebP 1920×1080 с демо |

## Документация

- [demo-bridge.md](demo-bridge.md) — контракт postMessage
- Обновлены [README.md](README.md), [content-authoring.md](content-authoring.md), корневой [README.md](../../README.md)

## Тесты

```text
backend:  pytest -q  → 29 passed
frontend: npm test    → 13 passed
frontend: npm run test:e2e  → smoke (требует backend + frontend)
```

## Ещё не сделано (из roadmap)

| Тема | Статус |
|------|--------|
| Реальные WebP вместо placeholder SVG | скрипт + `/author`; контент O5 — у PO |
| Auth guards, logout | ⏳ |
| Preview `/lessons/{id}?preview=1` | ⏳ |
| CRUD модулей в Author UI | ⏳ |
| `calculation_result` verify | Phase 2, не в коде |
| Tour hooks в demo UI | demo team (O3-tour) |
| Production deploy | O3 |
