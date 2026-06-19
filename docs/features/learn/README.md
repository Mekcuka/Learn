# Learn — ориентационный модуль

Документация платформы обучения **Learn Portal** (репозиторий `C:\project\Student`): уроки, wiki, самостоятельная работа.

> **2026-06-18:** интеграция с внешним демо-приложением СППР снята. Verify: `manual`, `quiz_passed`.

---

## Документы

| Файл | Назначение |
|------|------------|
| [plan.md](plan.md) | Фазы Builder, scope, чеклист приёмки |
| [contract.md](contract.md) | Learn Portal API + verify types + wiki + self-study |
| [data-model.md](data-model.md) | Сущности БД Learn |
| [integration-map.md](integration-map.md) | Границы платформы, auth, verify |
| [content-authoring.md](content-authoring.md) | Скрины, hotspots, TipTap, quiz editor, `/author` |
| [open-questions.md](open-questions.md) | Решённые и открытые вопросы |
| [impl-log.md](impl-log.md) | Журнал реализации по фазам |
| [review-report.md](review-report.md) | Отчёт Reviewer (Phase 1–2 + дополнения) |

### Смежные фичи

| Путь | Назначение |
|------|------------|
| [../learn-authoring/](../learn-authoring/) | Author API, роли методиста |
| [../wiki/](../wiki/) | Wiki-статьи (ученик + методист) |
| [../self-study/](../self-study/) | Самостоятельная работа |

---

## Orientation MVP — кратко

5 уроков: **login → project → navigation → journal → quiz**.

| Урок | verify | UI |
|------|--------|-----|
| Учебный аккаунт | `manual` | «Я выполнил» |
| Создание проекта | `manual` | «Я выполнил» |
| Навигация | `manual` | «Я выполнил» |
| Журнал задач | `manual` | «Я выполнил» |
| Мини-квиз | `quiz_passed` | `QuizPanel` + `POST .../quiz/submit` |

Учебные аккаунты: **pre-seeded** (O1). Hosting MVP: **localhost** (O3).

---

## Текущий статус (2026-06-18)

| Область | Статус |
|---------|--------|
| Dashboard: модули → вложенные уроки, фильтры по тегам/статусу | ✅ |
| Урок: 3-колоночный layout, viewport-fit, без scroll страницы | ✅ |
| `LessonReferencePanel` (слева), collapsible sections | ✅ |
| `LessonScreenshotHintsPanel` (справа), hotspots | ✅ |
| `LessonNextStepCard` после завершения урока | ✅ |
| `LessonActions` над скриншотом | ✅ |
| Главная `/`: Уроки + Самостоятельная работа + Wiki | ✅ |
| `PortalTopbar` — единый MUI AppBar | ✅ |
| UI: **MUI v6** (Consta удалён) | ✅ |
| Wiki API + author CRUD (`006_wiki_articles`) | ✅ |
| Self-study API + seed из PPTX (`007_self_study`) | ✅ |
| Author quiz GET/PUT, `QuizEditor` | ✅ |
| TipTap: toolbar, slash, bubble, tables, wiki images/links | ✅ |
| Мини-квиз (5 вопросов, порог 80%) | ✅ |
| Редактор `/author` + drag-drop слайдов | ✅ |
| Реальные скрины уроков | ⏳ placeholder SVG + `capture:screens` |
| Auth guards, logout, production deploy | ⏳ |

---

## Decisions log

| Date | Decision |
|------|----------|
| 2026-06-17 | **O1:** Pre-seeded training accounts |
| 2026-06-17 | **O2:** Journal — `manual` only for MVP |
| 2026-06-17 | **O3:** Hosting — localhost first |
| 2026-06-17 | **O4:** 5 steps: login → project → navigation → journal → quiz |
| 2026-06-18 | **O14:** UI stack — MUI вместо Consta |
| 2026-06-18 | **O15:** Wiki и self-study — отдельные API-группы в `/api/v1/learn` |

Полный лог: [open-questions.md](open-questions.md).
