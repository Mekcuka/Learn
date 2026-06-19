# Контракт: Wiki API

**Base path (public):** `/api/v1/learn/wiki`  
**Base path (author):** `/api/v1/learn/author/wiki`  
**Auth (public):** опционально (при `AUTH_ENABLED=false` — без токена)  
**Auth (author):** Bearer JWT, `user.role == "author"`  
**Миграция:** `006_wiki_articles`

---

## 1. Public API

### `GET /api/v1/learn/wiki/articles`

Список опубликованных статей (сортировка по `sort_order`, `id`).

**Response 200:**
```json
[
  {
    "id": "glossary-sppr",
    "order": 1,
    "title": "Глоссарий СППР",
    "summary": "Краткое описание",
    "tags": ["справка"]
  }
]
```

### `GET /api/v1/learn/wiki/articles/{article_id}`

**Response 200:**
```json
{
  "id": "glossary-sppr",
  "order": 1,
  "title": "Глоссарий СППР",
  "summary": "Краткое описание",
  "tags": ["справка"],
  "body_html": "<p>...</p>",
  "created_at": "2026-06-18T10:00:00Z",
  "updated_at": "2026-06-18T12:00:00Z"
}
```

**Response 404:** `article_not_found`

---

## 2. Author API

Префикс: `/api/v1/learn/author/wiki`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/articles` | Все статьи |
| GET | `/articles/{article_id}` | Статья для редактирования |
| POST | `/articles` | Создать статью |
| PUT | `/articles/{article_id}` | Обновить статью |
| DELETE | `/articles/{article_id}` | Удалить статью |
| POST | `/upload` | multipart image upload → `/content/wiki/{hash}.{ext}` |

### `POST /articles`

**Request:**
```json
{
  "id": "optional-slug",
  "title": "Заголовок",
  "summary": "Краткое описание",
  "body_html": "<p>...</p>",
  "tags": ["тег"],
  "sort_order": 10
}
```

Если `id` не указан — генерируется slug из `title`.

### `POST /upload`

**Request:** `multipart/form-data`, поле `file` (image).

**Response 200:**
```json
{
  "path": "/content/wiki/a1b2c3d4e5f6.png"
}
```

Файл сохраняется в `frontend/public/content/wiki/` (dev) или аналог в deploy.

---

## 3. Data model

Таблица `wiki_articles`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | string(64) | PK, slug |
| `sort_order` | int | порядок в списке |
| `title` | string(255) | |
| `summary` | text | |
| `body_html` | text | санитизация на клиенте при render |
| `tags` | JSON/JSONB | `string[]` |
| `author_id` | UUID | FK → users, nullable |
| `created_at`, `updated_at` | timestamptz | |

---

## 4. Frontend routes

| Route | Component |
|-------|-----------|
| `/wiki` | `WikiPage` |
| `/wiki/:articleId` | `WikiArticlePage` |
| `/author/wiki` | `AuthorWikiPage` |
| `/author/wiki/new` | `AuthorWikiEditPage` |
| `/author/wiki/:slug/edit` | `AuthorWikiEditPage` |

---

## 5. Errors

| HTTP | `detail` | Когда |
|------|----------|-------|
| 403 | `forbidden` | Не методист (author API) |
| 404 | `article_not_found` | Неверный `article_id` |
| 422 | `validation_error` | Невалидные tags / upload |

См. также общий формат ошибок в [../learn/contract.md](../learn/contract.md) §4.
