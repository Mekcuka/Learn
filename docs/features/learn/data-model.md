# Модель данных: Learn — ориентационный модуль

Сущности Learn Portal. Demo App имеет **собственную** схему; здесь только то, что хранится в БД Learn.

---

## 1. ER-диаграмма (MVP)

```
┌──────────────┐       ┌──────────────────┐
│    User      │───────│ TrainingAccount  │
└──────┬───────┘       └──────────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐       ┌──────────────┐
│ UserProgress │───N:1─│    Module    │
└──────┬───────┘       └──────┬───────┘
       │                      │ 1:N
       │ 1:N                  ├──────────────┐
       ▼                      ▼              ▼
┌──────────────┐       ┌──────────────┐  ┌─────────────┐
│ LessonState  │───N:1─│    Lesson    │  │    Step     │ (deprecated API)
└──────────────┘       └──────┬───────┘  └─────────────┘
                              │ 1:N
                              ▼
                       ┌──────────────┐
                       │ LessonSlide  │
                       └──────────────┘
```

---

## 2. Таблицы

### 2.1. `users`

Учётные записи портала Learn.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt/argon2 |
| `display_name` | VARCHAR(255) | NOT NULL | |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

---

### 2.2. `training_accounts`

Привязка пользователя Learn к учётным данным **демо-приложения**. Отдельные учебные аккаунты, не prod.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users, UNIQUE | 1:1 |
| `demo_email` | VARCHAR(255) | NOT NULL | Логин в демо |
| `demo_password_encrypted` | TEXT | NOT NULL | Шифрование at rest — **алгоритм TBD** |
| `demo_user_id` | VARCHAR(255) | NULL | Кэш id из Demo API после первого login |
| `demo_token_encrypted` | TEXT | NULL | Кэш JWT демо для verify polling |
| `demo_token_expires_at` | TIMESTAMPTZ | NULL | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |

> **Security:** пароль демо не отдаётся на frontend; Learn backend использует его только server-side для verify.

---

### 2.3. `modules`

Сценарий обучения (контент модуля).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | VARCHAR(64) | PK | e.g. `orientation-v1` |
| `title` | VARCHAR(255) | NOT NULL | |
| `description` | TEXT | NULL | |
| `scenario_version` | INTEGER | NOT NULL, DEFAULT 1 | |
| `is_published` | BOOLEAN | DEFAULT false | |
| `pass_threshold_percent` | INTEGER | DEFAULT 80 | Для квиза |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

MVP: одна запись `orientation-v1`.

MVP: одна запись `orientation-v1`.

---

### 2.4. `lessons`

Урок — единица прогресса и verify (основной UI).

| Column | Type | Notes |
|--------|------|-------|
| `id` | VARCHAR(64) PK | e.g. `lesson-02-create-project` |
| `module_id` | FK → modules | |
| `sort_order` | INTEGER | |
| `title` | VARCHAR(255) | |
| `summary` | TEXT | Краткое описание на dashboard |
| `instruction_html` | TEXT | |
| `deep_link_template` | TEXT | |
| `verify_type` | VARCHAR(32) | |
| `verify_config` | JSONB | |
| `is_optional` | BOOLEAN | |

---

### 2.5. `lesson_slides`

Микро-шаги внутри урока (скриншот + hotspots).

| Column | Type | Notes |
|--------|------|-------|
| `id` | VARCHAR(64) PK | |
| `lesson_id` | FK → lessons | |
| `sort_order` | INTEGER | |
| `title` | VARCHAR(255) | |
| `caption_html` | TEXT | Что делать |
| `expected_result_html` | TEXT | Ожидаемый результат |
| `image_path` | TEXT | `/content/...` static asset |
| `hotspots` | JSONB | `{ "hotspots": [{ x_pct, y_pct, ... }] }` |

---

### 2.6. `lesson_states`

Прогресс пользователя по урокам (аналог `step_states`).

| Column | Type | Notes |
|--------|------|-------|
| `user_progress_id` | UUID FK | |
| `lesson_id` | FK → lessons | |
| `status` | VARCHAR(32) | locked / active / completed |
| `started_at`, `completed_at` | TIMESTAMPTZ | |
| `verify_result` | JSONB | |

`user_progress.current_lesson_id` → FK `lessons.id`.

---

### 2.7. `steps` (deprecated API)

Шаги сценария. Порядок через `sort_order`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | VARCHAR(64) | PK | e.g. `step-02-create-project` |
| `module_id` | VARCHAR(64) | FK → modules | |
| `sort_order` | INTEGER | NOT NULL | 1..N |
| `title` | VARCHAR(255) | NOT NULL | |
| `instruction_html` | TEXT | NOT NULL | RU контент |
| `deep_link_template` | TEXT | NULL | URL с плейсхолдерами `{project_id}` |
| `verify_type` | VARCHAR(32) | NOT NULL | см. contract §2 |
| `verify_config` | JSONB | NOT NULL, DEFAULT `{}` | Server-side only secrets OK |
| `is_optional` | BOOLEAN | DEFAULT false | Шаги 6–7 |
| `created_at` | TIMESTAMPTZ | NOT NULL | |

**MVP verify_type values:** `manual`, `deep_link_opened`, `resource_exists`, `navigation`, `quiz_passed`

