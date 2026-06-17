# Open questions — Learn orientation MVP

Статус на **2026-06-17** после сверки с Demo API OpenAPI и **PO decisions O1–O4**.

---

## Resolved / narrowed (from Swagger)

| # | Question | Resolution |
|---|----------|------------|
| Q1 | **Demo API base URL** | `https://97.60.spark.modeltech.ru/api/v1` |
| Q2 | **Swagger location** | UI: `/api/v1/docs`; JSON: `/api/v1/openapi.json`; root `/` → redirect |
| Q3 | **Auth scheme** | JWT Bearer + optional httpOnly cookies; Learn server uses **Bearer** |
| Q4 | **Login endpoint** | `POST /api/v1/auth/login` — body `{ email, password }` |
| Q5 | **Current user** | `GET /api/v1/auth/me` — fields: `id`, `email`, `username`, `role`, `created_at` |
| Q6 | **List projects** | `GET /api/v1/projects` — returns **array**, not `{ items }` |
| Q7 | **Project fields for verify** | `id`, `name`, `created_at`, `updated_at`, `owner_user_id`, `status`, `visibility` |
| Q8 | **Create project (who calls)** | `POST /api/v1/projects` — UI only; requires `analyst` or `admin` |
| Q9 | **Job journal endpoint** | `GET /api/v1/projects/{project_id}/jobs?limit=30` — `{ items, total, limit }` |
| Q10 | **Job response fields** | `id`, `job_type`, `status`, `created_at`, `started_at`, `finished_at`, … |
| Q11 | **`created_at` for projects** | **Present** — usable for `created_after_step_start` verify |

---

## Resolved (PO — 2026-06-17)

| # | Topic | Decision |
|---|-------|----------|
| O1 | **Training account provisioning** | **Pre-seeded accounts.** Админ (СППР) передаёт список login/password для демо; Learn импортирует в `training_accounts`. См. [integration-map.md](integration-map.md) §3.4, [contract.md](contract.md) §1.1. |
| O2 | **Step 4 — job journal verify** | **`manual` only.** Пользователь открывает журнал в демо UI и подтверждает кнопкой «Я выполнил»; **без** `GET .../jobs` для MVP pass. |
| O3 | **Hosting Learn Portal** | **localhost first** для MVP; production-хостинг отложен. Builder разворачивает локально; деплой на стенд — Phase 2 / после приёмки. |
| O4 | **Final step list** | **5 шагов:** login → project → navigation → journal → quiz. Шаги 6–7 (retry-hint) — вне обязательного MVP. |
| O7 | **Learn registration model** | *(закрыт через O1)* — self-register **не** используется; только admin-issued pre-seed. |

---

## Still open (needs PO / demo team / Builder)

| # | Topic | Options / notes | Owner |
|---|-------|-----------------|-------|
| O5 | **Instruction copy & media** | Exact RU instruction text, screenshots (структура 5 шагов зафиксирована — O4) | PO |
| O6 | **Quiz questions** | 5 placeholder-вопросов в seed (`QUIZ_PLACEHOLDERS`); финальные формулировки — у PO | PO |
| O3-tour | **Deep link / tour hooks** | `?learn_step=` not implemented in demo UI — need demo team for anchors / postMessage; MVP fallback: manual (шаг 3) | Demo team |
| O8 | **Password encryption at rest** | Algorithm for `training_accounts.demo_password_encrypted` | Builder |
| O9 | **Verify polling interval** | e.g. 5s initial, max 60s, total timeout 5 min (только step 2) | Builder |
| O10 | **Expose verify config to client** | Opaque `verify_job_id` vs server-only config | Builder |
| O11 | **Staging Swagger access** | 401 without env credentials — document for methodists? VPN/basic auth? | Infra |
| O12 | **Alembic / migration tool** | Confirm Alembic for Learn backend | Builder |
| O13 | **Optional steps 6–7** | Include retry-hint / completion in v1 seed? (default: **no** per O4) | PO |

---

## Phase 2 (explicitly out of scope)

- `job_completed` verify via `GET .../jobs/{job_id}` status polling
- WebSocket journal subscription from Learn
- Calculation result verification
- SSO / LDAP for Learn

---

## Decision log

| Date | Decision |
|------|----------|
| 2026-06-17 | Demo API paths confirmed from OpenAPI; contract.md updated |
| 2026-06-17 | Step 3 MVP: manual/navigation fallback until tour hooks exist |
| 2026-06-17 | Learn verify auth: Bearer JWT from `POST /auth/login` |
| 2026-06-17 | **O1:** Pre-seeded training accounts (admin list → СППР import) |
| 2026-06-17 | **O2:** Step 4 journal — `manual` verify only; no jobs API check for MVP |
| 2026-06-17 | **O3:** Learn Portal hosting — localhost first; production deferred |
| 2026-06-17 | **O4:** 5 steps final: login → project → navigation → journal → quiz |
| 2026-06-17 | Quiz UI + submit API реализованы; 5 placeholder-вопросов в seed |
