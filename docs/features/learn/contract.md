# Контракт: Learn — ориентационный модуль

Контракт описывает **публичные интерфейсы** Learn Portal и **типы верификации** для MVP (ориентация). Пути и поля **Demo API** подтверждены по OpenAPI демо-приложения (Swagger v1.0.0).

**Demo API base:** `https://97.60.spark.modeltech.ru/api/v1`  
**Swagger UI:** `https://97.60.spark.modeltech.ru/api/v1/docs` · **OpenAPI JSON:** `/api/v1/openapi.json`  
**Auth (Demo):** JWT Bearer (`Authorization: Bearer <access_token>`) или httpOnly cookies + CSRF в UI. Learn verify — **только Bearer** (см. [integration-map.md](integration-map.md) §3).

Справочник endpoints: [demo-api-reference.md](demo-api-reference.md).

---

## 1. Learn Portal API

Префикс: `/api/v1/learn`

### 1.1. Auth (учебные аккаунты)

Отдельная таблица пользователей Learn. Не использует prod/demo auth напрямую, но учебный аккаунт **привязан** к учётным данным демо (см. `TrainingAccount` в data-model).

**Модель provisioning (O1 — RESOLVED):** pre-seeded accounts. Админ (СППР) передаёт список `{ learn_email, learn_password, demo_email, demo_password }`; Builder импортирует в `training_accounts` (CLI seed или admin import endpoint). Self-register **не** используется.

**Provisioning flow:**
1. PO/СППР формирует CSV/JSON со списком учебных пар (Learn login + matching Demo login).
2. Админ запускает import (one-time seed или повторный import для новой группы).
3. Ученик входит в Learn Portal по `learn_email` / `learn_password`.
4. Learn хранит `demo_email` / `demo_password_encrypted` для server-side verify (step 2) и отображает demo credentials в инструкции шага 1.
5. Ученик использует те же demo credentials при входе в демо UI (browser flow — см. integration-map §3.3).

#### `POST /api/v1/learn/auth/login`

**Request:**
```json
{
  "email": "student@training.local",
  "password": "string"
}
```

**Response 200:**
```json
{
  "access_token": "jwt",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "student@training.local",
    "display_name": "Ученик 1"
  }
}
```

**Response 401:**
```json
{
  "detail": "invalid_credentials"
}
```

#### `POST /api/v1/learn/auth/logout`

Инвалидация refresh-токена (если используется). **Response 204.**

---

### 1.2. Modules & progress

#### `GET /api/v1/learn/modules`

Список доступных модулей для текущего пользователя.

**Response 200:**
```json
{
  "items": [
    {
      "id": "orientation-v1",
      "title": "Ориентация в демо-приложении",
      "description": "Создание проекта, навигация, журнал задач",
      "status": "in_progress",
      "progress_percent": 40,
      "total_steps": 5,
      "completed_steps": 2
    }
  ]
}
```

#### `GET /api/v1/learn/modules/{module_id}`

Полный сценарий с шагами (без скрытых verify-секретов на клиенте).

**Response 200:**
```json
{
  "id": "orientation-v1",
  "title": "Ориентация в демо-приложении",
  "steps": [
    {
      "id": "step-01-login-context",
      "order": 1,
      "title": "Учебный аккаунт",
      "instruction_html": "<p>...</p>",
      "deep_link": null,
      "verify": {
        "type": "manual",
        "config": {}
      }
    },
    {
      "id": "step-02-create-project",
      "order": 2,
      "title": "Создание проекта",
      "instruction_html": "<p>Создайте новый проект в демо.</p>",
      "deep_link": "https://97.60.spark.modeltech.ru/projects?learn_step=create-project",
      "verify": {
        "type": "resource_exists",
        "config": {
          "demo_endpoint": "GET /api/v1/projects",
          "resource_type": "project",
          "match": {
            "created_after_step_start": true,
            "timestamp_field": "created_at"
          }
        }
      }
    }
  ]
}
```

> **Note:** `demo_endpoint` в ответе клиенту может быть заменён на opaque `verify_job_id` — решение в open-questions. Для Builder MVP допустима server-side-only конфигурация verify.

#### `GET /api/v1/learn/modules/{module_id}/progress`

