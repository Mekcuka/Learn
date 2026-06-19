# План: Learn — ориентационный модуль (MVP)

**Дата:** 2026-06-17  
**Статус:** **ready for Builder (content TBD)** — O1–O4 закрыты; контент шагов (O5), квиз (O6) можно заполнять параллельно с разработкой  
**Проект:** `C:\project\Student`  
**Платформа:** Learn

> **2026-06-18:** интеграция с внешним демо-приложением и Demo API **снята**. Verify: `manual`, `quiz_passed`. Ниже — исторический план MVP; актуальные границы — [integration-map.md](integration-map.md), [contract.md](contract.md).

## Цель и границы

### Цель MVP

Дать новому пользователю **ориентацию в демо-приложении** через портал Learn: вход под учебным аккаунтом, создание проекта, навигация по интерфейсу, знакомство с журналом задач и короткий мини-квиз. Пользователь завершает модуль с пониманием «где что находится», без прохождения полного расчётного цикла.

### В scope (MVP — ориентация)

**UI:** стартовая панель `/dashboard` — модули с перечнем уроков и статусом прогресса; экран урока `/lessons/{id}` — слайды со скриншотами, hotspots, «Ожидаемый результат».

| # | Урок | Слайды | Verify |
|---|------|--------|--------|
| 1 | Учебный аккаунт | экран входа, успешный вход | `manual` |
| 2 | Создание проекта | список, форма, результат | `resource_exists` |
| 3 | Навигация | меню, карта | `navigation` / manual |
| 4 | Журнал задач | панель, запись | `manual` |
| 5 | Мини-квиз | без скринов | `quiz_passed` |

Контент скринов: статические assets — [content-authoring.md](content-authoring.md).

Legacy table `steps` и API `/steps/*` — deprecated; сохранены для совместимости.

### Вне scope (MVP)

- Полный расчётный цикл (запуск compute-задач, ожидание `job_completed`)
- Верификация результатов расчётов (`job_completed`, `calculation_result`, сравнение числовых полей)
- Продакшен-аккаунты и SSO/LDAP
- Админ-панель курсов (CRUD модулей через UI)
- Сертификаты, геймификация, лидерборды
- Мобильная вёрстка портала (только desktop-first)

### Phase 2 (после MVP)

| Тема | Описание |
|------|----------|
| Расчётный модуль | Шаги с запуском задач в демо, ожидание завершения |
| `job_completed` verify | Проверка статуса задачи через Demo API |
| `calculation_result` verify | Сравнение ожидаемых метрик с ответом API |
| Расширенный квиз | Вопросы по результатам расчёта |
| Импорт/экспорт сценариев | JSON/YAML сценарии для методистов |

## Архитектура (высокий уровень)

```
┌─────────────────┐     deep link      ┌──────────────────┐
│   Learn Portal  │ ─────────────────► │    Demo App      │
│  (Student repo) │                    │ 97.60.spark...   │
└────────┬────────┘                    └────────┬─────────┘
         │                                      │
         │ verify (read-only)                   │ same host
         ▼                                      ▼
┌─────────────────────────────────────────────────────────┐
│     Demo API  https://97.60.spark.modeltech.ru/api/v1   │
│     Swagger: /api/v1/docs  ·  Auth: Bearer JWT          │
└─────────────────────────────────────────────────────────┘
```

Подробные границы и потоки — в [integration-map.md](integration-map.md). Справочник endpoints — [demo-api-reference.md](demo-api-reference.md).

## Стек (предварительно)

| Компонент | Выбор | Комментарий |
|-----------|-------|-------------|
| Learn Portal — frontend | React + TypeScript | Согласовать с командой |
| Learn Portal — backend | FastAPI + PostgreSQL | Учебные аккаунты, прогресс, сценарии |
| Auth | Pre-seeded учебные аккаунты | Admin list (СППР) → import в Learn; не self-register |
| Demo integration | Deep links + read API (Bearer JWT) | `POST /auth/login` server-side; verify via `GET /projects` (step 2 only) |
| Verify engine | Polling Demo API | Только read, step 2; steps 1, 3, 4 — manual |
| Hosting (MVP) | **localhost** | Production-хостинг отложен (O3) |

## Фазы (для Builder)

### Фаза 0 — Уточнение контрактов

**Цель:** закрыть PO-вопросы по архитектуре и verify-модели.

**Выполнено (2026-06-17):** пути Demo API, auth scheme, response fields — из OpenAPI; **O1–O4** — решения PO (pre-seed accounts, manual journal, localhost hosting, 5 steps).

**Остаётся (параллельно с Builder):** тексты шагов и квиз (O5, O6).

