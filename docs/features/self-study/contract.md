# Контракт: Self-study API

**Base path:** `/api/v1/learn/self-study`  
**Auth:** Bearer JWT (или dev bypass при `AUTH_ENABLED=false`)  
**Миграция:** `007_self_study`

Self-study переиспользует verify types из [../learn/contract.md](../learn/contract.md) §2 (`manual`, `resource_exists`, `navigation`, `job_completed`, …).

---

## 1. Assignments

### `GET /api/v1/learn/self-study/assignments`

Список опубликованных заданий с прогрессом текущего пользователя.

**Response 200:**
```json
{
  "items": [
    {
      "id": "self-study-test-v1",
      "title": "Тестовое задание: модель энергосистемы",
      "description": "Самостоятельная работа по созданию проекта...",
      "status": "in_progress",
      "progress_percent": 25,
      "total_steps": 8,
      "completed_steps": 2
    }
  ]
}
```

### `GET /api/v1/learn/self-study/assignments/{assignment_id}`

Полный сценарий задания.

**Response 200:**
```json
{
  "id": "self-study-test-v1",
  "title": "Тестовое задание: модель энергосистемы",
  "description": "...",
  "status": "in_progress",
  "progress_percent": 25,
  "current_step_id": "ss-step-03",
  "project_id": "uuid-from-step-2",
  "steps": [
    {
      "id": "ss-step-01",
      "order": 1,
      "title": "Создание проекта",
      "instruction_html": "<p>...</p>",
      "deep_link": "https://97.60.spark.modeltech.ru/projects?learn_step=self-study-create-project",
      "verify": { "type": "resource_exists", "config": {} }
    }
  ],
  "step_states": [
    {
      "step_id": "ss-step-01",
      "status": "completed",
      "completed_at": "2026-06-18T10:00:00Z",
      "verify_result": { "resource_id": "..." }
    }
  ]
}
```

**Response 404:** `assignment_not_found`

---

## 2. Step actions

Префикс: `/api/v1/learn/self-study/assignments/{assignment_id}/steps/{step_id}`

| Method | Path suffix | Description |
|--------|-------------|-------------|
| POST | `/start` | Зафиксировать `started_at`, активировать шаг |
| POST | `/verify` | Запустить verify (Demo API polling при необходимости) |
| POST | `/complete-manual` | Ручное подтверждение (`manual` / `navigation` fallback) |

Поведение аналогично lesson verify: блокировка locked шагов, unlock next, сохранение `project_id` из `resource_exists`.

---

## 3. Data model

| Table | Purpose |
|-------|---------|
| `self_study_assignments` | Задание: id, title, description, is_published, sort_order |
| `self_study_steps` | Шаги: instruction_html, deep_link_template, verify_type, verify_config |
| `self_study_progress` | Прогресс пользователя по заданию |
| `self_study_step_states` | Статус каждого шага (locked/active/completed) |

---

## 4. Frontend routes

| Route | Component |
|-------|-----------|
| `/self-study` | `SelfStudyPage` |
| `/self-study/:assignmentId` | `SelfStudyAssignmentPage` |

Главная `/` — карточка «Самостоятельная работа» → `/self-study`.

---

## 5. Errors

| HTTP | `detail` | Когда |
|------|----------|-------|
| 400 | `invalid_step_transition` | Verify до start / locked step |
| 404 | `assignment_not_found` | Неверный id или unpublished |
| 404 | `step_not_found` | Шаг не в задании |
| 502–504 | demo errors | См. [../learn/contract.md](../learn/contract.md) §4 |

---

## 6. Authoring (future)

CRUD self-study через Author API **не реализован** в MVP — контент только через seed (`seed_self_study` в `data.py`).
