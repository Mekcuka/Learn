# Review report — Learn Phase 1–2

**Дата:** 2026-06-17  
**Reviewer:** AI Reviewer  
**Scope:** Phase 1 (каркас) + Phase 2 (сценарий + UI шагов)  
**Verdict:** GREEN

## Summary

Реализация соответствует `plan.md` Phase 1–2 и `contract.md` в рамках mock happy path. Тесты зелёные. Рекомендуется переход к Phase 3 (production verify engine для step 2).

## Test results

| Suite | Команда | Result |
|-------|---------|--------|
| Backend | `pytest -q` | **10 passed** (1 deprecation warning httpx/starlette) |
| Frontend | `npm run test` | **8 passed** (3 files) |
| Frontend lint | `npm run lint` (`tsc --noEmit`) | **OK** |

## Contract checklist (Phase 1–2 scope)

| Contract item | Status | Notes |
|---------------|--------|-------|
| `POST /auth/login` | ✅ | JWT + user, `*.local` emails |
| `POST /auth/logout` | ✅ | 204 no-op (JWT без refresh — допустимо) |
| `GET /auth/me` | ✅ | |
| `GET /modules` | ✅ | progress, total/completed steps |
| `GET /modules/{id}` | ✅ | 5 steps, verify types |
| `GET /modules/{id}/progress` | ✅ | step_states + current_step_id |
| `POST .../start` | ✅ | started_at, reject locked → 400 |
| `POST .../verify` | ⚠️ | manual/navigation/mock resource_exists ✅; quiz → pending; prod polling — Phase 3 |
| `POST .../complete-manual` | ✅ | Реализован; UI использует `/verify` |
| `POST .../quiz/submit` | ⏳ | Stub (Phase 5) |
| 5 шагов orientation | ✅ | seed `orientation-v1` |
| step 4 = `manual` | ✅ | `step-04-job-journal` |
| step 2 = `resource_exists` | ⚠️ | Mock pass; prod — один запрос без polling loop |
| step 3 = `navigation` + fallback manual | ✅ | |
| Deep links + `return_url` | ✅ | `buildDeepLink`, `{project_id}` |
| Progress blocking | ✅ | locked → 400, unlock next |
| Russian UI | ✅ | Login, modules, StepPanel |
| Phase 2 verify types absent | ✅ | `job_completed` и т.д. не в коде |

## Phase 2 acceptance (plan.md)

| Критерий | Status |
|----------|--------|
| Seed `orientation-v1`, 5 шагов | ✅ |
| `StepPanel`: заголовок, инструкция, CTA, статус | ✅ |
| Переходы после verify / manual | ✅ |
| Happy path с mock verify | ✅ (`DEMO_API_MOCK=true`) |

## Findings

| ID | Severity | Description |
|----|----------|-------------|
| F1 | major | Frontend не парсит вложенный `detail.message` из ответов backend |
| F2 | major | Формат ошибок не полностью по contract §4 (нет `request_id`; login 401 — строка, modules — вложенный объект; HTTP 502/503/504 для Demo API не используются) |
| F3 | minor | `verify.config` с `demo_endpoint` уходит на клиент (contract допускает для MVP) |
| F4 | minor | Кнопка «Проверить выполнение» вместо «Я выполнил» для manual-шагов |
| F5 | minor | Шаг 5 — placeholder квиза (ожидаемо, Phase 5) |
| F6 | minor | Дублируется секция Phase 2 в `impl-log.md` |

## Recommendation (Phase 1–2)

**Proceed to Phase 3.** Исправить F1 до интеграционного тестирования с Demo API. F2 — частично в Phase 6 (polish). F4 — quick fix при Phase 3.

---

# Review report — Learn Phase 3

**Дата:** 2026-06-17  
**Reviewer:** AI Reviewer  
**Scope:** Phase 3 — production verify engine (`resource_exists`)  
**Verdict:** GREEN

## Summary

Production polling verify для шага 2 реализован: `demo_client.py` (login, 401 retry, poll 5s × 120s), интеграция в `verify.py`. Исправлены F1 (parse nested `detail.message`) и F4 («Я выполнил» для manual/navigation). Тесты зелёные.

## Test results

| Suite | Команда | Result |
|-------|---------|--------|
| Backend | `pytest -q` | **17 passed** (1 deprecation warning httpx/starlette) |
| Frontend | `npm run test` | **10 passed** (3 files) |

## Phase 3 acceptance (plan.md)

| Критерий | Status |
|----------|--------|
| `resource_exists` → Demo API polling | ✅ `poll_for_project`, `created_at >= started_at` |
| Bearer auth + refresh on 401 | ✅ `_login` retry в `fetch_projects_once` |
| Mock mode (`DEMO_API_MOCK=true`) сохранён | ✅ dev happy path без стенда |
| Timeout → failed, 5xx → pending | ✅ |
| F1: nested `detail.message` на frontend | ✅ `parseApiError` |
| F4: «Я выполнил» для manual | ✅ `StepPanel.tsx` |
| Шаг 4 = manual only | ✅ без изменений (Phase 2) |

## Open findings (deferred)

| ID | Severity | Phase |
|----|----------|-------|
| F2 | major | Phase 6 — единый формат ошибок, `request_id`, HTTP 502/503/504 |
| F3 | minor | polish — скрыть `verify.config` от клиента |
| F5 | minor | Phase 5 — quiz UI |
| F6 | minor | impl-log дублирует Phase 2 секцию |

## Recommendation

**Proceed to Phase 4** (deep links и tour hooks в UI демо). Для smoke на реальном стенде: `DEMO_API_MOCK=false` + учебный demo-аккаунт из seed.

---

# Review addendum — Roadmap tools (2026-06-17)

**Scope:** квиз, справочная панель, verify polling, authoring WYSIWYG, `job_completed`, demo bridge, E2E  
**Verdict:** GREEN (unit tests)

## Test results (актуально)

| Suite | Команда | Result |
|-------|---------|--------|
| Backend | `pytest -q` | **29 passed** |
| Frontend unit | `npm run test` | **13 passed** |
| Frontend lint | `npm run lint` | **OK** |
| E2E | `npm run test:e2e` | smoke spec; требует backend :8000 |

## Новые contract items

| Item | Status | Notes |
|------|--------|-------|
| `GET /modules/{id}/quiz` | ✅ | без `correct_option_ids` |
| `POST .../quiz/submit` | ✅ | grading, unlock quiz lesson |
| `quiz` в `GET /lessons/{id}` | ✅ | для `quiz_passed` |
| `QuizPanel` UI | ✅ | урок `lesson-05-mini-quiz` |
| Verify polling UI | ✅ | `retry_after_seconds` |
| `job_completed` verify | ✅ | Phase 2 type; mock + `poll_for_job` |
| postMessage bridge | ✅ Learn side | [demo-bridge.md](demo-bridge.md) |

## Deferred

| Topic |
|-------|
| F2 — единый формат ошибок API (Phase 6) |
| F3 — скрыть `verify.config` от клиента |
| Auth guards + logout |
| Реальные скрины O5 (placeholder + `npm run capture:screens`) |
| Tour hooks в demo UI (O3-tour) |
| `calculation_result` verify |
