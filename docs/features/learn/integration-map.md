# Integration map: Learn Portal

Границы платформы и потоки данных для уроков, wiki и самостоятельной работы.

> **Примечание (2026-06-18):** интеграция с внешним демо-приложением СППР и Demo API **удалена**. Портал работает автономно: контент уроков, wiki, квизы и ручное подтверждение шагов.

---

## 1. Границы ответственности

| Система | Ответственность |
|---------|-----------------|
| **Learn Portal (frontend)** | Каталог уроков, просмотр слайдов, квиз, wiki, самостоятельная работа |
| **Learn Backend** | Auth учебных аккаунтов, сценарии, прогресс, verify engine, author API |
| **Статический контент** | Изображения слайдов, wiki-статьи (`frontend/public/content/`) |

Learn **не** вызывает внешние API для проверки выполнения заданий.

---

## 2. Потоки (ученик)

```
┌──────────────┐   1. Learn login    ┌──────────────┐
│   Student    │ ──────────────────► │ Learn Portal │
└──────┬───────┘                     └──────┬───────┘
       │                                    │
       │ 2. Урок / wiki / self-study        │ 3. POST .../verify
       ▼                                    ▼
┌──────────────────────────────────────────────────┐
│  Learn Backend  (FastAPI + PostgreSQL)             │
│  verify: manual | quiz_passed                      │
└──────────────────────────────────────────────────┘
```

---

## 3. Auth flow — Learn Portal

- Учебные аккаунты **pre-seeded** (без self-register).
- Админ импортирует список `{ learn_email, learn_password, display_name }`.
- JWT для API: `POST /api/v1/learn/auth/login`.
- Локальная разработка: `AUTH_ENABLED=false` — запросы от `student@training.local` без токена.

---

## 4. Verify types (актуально)

| Тип | Поведение |
|-----|-----------|
| `manual` | Ученик нажимает «Я выполнил» |
| `quiz_passed` | Квиз на стороне Learn; порог в `verify.config.pass_threshold_percent` |

Устаревшие типы (`resource_exists`, `navigation`, `job_completed`) в существующем контенте БД обрабатываются как `manual`.

---

## 5. Hosting (MVP)

| Environment | Status |
|-------------|--------|
| **localhost** | MVP target |
| Production | Deferred |

---

## Связанные документы

- [contract.md](contract.md)
- [data-model.md](data-model.md)
- [content-authoring.md](content-authoring.md)