**Phase 2 (не seed в MVP):** `job_completed`, `calculation_result`, …

---

### 2.8. `quiz_questions`

Вопросы мини-квиза (привязаны к модулю или к шагу-квизу).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | VARCHAR(64) | PK | e.g. `q1` |
| `module_id` | VARCHAR(64) | FK → modules | |
| `sort_order` | INTEGER | NOT NULL | |
| `prompt_html` | TEXT | NOT NULL | |
| `options` | JSONB | NOT NULL | `[{ "id": "a", "text": "..." }]` |
| `correct_option_ids` | JSONB | NOT NULL | `["b"]` или `["a","c"]` |
| `created_at` | TIMESTAMPTZ | NOT NULL | |

`correct_option_ids` **не** отдаются в `GET /modules/{id}` для клиента до submit — только на сервере при проверке.

---

### 2.9. `user_progress`

Агрегат прогресса по модулю.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users | |
| `module_id` | VARCHAR(64) | FK → modules | |
| `status` | VARCHAR(32) | NOT NULL | `not_started`, `in_progress`, `completed` |
| `current_step_id` | VARCHAR(64) | FK → steps, NULL | |
| `progress_percent` | INTEGER | DEFAULT 0 | 0–100 |
| `started_at` | TIMESTAMPTZ | NULL | |
| `completed_at` | TIMESTAMPTZ | NULL | |
| `quiz_score_percent` | INTEGER | NULL | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

**UNIQUE** (`user_id`, `module_id`).

---

### 2.10. `step_states` (deprecated API)

Состояние каждого шага для пользователя.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_progress_id` | UUID | FK → user_progress | |
| `step_id` | VARCHAR(64) | FK → steps | |
| `status` | VARCHAR(32) | NOT NULL | `locked`, `active`, `completed`, `skipped` |
| `started_at` | TIMESTAMPTZ | NULL | Для `created_after_step_start` |
| `completed_at` | TIMESTAMPTZ | NULL | |
| `verify_result` | JSONB | NULL | `{ "passed": true, "resource_id": "..." }` |
| `verify_attempts` | INTEGER | DEFAULT 0 | |
| `last_verify_at` | TIMESTAMPTZ | NULL | |
| `client_events` | JSONB | DEFAULT `[]` | e.g. `["deep_link_opened"]` |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

**UNIQUE** (`user_progress_id`, `step_id`).

---

### 2.11. `verify_audit_log` (рекомендуется для поддержки)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `step_state_id` | UUID | FK → step_states | |
| `verify_type` | VARCHAR(32) | NOT NULL | |
| `demo_endpoint` | VARCHAR(512) | NULL | |
| `http_status` | INTEGER | NULL | |
| `outcome` | VARCHAR(32) | NOT NULL | `passed`, `pending`, `failed`, `error` |
| `response_snippet` | TEXT | NULL | Truncated, no secrets |
| `created_at` | TIMESTAMPTZ | NOT NULL | |

---

## 3. Seed data — модуль `orientation-v1` (черновик)

| step_id | order | title | verify_type |
|---------|-------|-------|-------------|
| `step-01-login-context` | 1 | Учебный аккаунт | `manual` |
| `step-02-create-project` | 2 | Создание проекта | `resource_exists` (project) |
| `step-03-navigation` | 3 | Навигация по интерфейсу | `navigation` |
| `step-04-job-journal` | 4 | Журнал задач | `resource_exists` (job_log) или `navigation` |
| `step-05-mini-quiz` | 5 | Мини-квиз | `quiz_passed` |
| `step-06-retry-hint` | 6 | Подсказка (опц.) | `manual` |
| `step-07-completion` | 7 | Завершение (опц.) | `manual` |

Точный выбор для шага 4 — см. open-questions.

---

## 4. Индексы

```sql
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_step_states_progress ON step_states(user_progress_id);
CREATE INDEX idx_verify_audit_step_state ON verify_audit_log(step_state_id, created_at DESC);
CREATE INDEX idx_steps_module_order ON steps(module_id, sort_order);
```

---

## 5. Миграции

- Инструмент: Alembic (если FastAPI) — **TBD** в open-questions
- Первая миграция: все таблицы §2
- Вторая: seed `orientation-v1` + 3–5 quiz questions

---

## 6. JSON — пример `verify_config` в seed

**step-02-create-project:**
```json
{
  "demo_endpoint": "GET /api/v1/projects",
  "resource_type": "project",
  "match": {
    "created_after_step_start": true
  }
}
```

**step-04-job-journal (вариант resource_exists):**
```json
{
  "demo_endpoint": "GET /api/v1/projects/{project_id}/jobs",
  "resource_type": "job_log_entry",
  "match": {
    "project_id_from_step": "step-02-create-project",
    "min_count": 1
  }
}
```

Плейсхолдер `{project_id}` резолвится из `verify_result` шага `step-02-create-project`.

---

## 7. Phase 2 — расширения схемы (не в MVP)

| Таблица / поле | Назначение |
|----------------|------------|
| `steps.verify_type = job_completed` | Polling job status |
| `expected_results` | Эталонные значения для `calculation_result` |
| `modules.prerequisite_module_id` | Цепочка курсов |
| `cohorts`, `enrollments` | Групповое обучение |

Никаких миграций Phase 2 до закрытия MVP.
