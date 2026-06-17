# Integration map: Learn Portal ↔ Demo App

Границы интеграции, потоки данных и auth для ориентационного MVP.

**Demo host:** `https://97.60.spark.modeltech.ru`  
**Demo API prefix:** `/api/v1`  
**Swagger UI:** [https://97.60.spark.modeltech.ru/api/v1/docs](https://97.60.spark.modeltech.ru/api/v1/docs)  
**OpenAPI JSON:** [https://97.60.spark.modeltech.ru/api/v1/openapi.json](https://97.60.spark.modeltech.ru/api/v1/openapi.json)

> URL `https://97.60.spark.modeltech.ru/docs` из брифа может совпадать с UI после редиректа nginx; канонический путь в OpenAPI — **`/api/v1/docs`**. Доступ к Swagger на стенде без credentials окружения — **401**.

---

## 1. Границы ответственности

| Система | Ответственность |
|---------|-----------------|
| **Learn Portal** | Учебные аккаунты, сценарий, прогресс, verify engine, квиз |
| **Demo App (UI)** | Все write-операции: login, создание проекта, навигация, просмотр журнала |
| **Demo API** | Read-only для Learn verify; auth для server-side polling |

Learn **никогда** не создаёт проекты и не запускает jobs от имени ученика через API — только проверяет результат.

---

## 2. Потоки (orientation MVP)

```
┌──────────────┐   1. Learn login    ┌──────────────┐
│   Student    │ ──────────────────► │ Learn Portal │
└──────┬───────┘                     └──────┬───────┘
       │                                    │
       │ 2. Deep link → Demo UI             │ 5. Verify: POST .../verify
       ▼                                    │    Learn → Demo API (Bearer)
┌──────────────┐                            │
│  Demo App    │ ◄── 4. User creates        │
│  /projects   │     project, opens journal │
└──────┬───────┘                            │
       │                                    │
       │ 3. Demo login (same browser        │
       │    or training creds in UI)        │
       ▼                                    ▼
┌──────────────────────────────────────────────────┐
│  Demo API  https://97.60.spark.modeltech.ru/api/v1 │
└──────────────────────────────────────────────────┘
```

---

## 3. Auth flow — Demo API

### 3.1. Схема (из OpenAPI)

| Механизм | Детали |
|----------|--------|
| **Primary (Learn server)** | `Authorization: Bearer <access_token>` |
| **Alternative (browser UI)** | httpOnly cookies (`access`, `refresh`) + double-submit CSRF |
| **Token type** | JWT access + refresh; `token_type: "bearer"` в теле login |
| **OpenAPI security** | `HTTPBearer` (scheme: bearer) |

### 3.2. Server-side flow (verify engine)

1. Learn хранит `demo_email` / `demo_password_encrypted` в `training_accounts`.
2. Перед polling (или при истечении токена):
   ```http
   POST /api/v1/auth/login
   Content-Type: application/json

   {"email":"<demo_email>","password":"<demo_password>"}
   ```
3. Ответ: `access_token`, `refresh_token`, поля пользователя (`id`, `email`, `role`).
4. Кэш в `training_accounts.demo_token_encrypted` + `demo_token_expires_at`.
5. Все verify-запросы:
   ```http
   Authorization: Bearer <access_token>
   ```
6. CSRF **не требуется** при Bearer (mutating exempt в API).
7. При **401** — повторный login; при повторном 401 — `demo_api_error` / failed verify.

### 3.3. Browser flow (ученик в демо)

1. Ученик открывает deep link → `https://97.60.spark.modeltech.ru/projects?...`
2. Если сессии нет — login form в UI демо (те же учебные credentials).
3. Cookies устанавливаются демо-приложением; Learn iframe **не** читает cookies (same-origin только для демо).

### 3.4. Демо-учётки (training) — pre-seed model (O1)

**Решение PO:** учебные аккаунты **не** создаются self-register. Админ (СППР) передаёт фиксированный список login/password для Learn и matching demo credentials.

#### Provisioning flow

```
СППР / PO                    Learn admin                 Ученик
    │                             │                          │
    │  CSV: learn + demo pairs    │                          │
    ├────────────────────────────►│ import → training_accounts│
    │                             │                          │
    │                             │    POST /learn/auth/login │
    │                             │◄─────────────────────────┤
    │                             │                          │
    │                             │  instruction: demo creds  │
    │                             ├─────────────────────────►│
    │                             │                          │
    │                             │         deep link → Demo UI
    │                             │                          ├──────► login (demo creds)
```

**Import record (example):**

| Field | Example | Notes |
|-------|---------|-------|
| `learn_email` | `student-001@training.local` | Learn Portal login |
| `learn_password` | *(hashed at import)* | Never stored plaintext |
| `demo_email` | `train-001@oilgas.ru` | Pre-created on demo stand |
| `demo_password` | *(encrypted)* | For server-side verify (step 2) |
| `display_name` | `Ученик 001` | Shown in Learn UI |

**Requirements for demo stand:**
- Demo users from the list must exist on `97.60.spark.modeltech.ru` before orientation starts.
- Role **`analyst`** (or `admin`) required for project creation (step 2).

**Not in scope (MVP):** automated sync with demo user DB, SSO, LDAP.

---

## 4. Demo API endpoints (orientation)

Полная таблица — [demo-api-reference.md](demo-api-reference.md).

| Verify step | Demo endpoints |
|-------------|----------------|
| 1 — login context | — (`manual`) |
| 2 — create project | `GET /projects` → filter by `created_at` |
| 3 — navigation | deep link only (MVP); optional `GET .../infrastructure/layers` |
| 4 — job journal | deep link + `manual` verify (no `GET .../jobs` for MVP pass, O2) |
| 5 — quiz | *(Learn only)* |

---

## 5. Deep links

| Step | Template (draft) |
|------|------------------|
| 1 | `https://97.60.spark.modeltech.ru/projects` |
| 2 | `https://97.60.spark.modeltech.ru/projects?learn_step=create-project` |
| 3 | `https://97.60.spark.modeltech.ru/projects/{project_id}?learn_step=navigation` |
| 4 | `https://97.60.spark.modeltech.ru/projects/{project_id}?learn_step=job-journal` |

`{project_id}` — из `verify_result` шага 2.

**Статус tour hooks:** query params `learn_step`, `tour=` **не обрабатываются** UI демо на текущий момент → fallback на общий URL + manual verify (шаг 3).

**Learn Portal (готово):** приём postMessage `{ type: "learn:step_done", step: "..." }` — см. [demo-bridge.md](demo-bridge.md). В seed урока «Навигация» задано `verify.config.learn_step: "navigation"`.

---

## 6. Error mapping

| Demo API | Learn verify response |
|----------|----------------------|
| 401 | Re-login training account; then retry once |
| 403 | `failed` — wrong role (e.g. viewer cannot create project) |
| 404 | `failed` — project not found / wrong id |
| 5xx | `demo_api_error` (502) |
| timeout | `demo_verify_timeout` (504) |
| network | `demo_api_unavailable` (503) |

---

## 7. Hosting (MVP — O3)

| Environment | Status | Notes |
|-------------|--------|-------|
| **localhost** | **MVP target** | Builder dev + PO acceptance on local stack |
| Production / staging Learn | **Deferred** | CORS, TLS, subdomain — Phase 2 after MVP sign-off |

Demo app remains on `97.60.spark.modeltech.ru`; Learn Portal calls Demo API server-side from localhost during development.

---

## 8. CORS / cookies (если Learn и Demo на одном host)

При размещении Learn на **отдельном** subdomain cookies демо недоступны Learn JS — это ожидаемо; verify только server-side с Bearer.

При **общем** parent domain — deep links работают; cross-app session sharing **не** требуется для MVP.

---

## 9. WebSocket (не MVP)

`WS /api/v1/projects/{project_id}/jobs/ws` — live journal updates в UI демо. MVP verify: REST polling только для step 2 (`GET /projects`); step 4 — manual (O2).

---

## Связанные документы

- [contract.md](contract.md)
- [demo-api-reference.md](demo-api-reference.md)
- [open-questions.md](open-questions.md)