**Response 200:**
```json
{
  "module_id": "orientation-v1",
  "current_step_id": "step-03-navigation",
  "step_states": [
    {
      "step_id": "step-01-login-context",
      "status": "completed",
      "completed_at": "2026-06-17T10:00:00Z"
    },
    {
      "step_id": "step-02-create-project",
      "status": "completed",
      "completed_at": "2026-06-17T10:05:00Z",
      "verify_result": {
        "passed": true,
        "resource_id": "proj-uuid"
      }
    },
    {
      "step_id": "step-03-navigation",
      "status": "active",
      "completed_at": null
    }
  ]
}
```

#### `POST /api/v1/learn/modules/{module_id}/steps/{step_id}/start`

Фиксирует `started_at` для шага (нужно для `created_after_step_start`).

**Response 200:**
```json
{
  "step_id": "step-02-create-project",
  "started_at": "2026-06-17T10:04:00Z"
}
```

#### `POST /api/v1/learn/modules/{module_id}/steps/{step_id}/verify`

Запускает или продолжает проверку на сервере Learn (polling Demo API).

**Request:**
```json
{}
```

**Response 200 — passed:**
```json
{
  "status": "passed",
  "message": "Проект найден",
  "data": {
    "resource_id": "proj-uuid",
    "resource_name": "Учебный проект"
  }
}
```

**Response 200 — pending:**
```json
{
  "status": "pending",
  "message": "Ожидаем создание проекта в демо",
  "retry_after_seconds": 5
}
```

**Response 200 — failed:**
```json
{
  "status": "failed",
  "message": "Проект не найден. Убедитесь, что вы создали проект под учебным аккаунтом.",
  "hint_step_id": "step-02-create-project"
}
```

#### `POST /api/v1/learn/modules/{module_id}/steps/{step_id}/complete-manual`

Только для шагов с `verify.type = manual`.

**Response 200:**
```json
{
  "step_id": "step-01-login-context",
  "status": "completed"
}
```

#### `POST /api/v1/learn/modules/{module_id}/quiz/submit`

**Request:**
```json
{
  "answers": [
    { "question_id": "q1", "selected_option_ids": ["b"] },
    { "question_id": "q2", "selected_option_ids": ["a", "c"] }
  ]
}
```

**Response 200:**
```json
{
  "passed": true,
  "score_percent": 80,
  "pass_threshold_percent": 80,
  "results": [
    { "question_id": "q1", "correct": true },
    { "question_id": "q2", "correct": false }
  ]
}
```

---

### 1.3. Dashboard & lessons (основной UI)

> **Deprecated:** endpoints `/modules/{id}/steps/*` сохранены для совместимости; новый UI использует **lessons**.

#### `GET /api/v1/learn/dashboard`

Модули с вложенным списком уроков и статусами прогресса.

**Response 200:**
```json
{
  "modules": [{
    "id": "orientation-v1",
    "title": "Ориентация в демо-приложении",
    "progress_percent": 40,
    "total_lessons": 5,
    "completed_lessons": 2,
    "lessons": [{
      "id": "lesson-02-create-project",
      "order": 2,
      "title": "Создание проекта",
      "summary": "Создайте первый учебный проект",
      "status": "active",
      "slide_count": 3
    }]
  }]
}
```

#### `GET /api/v1/learn/lessons/{lesson_id}`

Урок со слайдами (скриншоты + hotspots) и outline модуля.

**Response 200:** см. `LessonDetailResponse` — поля `slides[]` (`image_path`, `hotspots`, `caption_html`, `expected_result_html`), `module_lessons[]`, `verify`, `project_id`.

#### `POST /api/v1/learn/lessons/{lesson_id}/start`

Фиксирует `started_at` (нужно для verify `resource_exists` на уроке «Создание проекта»).

#### `POST /api/v1/learn/lessons/{lesson_id}/verify`

Те же verify-типы, что в §2; единица прогресса — **урок**, не step.

Контент скринов: [content-authoring.md](content-authoring.md).

---

## 2. Verify types (MVP — ориентация)

Сервер Learn интерпретирует `verify` из сценария и опрашивает Demo API от имени привязанного учебного аккаунта.

### 2.1. `manual`

Пользователь подтверждает шаг кнопкой «Я выполнил». Без вызова Demo API.

```json
{
  "type": "manual",
  "config": {}
}
```

**Пример шага:** контекст входа, обзорная экскурсия без объективной проверки.

---

### 2.2. `deep_link_opened`