**Выход:** `contract.md` и `integration-map.md` — *ready for Builder*.

**Критерий:** контракты согласованы; контент может быть placeholder в seed.

---

### Фаза 1 — Каркас Learn Portal

**Цель:** репозиторий, auth учебных аккаунтов, пустой модуль ориентации.

**Hosting (MVP):** разработка и приёмка на **localhost**; production deploy — после MVP (O3).

**Задачи:**
- Инициализация проекта (`Student`)
- Модели: `User`, `TrainingAccount`, `Module`, `Step`, `UserProgress` (см. [data-model.md](data-model.md))
- Import pre-seeded accounts из admin list (СППР) — см. [integration-map.md](integration-map.md) §3.4
- Страница «Мои модули» с одним модулем «Ориентация»

**Критерий:** пользователь логинится, видит модуль, прогресс 0%.

---

### Фаза 2 — Сценарий ориентации (контент + UI шагов)

**Цель:** 5 шагов с текстом, иллюстрациями, кнопкой «Открыть в демо».

**Задачи:**
- Seed данных для модуля `orientation-v1` (5 steps: login → project → navigation → journal → quiz)
- Компонент `StepPanel`: заголовок, инструкция, deep link CTA, статус verify
- Переход между шагами: после verify (step 2) или manual confirm (steps 1, 3, 4)

**Критерий:** прохождение happy path вручную без verify (mock verify = success).

---

### Фаза 3 — Verify engine (ориентация)

**Цель:** автоматическая проверка шага 2 (`resource_exists`); шаги 1, 3, 4 — `manual` (O2).

**Задачи:**
- Реализовать MVP-набор verify из [contract.md](contract.md) §2: `manual`, `resource_exists`, `navigation` (fallback manual), `quiz_passed`
- HTTP-клиент к Demo API: `POST /api/v1/auth/login` → Bearer; refresh on 401
- Polling `GET /api/v1/projects` (step 2 only)

**Критерий:** шаг «Создание проекта» зелёнеет после `GET /api/v1/projects` с новым `id` (`created_at >= started_at`); шаг 4 — только `complete-manual`.

---

### Фаза 4 — Deep links и tour hooks

**Цель:** пользователь попадает в нужный экран демо из Learn.

**Задачи:**
- Парсер deep link query params (см. [integration-map.md](integration-map.md))
- Координация с демо-командой: `?learn_step=`, `?tour=`, стабильные `data-testid` / tour anchors
- Fallback: общая ссылка на `/projects` если hook не готов

**Критерий:** из шага 3 открывается демо на целевом разделе (или документированный fallback).

---

### Фаза 5 — Мини-квиз

**Цель:** финальный шаг с `quiz_passed`.

**Задачи:**
- Модель `QuizQuestion` / ответы в JSON сценария
- UI: single/multi choice, порог прохождения (например ≥80%)
- Запись `completed_at` на модуле

**Критерий:** после квиза модуль помечен завершённым, прогресс 100%.

---

### Фаза 6 — Полировка и приёмка

**Задачи:**
- Обработка ошибок Demo API (503, 401)
- Логирование verify-попыток для поддержки
- Документация для методиста: как править сценарий (JSON seed)

**Критерий:** чеклист приёмки MVP (ниже) выполнен на стенде `97.60.spark.modeltech.ru`.

## Чеклист приёмки MVP

- [ ] Учебный аккаунт импортируется из admin list (СППР) и входит в Learn + демо (не prod)
- [ ] Модуль «Ориентация» проходится от начала до квиза за ≤30 мин
- [ ] Шаг «Создание проекта» верифицируется через Demo API без ручного подтверждения
- [ ] Шаг «Журнал задач» завершается manual confirm после открытия панели журнала
- [ ] Deep link из Learn открывает демо в той же сессии браузера (или документированный обход)
- [ ] При недоступности Demo API пользователь видит понятное сообщение, прогресс не ломается
- [ ] Phase 2 verify-типы **не** реализованы и **не** экспонированы в UI

## Зависимости

| От кого | Что нужно |
|---------|-----------|
| Product Owner | Тексты шагов (O5), вопросы квиза (O6) — placeholder допустим на старте |
| Demo team | Tour hooks (`?learn_step=`), стабильные anchors |
| Infra | Production-хостинг Learn — **отложен** (MVP на localhost) |

## Связанные документы

- [contract.md](contract.md) — API Learn Portal и verify-типы
- [data-model.md](data-model.md) — сущности и схема БД
- [integration-map.md](integration-map.md) — границы Learn ↔ Demo
- [demo-api-reference.md](demo-api-reference.md) — Demo API для orientation MVP
- [open-questions.md](open-questions.md) — нерешённые решения
