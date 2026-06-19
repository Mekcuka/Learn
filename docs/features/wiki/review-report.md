# Review report — Wiki

**Дата:** 2026-06-18  
**Reviewer:** AI Reviewer  
**Scope:** Public `/wiki` + Author `/author/wiki`  
**Verdict:** GREEN

## Summary

Wiki реализован по `contract.md`: публичный список/деталь статей, CRUD методиста, upload изображений в `/content/wiki/`. Seed покрывает справочные статьи ориентации. Тесты `test_wiki.py` зелёные в CI (PostgreSQL critical suite).

## Test results

| Suite | Команда | Result |
|-------|---------|--------|
| Backend | `pytest tests/test_wiki.py -q` | **6 passed** |
| Frontend | unit (wiki utils, routes) | покрытие через `wikiHtml`, `wikiSlug`, App routes |
| E2E | `e2e/lesson-smoke.spec.ts` | wiki не в smoke; ручной smoke `/wiki` |

## Contract checklist

| Contract item | Status | Notes |
|---------------|--------|-------|
| `GET /wiki/articles` | ✅ | Сортировка `sort_order`, `id` |
| `GET /wiki/articles/{id}` | ✅ | `body_html`, timestamps |
| `GET /author/wiki/articles` | ✅ | Все статьи для методиста |
| `GET /author/wiki/articles/{id}` | ✅ | |
| `POST /author/wiki/articles` | ✅ | Slug из title при отсутствии `id` |
| `PUT /author/wiki/articles/{id}` | ✅ | |
| `DELETE /author/wiki/articles/{id}` | ✅ | |
| `POST /author/wiki/upload` | ✅ | → `/content/wiki/{hash}.{ext}` |
| Таблица `wiki_articles` | ✅ | Миграция `006_wiki_articles` |
| `/wiki`, `/wiki/:id` | ✅ | `WikiPage`, `WikiArticlePage` |
| `/author/wiki/*` | ✅ | `AuthorWikiPage`, `AuthorWikiEditPage` |
| TipTap wiki mode | ✅ | Images, tables, callouts |
| Render `ContentHtml` + DOMPurify | ✅ | |
| Ошибки 403/404/422 | ✅ | `article_not_found`, `forbidden` |
| Единый формат ошибок + `request_id` | ✅ | Общий middleware Learn |

## Acceptance (plan.md)

| Критерий | Status |
|----------|--------|
| Seed `WIKI_ARTICLE_SPECS` | ✅ |
| Публичный доступ без verify | ✅ |
| Author только `role=author` | ✅ |
| Изображения в `frontend/public/content/wiki/` | ✅ |

## Known gaps / deferred

| ID | Severity | Description |
|----|----------|-------------|
| W1 | minor | Нет full-text search |
| W2 | minor | Нет версионирования статей / diff |
| W3 | minor | Нет per-article ACL (только role author) |
| W4 | minor | Production CDN / WebP pipeline для wiki images — TODO |
| W5 | minor | Wiki не в Playwright smoke (только lessons) |
| W6 | info | `Cache-Control` для `/content/*` на GH Pages — дефолт CDN Pages; backend middleware готов при mount static |

## Recommendation

**GREEN** — фича готова для MVP. Следующие шаги: E2E smoke для `/wiki`, WebP/CDN при production deploy.
