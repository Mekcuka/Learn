# AGENTS.md — Learn Portal (Student)

Инструкции для AI-агентов (Cursor, Cloud Agents) в репозитории **Learn Portal**.

**Проект:** образовательная платформа с интеграцией в демо-приложение СППР.  
**Репозиторий:** `C:\project\Student`  
**Демо UI:** https://97.60.spark.modeltech.ru/projects  
**Demo API:** https://97.60.spark.modeltech.ru/api/v1/docs

---

## Правила Cursor

Все правила агента лежат в **`.cursor/rules/`**:

| Файл | Назначение |
|------|------------|
| [project-context.mdc](.cursor/rules/project-context.mdc) | Контекст Learn, документация, структура repo |
| [learn-architecture.mdc](.cursor/rules/learn-architecture.mdc) | Portal + Backend + Verifier, учебные аккаунты |
| [demo-api.mdc](.cursor/rules/demo-api.mdc) | Demo API base, auth, endpoints для verify |
| [orchestration.mdc](.cursor/rules/orchestration.mdc) | Конвейер Planner → Builder → Reviewer → Integrator |
| [development.mdc](.cursor/rules/development.mdc) | FastAPI, React/Vite, pytest, env, git |
| [russian-language.mdc](.cursor/rules/russian-language.mdc) | Русский для UI и чата |
| [context7.mdc](.cursor/rules/context7.mdc) | Context7 MCP для документации библиотек |
| [SKILL.mdc](.cursor/rules/SKILL.mdc) | Когда активировать Context7 |

Правила с `alwaysApply: true` подхватываются автоматически.

---

## Документация фичи Learn (orientation MVP)

Стартовая точка: [`docs/features/learn/README.md`](docs/features/learn/README.md)

- **plan.md** — фазы, scope, чеклист приёмки
- **contract.md** — Learn API `/api/v1/learn/*`, verify types
- **data-model.md** — сущности БД
- **integration-map.md** — Learn ↔ Demo
- **demo-api-reference.md** — справочник Demo API
- **demo-bridge.md** — postMessage `learn:step_done`
- **content-authoring.md** — скрины, hotspots, `/author`
- **impl-log.md** — журнал реализации

Редактор методиста: **docs/features/learn-authoring/**

---

## Быстрые ограничения

1. Verify через **Demo API HTTP** на сервере — **не** Puppeteer/Playwright в runtime verify (Playwright только для E2E и capture скринов).
2. Learn **не** вызывает write-endpoints Demo API (`POST /projects`, jobs).
3. MVP orientation: `calculation_result`, `job_failed_expected` **не реализовать**. `job_completed` — реализован для Phase 2 уроков, в orientation seed не используется.
4. Hosting MVP: **localhost**; production отложен.
5. Коммиты — **только по запросу** пользователя.
6. Ответы в чате и UI-тексты — **русский** (см. `russian-language.mdc`).

---

## Локальный запуск (после scaffold)

```powershell
# PostgreSQL (optional)
docker compose -f deploy/docker-compose.yml up -d

# Backend :8000
cd backend && uvicorn app.main:app --reload

# Frontend :5173
cd frontend && npm run dev
```

Подробнее — `development.mdc`.