Клиент сообщает, что deep link был открыт (опционально для аналитики). Сервер может засчитать шаг без Demo API.

```json
{
  "type": "deep_link_opened",
  "config": {
    "require_same_session": false
  }
}
```

**Learn → client event:** `POST .../steps/{id}/verify` с телом `{ "client_event": "deep_link_opened" }` — **TBD** в open-questions.

---

### 2.3. `resource_exists`

Проверка наличия ресурса в демо через read endpoint.

```json
{
  "type": "resource_exists",
  "config": {
    "demo_endpoint": "GET /api/v1/projects",
    "resource_type": "project",
    "match": {
      "created_after_step_start": true,
      "timestamp_field": "created_at",
      "name_contains": null
    }
  }
}
```

**Алгоритм (сервер Learn):**
1. `started_at` шага уже записан.
2. Learn получает/обновляет Demo token: `POST /api/v1/auth/login` → `access_token` (см. integration-map §3).
3. `GET /api/v1/projects` с `Authorization: Bearer <access_token>`.
4. Ответ — **массив** `ProjectResponse[]` (не `{ items }`). Ищет элемент с `created_at >= started_at` (ISO 8601 UTC).
5. При нахождении — `status: passed`, сохраняет `resource_id` = `id`.

**Пример — проект создан:**

