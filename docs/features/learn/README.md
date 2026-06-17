# Learn — ориентационный модуль

Документация платформы обучения **Learn Portal** (репозиторий `C:\project\Student`) для MVP «Ориентация в демо-приложении».

**Демо-приложение:** [https://97.60.spark.modeltech.ru/projects](https://97.60.spark.modeltech.ru/projects)  
**Demo API Swagger:** [https://97.60.spark.modeltech.ru/api/v1/docs](https://97.60.spark.modeltech.ru/api/v1/docs)

---

## Документы

| Файл | Назначение |
|------|------------|
| [plan.md](plan.md) | Фазы Builder, scope, чеклист приёмки |
| [contract.md](contract.md) | Learn Portal API + verify types + mapping к Demo API |
| [data-model.md](data-model.md) | Сущности БД Learn |
| [integration-map.md](integration-map.md) | Learn ↔ Demo: auth, deep links, errors |
| [demo-api-reference.md](demo-api-reference.md) | Справочник Demo API для orientation MVP |
| [demo-bridge.md](demo-bridge.md) | postMessage `learn:step_done`, tour hooks |
| [content-authoring.md](content-authoring.md) | Скрины, hotspots, редактор `/author` |
| [open-questions.md](open-questions.md) | Решённые и открытые вопросы |
| [impl-log.md](impl-log.md) | Журнал реализации по фазам |
| [review-report.md](review-report.md) | Отчёт Reviewer (Phase 1–2 + дополнения) |

Редактор методиста: [../learn-authoring/](../learn-authoring/)

---

## Orientation MVP — кратко

5 уроков: **login → project → navigation → journal → quiz**.

| Урок | verify | UI |
|------|--------|-----|
| Учебный аккаунт | `manual` | «Я выполнил» |
| Создание проекта | `resource_exists` | «Открыть в демо» + polling verify |
| Навигация | `navigation` (fallback manual) | deep link + postMessage / «Я выполнил» |
| Журнал задач | `manual` | deep link + «Я выполнил» |
| Мини-квиз | `quiz_passed` | `QuizPanel` + `POST .../quiz/submit` |

Автоматическая verify (Demo API read):

- **Урок 2:** `GET /api/v1/projects` — проект с `created_at >= started_at`
- **Урок 5:** квиз в Learn (без Demo API)

Auth для server-side verify: `POST /api/v1/auth/login` → `Authorization: Bearer`.

Учебные аккаунты: **pre-seeded** (O1). Hosting MVP: **localhost** (O3).

---

## Текущий статус (2026-06-17)

| Область | Статус |
|---------|--------|
| Dashboard + уроки со слайдами | ✅ |
| Справочная панель справа | ✅ |
| Hotspots ↔ подсветка в справке | ✅ |
| Verify polling в UI | ✅ |
| Мини-квиз (5 вопросов, порог 80%) | ✅ |
| Редактор `/author` + TipTap + HotspotEditor | ✅ |
| postMessage bridge (Learn side) | ✅ документировано; demo UI — TBD |
| `job_completed` verify (Phase 2) | ✅ в коде; не используется в orientation seed |
| Реальные скрины с демо | ⏳ placeholder SVG + скрипт `capture:screens` |
| Auth guards, logout, production deploy | ⏳ |
| Tour hooks в demo UI | ⏳ O3-tour |

---

## Decisions log

| Date | Decision |
|------|----------|
| 2026-06-17 | **O1:** Pre-seeded training accounts |
| 2026-06-17 | **O2:** Journal — `manual` only for MVP |
| 2026-06-17 | **O3:** Hosting — localhost first |
| 2026-06-17 | **O4:** 5 steps: login → project → navigation → journal → quiz |

Полный лог: [open-questions.md](open-questions.md).
