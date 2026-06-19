# Модель данных: Learn Authoring Constructor

**Статус:** Planner  
**Базовая модель:** [learn/data-model.md](../learn/data-model.md), [learn-authoring/data-model.md](../learn-authoring/data-model.md)

---

## 1. Phase 1–2 — без миграций БД

Все изменения Phase 1–2 — **frontend + один endpoint reorder** на существующих таблицах `lessons`, `lesson_slides`.

### 1.1. Reorder lessons (логика)

Используются существующие поля:

| Table | Column | Использование |
|-------|--------|---------------|
| `lessons` | `sort_order` | Переназначается 1..N при `PATCH .../lessons/reorder` |
| `lessons` | `module_id` | FK — все lesson_ids должны совпадать |

**Инвариант:** уникальность порядка в рамках `module_id` (как сейчас для слайдов).

**Не затрагивается:** `lesson_states` — прогресс учеников при reorder **не сбрасывается** (только меняется `lessons.sort_order` для каталога).

### 1.2. Autosave (Phase 2)

Пишет в существующую таблицу `lesson_slides` через `PUT /author/slides/{slide_id}`. Новых колонок нет.

**Опционально (не обязательно для MVP):** `lesson_slides.updated_at` — сейчас отсутствует; при необходимости audit — добавить в Integrator phase, не блокер.

---

## 2. Существующие JSON-поля (без изменения схемы)

| Table | Column | Конструктор |
|-------|--------|-------------|
| `lessons` | `verify_config` | Редактируется через `VerifyConfigForm` |
| `lessons` | `deep_link_template` | `DeepLinkBuilder` |
| `lesson_slides` | `hotspots` | `{ "hotspots": HotspotItem[] }` — без изменений |

**HotspotItem** (из `backend/app/schemas/lessons.py`):

```python
class HotspotItem(BaseModel):
    id: str
    label: str
    x_pct: float
    y_pct: float
    width_pct: float
    height_pct: float
    pulse: bool = True
```

---

## 3. Phase 3 — предлагаемые таблицы (НЕ реализовать в Phase 1–2)

> Помечено для будущего Builder после отдельного PO approval.

### 3.1. `lesson_revisions`

Снимки опубликованного контента урока.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `lesson_id` | VARCHAR(64) FK → lessons | |
| `created_at` | TIMESTAMPTZ | |
| `created_by_user_id` | UUID FK → users | author |
| `label` | VARCHAR(255) NULL | «Перед правками Q2» |
| `snapshot_json` | JSONB | Full lesson export payload |

**Index:** `(lesson_id, created_at DESC)`

### 3.2. `lesson_drafts` (альтернатива: колонки на `lessons`)

Черновик vs опубликованный контент.

**Вариант A — отдельная таблица:**

| Column | Type | Notes |
|--------|------|-------|
| `lesson_id` | VARCHAR(64) PK FK | 1:1 с lessons |
| `draft_json` | JSONB | AuthorLessonDetail shape |
| `updated_at` | TIMESTAMPTZ | |
| `updated_by_user_id` | UUID FK | |

**Вариант B — колонки на `lessons`:**

| Column | Type | Notes |
|--------|------|-------|
| `published_at` | TIMESTAMPTZ NULL | NULL = always live edit |
| `draft_payload` | JSONB NULL | |
| `is_published` | BOOLEAN | default true (backward compat) |

**Решение PO:** TBD в Phase 3 planning. Вариант B проще для MVP draft.

### 3.3. `capture_jobs` (опционально)

Async захват скриншотов с демо-стенда.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `status` | VARCHAR(32) | `pending`, `running`, `completed`, `failed` |
| `lesson_id` | VARCHAR(64) FK NULL | |
| `slide_id` | VARCHAR(64) FK NULL | |
| `config_json` | JSONB | viewport, URL, selector |
| `result_path` | TEXT NULL | `/content/...` |
| `error_message` | TEXT NULL | |
| `created_at` | TIMESTAMPTZ | |

**MVP Phase 3:** может остаться CLI-only (`frontend/scripts/capture-demo-screens.mjs`) без таблицы.

### 3.4. `slide_templates` (опционально)

| Column | Type | Notes |
|--------|------|-------|
| `id` | VARCHAR(64) PK | |
| `title` | VARCHAR(255) | |
| `template_json` | JSONB | default caption, hotspots scaffold |
| `module_id` | VARCHAR(64) NULL | scope |

**Альтернатива:** seed JSON в repo без БД — предпочтительно для первой итерации Phase 3.

---

## 4. Per-lesson quiz (Phase 3 — product change)

**Сейчас:** квиз на уровне **модуля** (`module_quiz_questions` / quiz service).

**Если PO запросит per-lesson quiz:**

| Change | Impact |
|--------|--------|
| `lessons.quiz_id` или embed questions in lesson | Миграция + Learn API `GET /lessons/{id}` |
| `QuizEditor` scope | lesson-scoped, not module |
| `quiz_passed` verify | `question_ids` в lesson verify_config |

**Статус:** не планировать миграцию до PO decision. В конструкторе Phase 1–2 — module quiz как сейчас.

---

## 5. Миграции (сводка)

| Migration | Phase | Содержание |
|-----------|-------|------------|
| — | 1–2 | Нет |
| `008_lesson_revisions` | 3 | `lesson_revisions` |
| `009_lesson_drafts` | 3 | draft/publish columns or table |
| `010_capture_jobs` | 3 opt. | capture_jobs |

**Integrator:** применять только после зелёного Reviewer соответствующей фазы.

---

## 6. Seed / content files

Без изменений схемы:

- Upload path: `CONTENT_ROOT` → `frontend/public/content/{module_id}/{lesson_folder}/`
- Placeholder: `/content/placeholder-slide.svg`
- Duplicate lesson (Phase 3): копирование файлов в новую папку — логика в `services/authoring.py`
