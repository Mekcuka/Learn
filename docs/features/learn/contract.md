# Контракт: Learn — ориентационный модуль

Контракт описывает **публичные интерфейсы** Learn Portal и **типы верификации** для уроков, wiki и самостоятельной работы.

> **Примечание (2026-06-18):** интеграция с Demo API и внешним демо-приложением **снята с поддержки**. Актуальные verify-типы: `manual`, `quiz_passed`.

---

## 1. Learn Portal API

Префикс: `/api/v1/learn`

### 1.1. Auth (учебные аккаунты)

Отдельная таблица пользователей Learn. Self-register **не** используется.

**Модель provisioning:** pre-seeded accounts. Админ передаёт список `{ learn_email, learn_password, display_name }`; Builder импортирует через seed (`seed/training_accounts.json`).

**Provisioning flow:**
1. Админ формирует JSON со списком учебных аккаунтов.
2. Запускается seed (`run_seed`).
3. Ученик входит в Learn Portal по `learn_email` / `learn_password`.

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
  "title": "Ориентация",
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
      "instruction_html": "<p>Создайте новый проект по инструкции урока.</p>",
      "deep_link": null,
      "verify": {
        "type": "manual",
        "config": {}
      }
    }
  ]
}
```

> **Note:** поле `deep_link` в ответе API сохранено для совместимости, но не используется UI.

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

Запускает или продолжает проверку на сервере Learn (`manual` или `quiz_passed`).

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

Фиксирует `started_at` урока (для учёта прогресса).

#### `POST /api/v1/learn/lessons/{lesson_id}/verify`

Те же verify-типы, что в §2; единица прогресса — **урок**, не step.

Контент скринов: [content-authoring.md](content-authoring.md).

---

## 2. Verify types

Сервер Learn интерпретирует `verify` из сценария. Внешние API **не** вызываются.

### 2.1. `manual`

Пользователь подтверждает шаг кнопкой «Я выполнил».

```json
{
  "type": "manual",
  "config": {}
}
```

### 2.2. `quiz_passed`

Проверка только на стороне Learn.

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

### 2.3. Устаревшие типы (обратная совместимость)

Типы `resource_exists`, `navigation`, `job_completed` в старом контенте обрабатываются как `manual`. Новый контент должен использовать только §2.1–2.2.

---

## 3. Verify types — Phase 2 (не реализовано)

| Type | Статус |
|------|--------|
| `job_completed`, `calculation_result`, `resource_field_equals`, … | Не в scope |

---

## 4. Ошибки Learn API

Единый формат (глобальный handler + `X-Request-ID`):

```json
{
  "detail": "error_code",
  "message": "Human-readable (RU)",
  "request_id": "uuid"
}
```

HTTPException в коде может передавать `detail={"detail": code, "message": "..."}` — handler нормализует в плоский JSON.

| HTTP | `detail` | Когда |
|------|----------|-------|
| 400 | `invalid_step_transition` | Verify до `start` шага |
| 401 | `unauthorized` | Нет/просрочен JWT |
| 404 | `module_not_found` | Неверный `module_id` |
| 409 | `step_already_completed` | Повторное завершение |

---

## 6. Версионирование сценария

- `module_id`: `orientation-v1`
- При изменении шагов — новый id (`orientation-v2`), прогресс v1 сохраняется
- Поле `scenario_version` в seed JSON — integer, monotonic

---

## 7. Wiki API (2026-06-18)

Префиксы: `/api/v1/learn/wiki` (public read), `/api/v1/learn/author/wiki` (author CRUD).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wiki/articles` | optional | Список статей |
| GET | `/wiki/articles/{article_id}` | optional | Статья с `body_html` |
| GET | `/author/wiki/articles` | author | Все статьи (редактор) |
| POST | `/author/wiki/articles` | author | Создать |
| PUT | `/author/wiki/articles/{article_id}` | author | Обновить |
| DELETE | `/author/wiki/articles/{article_id}` | author | Удалить |
| POST | `/author/wiki/upload` | author | Image → `/content/wiki/` |

Полная спецификация: [../wiki/contract.md](../wiki/contract.md).  
Миграция: `006_wiki_articles`.

---

## 8. Self-study API (2026-06-18)

Префикс: `/api/v1/learn/self-study`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/self-study/assignments` | Список заданий + progress |
| GET | `/self-study/assignments/{assignment_id}` | Сценарий + step_states |
| POST | `/self-study/assignments/{assignment_id}/steps/{step_id}/start` | Старт шага |
| POST | `.../verify` | Verify (reuse §2 types) |
| POST | `.../complete-manual` | Ручное подтверждение |

Полная спецификация: [../self-study/contract.md](../self-study/contract.md).  
Миграция: `007_self_study`. Author CRUD для self-study — **не в MVP** (только seed).

---

## 9. Author quiz API (2026-06-18)

Префикс: `/api/v1/learn/author`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/author/modules/{module_id}/quiz` | Вопросы + `pass_threshold_percent` |
| PUT | `/author/modules/{module_id}/quiz` | Обновить квиз модуля |

См. также [../learn-authoring/contract.md](../learn-authoring/contract.md).