```http
GET /api/v1/projects HTTP/1.1
Host: 97.60.spark.modeltech.ru
Authorization: Bearer <access_token>
```

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Мой учебный проект",
    "description": null,
    "status": "draft",
    "visibility": "private",
    "poi_count": 0,
    "owner_user_id": "660e8400-e29b-41d4-a716-446655440001",
    "owner_name": "engineer",
    "created_at": "2026-06-17T10:05:12Z",
    "updated_at": "2026-06-17T10:05:12Z"
  }
]
```

**Пример — запись в журнале задач (Phase 2 only, не MVP):**

> **MVP (O2):** шаг 4 (`step-04-job-journal`) использует `manual` verify — пользователь открывает панель журнала и подтверждает. Конфиг ниже — для будущего `resource_exists` verify.

```json
{
  "type": "resource_exists",
  "config": {
    "demo_endpoint": "GET /api/v1/projects/{project_id}/jobs",
    "query": { "limit": 30 },
    "resource_type": "job_log_entry",
    "match": {
      "project_id_from_progress": "step-02-create-project.verify_result.resource_id",
      "min_total": 1,
      "count_field": "total"
    }
  }
}
```

**Demo API response:**
```json
{
  "items": [ { "id": "...", "job_type": "import_csv", "status": "completed", "created_at": "..." } ],
  "total": 1,
  "limit": 30
}
```

> **MVP (O2):** шаг 4 использует `manual` only — без `GET .../jobs`. Пример `resource_exists` ниже — для Phase 2 / reference.

---

### 2.4. `navigation`

Косвенная проверка навигации: комбинация client event + опциональный read check.

```json
{
  "type": "navigation",
  "config": {
    "deep_link_path": "/projects/{project_id}/map",
    "tour_anchor": "map-toolbar",
    "fallback": "manual"
  }
}
```

**Варианты реализации (выбрать одну):**

| Вариант | Поведение |
|---------|-----------|
| A | Только `manual` после открытия deep link |
| B | Демо postMessage `learn:tour_completed` → Learn iframe/parent listener |
| C | Demo API: `GET /api/v1/projects/{id}/infrastructure/layers` — optional read check |

Для MVP рекомендуется **вариант A** с `fallback: manual`, пока демо не предоставит tour hooks.

**Пример verify request flow (вариант A):**
1. Пользователь нажимает «Открыть в демо» → `deep_link`.
2. Пользователь возвращается в Learn, нажимает «Проверить».
3. `POST .../verify` → если deep link был открыт в сессии → `passed`, иначе `pending` с подсказкой.

---

### 2.5. `quiz_passed`

Проверка только на стороне Learn (без Demo API).

```json
{
  "type": "quiz_passed",
  "config": {
    "pass_threshold_percent": 80,
    "question_ids": ["q1", "q2", "q3"]
  }
}
```

Шаг завершается после успешного `POST .../quiz/submit`.

---

## 3. Verify types — Phase 2 (не реализовать в MVP)

Следующие типы **задокументированы для будущего**, Builder **не** реализует в ориентационном MVP:

| Type | Назначение |
|------|------------|
| `job_completed` | Задача в демо перешла в статус `completed` / `success` |
| `job_failed_expected` | Ожидаемая ошибка расчёта (негативный сценарий) |
| `calculation_result` | Сравнение числовых полей ответа с эталоном |
| `resource_field_equals` | Точное совпадение поля ресурса |
| `file_uploaded` | Наличие загруженного файла (импорт) |

**Пример (Phase 2 only):**
```json
{
  "type": "job_completed",
  "config": {
    "demo_endpoint": "GET /projects/{project_id}/jobs/{job_id}",
    "expected_status": "completed",
    "timeout_seconds": 600
  }
}
```

---

## 4. Ошибки Learn API

Единый формат:

```json
{
  "detail": "error_code",
  "message": "Human-readable (RU)",
  "request_id": "uuid"
}
```

| HTTP | `detail` | Когда |
|------|----------|-------|
| 400 | `invalid_step_transition` | Verify до `start` шага |
| 401 | `unauthorized` | Нет/просрочен JWT |
| 404 | `module_not_found` | Неверный `module_id` |
| 409 | `step_already_completed` | Повторное завершение |
| 502 | `demo_api_error` | Demo API 5xx |
| 503 | `demo_api_unavailable` | Demo API недоступен |
| 504 | `demo_verify_timeout` | Превышен таймаут polling |

**Пример 503:**
```json
{
  "detail": "demo_api_unavailable",
  "message": "Демо-приложение временно недоступно. Попробуйте позже.",
  "request_id": "abc-123"
}
```

---

## 5. Demo API — confirmed endpoints (orientation MVP)

Learn Portal **только читает**. Write-операции пользователь выполняет в UI демo.

| Назначение | Method & path | Response (key fields) | Orientation step |
|------------|---------------|----------------------|------------------|
| Login (server verify) | `POST /api/v1/auth/login` | `access_token`, `token_type: bearer`, `id`, `email`, `role` | 2 (token for step 2 verify) |
| Текущий пользователь | `GET /api/v1/auth/me` | `id`, `email`, `username`, `role` | — |
| Список проектов | `GET /api/v1/projects` | `[]` of `{ id, name, created_at, ... }` | **2** |
| Проект по id | `GET /api/v1/projects/{id}` | `ProjectResponse` | 2 (confirm), 3 |
| Слои карты | `GET /api/v1/projects/{id}/infrastructure/layers` | layers list | 3 (optional) |
| Объекты карты | `GET /api/v1/projects/{id}/infrastructure/objects` | objects list | 3 (optional) |
| Журнал задач | `GET /api/v1/projects/{id}/jobs?limit=30` | `{ items, total, limit }` | Phase 2 only (MVP step 4 = manual) |
| Активная задача | `GET /api/v1/projects/{id}/jobs/active` | `ProjectJobResponse \| null` | Phase 2 only |
| Health | `GET /health` | status payload | infra |

**Write (UI only, not Learn):** `POST /api/v1/projects` (create), `POST /api/v1/projects/{id}/jobs` (start job).

Полная таблица и примеры JSON — [demo-api-reference.md](demo-api-reference.md). Auth flow — [integration-map.md](integration-map.md).

### 5.1. Mapping шагов → verify calls

| step_id | verify type | Demo API calls (server-side) | Pass condition |
|---------|-------------|------------------------------|----------------|
| `step-01-login-context` | `manual` | *(optional)* `POST /auth/login` + `GET /auth/me` | User confirms; optional: `me.email` matches training account |
| `step-02-create-project` | `resource_exists` | `GET /projects` | ∃ project: `created_at >= step.started_at` |
| `step-03-navigation` | `navigation` / `manual` | deep link only; optional `GET .../infrastructure/layers` | Manual confirm (MVP); tour hooks TBD |
| `step-04-job-journal` | `manual` | deep link only (no Demo API verify) | User confirms after opening journal panel (O2) |
| `step-05-mini-quiz` | `quiz_passed` | — (Learn only) | `POST .../quiz/submit` score ≥ threshold |

---

## 6. Версионирование сценария

- `module_id`: `orientation-v1`
- При изменении шагов — новый id (`orientation-v2`), прогресс v1 сохраняется
- Поле `scenario_version` в seed JSON — integer, monotonic
