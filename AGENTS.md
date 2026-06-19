# AGENTS.md — Learn Portal (Student)

Инструкции для AI-агентов (Cursor, Cloud Agents) в репозитории **Learn Portal**.

**Проект:** образовательная платформа — уроки, wiki, самостоятельная работа.  
**Репозиторий:** `C:\project\Student`

---

## Правила Cursor

Все правила агента лежат в **`.cursor/rules/`**:

| Файл | Назначение |
|------|------------|
| [project-context.mdc](.cursor/rules/project-context.mdc) | Контекст Learn, документация, структура repo |
| [learn-architecture.mdc](.cursor/rules/learn-architecture.mdc) | Portal + Backend + Verifier |
| [orchestration.mdc](.cursor/rules/orchestration.mdc) | Конвейер Planner → Builder → Reviewer → Integrator |
| [development.mdc](.cursor/rules/development.mdc) | FastAPI, React/Vite, pytest, env, git |
| [russian-language.mdc](.cursor/rules/russian-language.mdc) | Русский для UI и чата |
| [context7.mdc](.cursor/rules/context7.mdc) | Context7 MCP для документации библиотек |
| [SKILL.mdc](.cursor/rules/SKILL.mdc) | Когда активировать Context7 |

Правила с `alwaysApply: true` подхватываются автоматически.

---

## Документация фич

### Learn (orientation MVP)

Стартовая точка: [`docs/features/learn/README.md`](docs/features/learn/README.md)

- **plan.md** — фазы, scope, чеклист приёмки
- **contract.md** — Learn API `/api/v1/learn/*`, verify types, wiki, self-study
- **data-model.md** — сущности БД
- **integration-map.md** — границы платформы, auth, verify
- **content-authoring.md** — скрины, hotspots, TipTap, `/author`
- **impl-log.md** — журнал реализации

### Редактор методиста

**docs/features/learn-authoring/** — Author API, роли, CRUD уроков

### Wiki

**docs/features/wiki/** — публичный `/wiki` + author CRUD `/author/wiki`

### Самостоятельная работа

**docs/features/self-study/** — `/self-study`, задания с verify (manual)

---

## Стек (актуально)

| Слой | Технология |
|------|------------|
| Backend | FastAPI + PostgreSQL + SQLAlchemy/Alembic |
| Frontend | React + TypeScript + Vite + **MUI v6** |
| Rich text | TipTap (toolbar, slash commands, bubble menu, tables, images) |
| HTML render | `ContentHtml` / `LessonHtml` + DOMPurify |
| Auth Learn | JWT (учебные аккаунты, pre-seeded) |

> UI ранее использовал Consta Design System — **заменён на MUI** (2026-06-18). Старые `consta/` пути удалены; тема в `frontend/src/components/mui/`.

---

## Быстрые ограничения

1. Verify — только `manual` и `quiz_passed` на сервере Learn; внешние API **не** используются.
2. Hosting MVP: **localhost**; production отложен.
3. Коммиты — **только по запросу** пользователя.
4. Ответы в чате и UI-тексты — **русский** (см. `russian-language.mdc`).

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
