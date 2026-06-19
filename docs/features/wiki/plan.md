# Wiki — справочные статьи Learn Portal

Краткий план фичи **Wiki**: справочный контент для учеников и CRUD для методистов.

**Статус:** реализовано (2026-06-18)  
**Миграция:** `006_wiki_articles`  
**Полный контракт:** [contract.md](contract.md)

---

## Назначение

- Ученик читает статьи на `/wiki` и `/wiki/{article_id}` без verify.
- Методист создаёт и редактирует статьи в `/author/wiki` с TipTap-редактором (`editorMode="wiki"`).
- Изображения загружаются в `frontend/public/content/wiki/` через `POST /author/wiki/upload`.
- Статьи в wiki-редакторе можно вставлять как ссылки (wiki link picker в RichTextEditor).

---

## Scope (реализовано)

| Область | Описание |
|---------|----------|
| Backend | `wiki_articles` table, public + author API |
| Seed | `WIKI_ARTICLE_SPECS` в `backend/app/seed/data.py` |
| Frontend ученик | `WikiPage`, `WikiArticlePage` |
| Frontend методист | `AuthorWikiPage`, `AuthorWikiEditPage` |
| Rich text | TipTap wiki mode: images, tables, callouts, footnotes, popup blocks |
| Render | `ContentHtml` + DOMPurify (единый pipeline с уроками) |

---

## Вне scope (MVP)

- Версионирование статей / diff
- Full-text search
- Права на уровне отдельных статей (только `role=author` для write)
- Production CDN для `/content/wiki/`

---

## Связанные документы

- [contract.md](contract.md) — API endpoints
- [../learn/content-authoring.md](../learn/content-authoring.md) — TipTap, загрузка изображений
- [../learn/impl-log.md](../learn/impl-log.md) — changelog 2026-06-18
