# Demo API — справочник для ориентационного MVP

Краткая выжимка из OpenAPI демо-приложения (**СППР Нефтегаз API v1.0.0**). Полная спецификация — Swagger UI и JSON (см. ниже).

| Параметр | Значение |
|----------|----------|
| **Base URL** | `https://97.60.spark.modeltech.ru/api/v1` |
| **Swagger UI** | `https://97.60.spark.modeltech.ru/api/v1/docs` (корень `/` редиректит сюда) |
| **OpenAPI JSON** | `https://97.60.spark.modeltech.ru/api/v1/openapi.json` |
| **Frontend (UI)** | `https://97.60.spark.modeltech.ru/projects` |
| **Auth** | JWT Bearer **или** httpOnly cookies + CSRF (см. [integration-map.md](integration-map.md) §3) |

> **Доступ к Swagger на стенде:** без credentials окружения запросы к `/docs` и `/openapi.json` возвращают **401** — это защита стенда, не отсутствие API. Спецификация ниже соответствует OpenAPI приложения.

---

## Endpoints — ориентационный MVP

| # | Method | Path | Purpose | Used in step |
|---|--------|------|---------|--------------|
| 1 | `POST` | `/auth/login` | Вход в демо, получение `access_token` | **1** (server verify), **2–4** (server polling) |
| 2 | `GET` | `/auth/me` | Текущий пользователь демо (`id`, `email`, `role`) | **1** (optional verify) |
| 3 | `POST` | `/auth/refresh` | Обновление access token (cookies / body) | server-side token refresh |
| 4 | `GET` | `/projects` | Список проектов пользователя | **2** (`resource_exists`) |
| 5 | `POST` | `/projects` | Создание проекта (UI демо; Learn **не** вызывает) | — (write только в UI) |
| 6 | `GET` | `/projects/{project_id}` | Проект по id | **2** (confirm), **3** |
| 7 | `GET` | `/projects/{project_id}/infrastructure/layers` | Слои карты | **3** (optional read check) |
| 8 | `GET` | `/projects/{project_id}/infrastructure/objects` | Объекты инфраструктуры на карте | **3** (optional read check) |
| 9 | `GET` | `/projects/{project_id}/jobs` | Журнал фоновых задач проекта | **4** (`resource_exists`) |
| 10 | `GET` | `/projects/{project_id}/jobs/active` | Активная задача (или `null`) | **4** (optional) |
| 11 | `GET` | `/health` | Healthcheck (без auth) | infra / мониторинг |

**Не в MVP ориентации:** `POST /projects/{id}/jobs`, WebSocket `/projects/{id}/jobs/ws`, расчётные endpoints (`pad-placement`, `well-trajectory`, …) — Phase 2.

---

## Auth — request / response

### `POST /auth/login`

**Request:**
```json
{
  "email": "engineer@oilgas.ru",
  "password": "password123"
}
```

**Response 200** (`AuthSessionResponse`):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "engineer@oilgas.ru",
  "username": "engineer",
  "role": "analyst",
  "avatar_url": null,
  "created_at": "2026-01-15T08:00:00Z",
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

**Response 401:** `{ "detail": "Неверный email или пароль" }`

Learn backend для verify: сохраняет `access_token`, шлёт `Authorization: Bearer <access_token>`.

---

### `GET /auth/me`

**Headers:** `Authorization: Bearer <access_token>`

**Response 200** (`UserResponse`):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "engineer@oilgas.ru",
  "username": "engineer",
  "role": "analyst",
  "avatar_url": null,
  "created_at": "2026-01-15T08:00:00Z"
}
```

---

## Projects

### `GET /projects`

**Response 200:** массив `ProjectResponse[]` (не обёртка `{ items }`).

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Мой учебный проект",
    "description": null,
    "status": "draft",
    "visibility": "private",
    "poi_count": 0,
    "owner_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "owner_name": "engineer",
    "created_at": "2026-06-17T10:05:12Z",
    "updated_at": "2026-06-17T10:05:12Z"
  }
]
```

**Verify step 2:** найти проект с `created_at >= step.started_at` (UTC).

### `POST /projects` (reference — UI only)

**Request:** `{ "name": "string", "description": "string|null" }`  
**Response 201:** один `ProjectResponse`.  
Требует роль `admin` или `analyst`.

---

## Jobs (журнал задач)

### `GET /projects/{project_id}/jobs?limit=30`

**Response 200** (`ProjectJobListResponse`):
```json
{
  "items": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "project_id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "job_type": "import_csv",
      "status": "completed",
      "payload": {},
      "result": null,
      "error_message": null,
      "progress": 1.0,
      "started_at": "2026-06-17T10:10:00Z",
      "finished_at": "2026-06-17T10:10:05Z",
      "created_at": "2026-06-17T10:10:00Z",
      "steps_total": 3,
      "steps_completed": 3,
      "current_step": null
    }
  ],
  "total": 1,
  "limit": 30
}
```

**Verify step 4 (MVP):** `manual` only — пользователь открывает журнал в демо UI и подтверждает в Learn; **без** `GET .../jobs` для pass (O2). Endpoint выше — reference для Phase 2.

**Job statuses (enum):** `pending`, `running`, `completed`, `failed`, `cancelled`.

---

## Map / navigation (optional step 3)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/projects/{project_id}/infrastructure/layers` | Список слоёв |
| `GET` | `/projects/{project_id}/infrastructure/objects` | Query: `subtype`, `q`, `bbox`, `visible_layers_only` |

Для MVP шага 3 достаточно **manual** после deep link; read checks — опциональное усиление verify.

---

## Связанные документы

- [contract.md](contract.md) — verify types и mapping шагов
- [integration-map.md](integration-map.md) — auth flow Learn ↔ Demo
- [plan.md](plan.md) — фазы Builder
