# Контракт: Author API

**Base path:** `/api/v1/learn/author`  
**Auth:** Bearer JWT, `user.role == "author"`  
**Dev bypass:** `AUTHORING_ENABLED=true` + `AUTH_ENABLED=false` → default author user

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/modules` | Все модули |
| GET | `/modules/{module_id}/lessons` | Уроки модуля |
| GET | `/lessons/{lesson_id}` | Урок для редактирования |
| POST | `/modules/{module_id}/lessons` | Создать урок |
| PUT | `/lessons/{lesson_id}` | Обновить метаданные урока |
| DELETE | `/lessons/{lesson_id}` | Удалить урок |
| POST | `/lessons/{lesson_id}/slides` | Добавить слайд |
| PUT | `/slides/{slide_id}` | Обновить слайд |
| DELETE | `/slides/{slide_id}` | Удалить слайд |
| PATCH | `/lessons/{lesson_id}/slides/reorder` | `{ "slide_ids": [] }` |
| POST | `/slides/{slide_id}/upload` | multipart file upload |
| GET | `/lessons/{lesson_id}/export` | JSON export |
| POST | `/modules/{module_id}/lessons/import` | JSON import |
| GET | `/modules/{module_id}/quiz` | Квиз модуля для редактирования |
| PUT | `/modules/{module_id}/quiz` | Обновить вопросы и порог |

Wiki CRUD — отдельный router `/api/v1/learn/author/wiki` (см. [../wiki/contract.md](../wiki/contract.md)).

## Auth

`GET /auth/me` возвращает поле `role`: `student` | `author`.

## Errors

| Code | HTTP | Meaning |
|------|------|---------|
| `forbidden` | 403 | Не методист |
| `lesson_not_found` | 404 | Урок не найден |
| `validation_error` | 422 | Невалидные hotspots / verify |
