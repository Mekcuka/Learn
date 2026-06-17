# Модель данных: authoring

## Изменения

### `users.role`

| Column | Type | Default |
|--------|------|---------|
| `role` | VARCHAR(32) | `student` |

Значения: `student`, `author`.

## Seed

- `author@training.local` / `author123`, `role=author`, `display_name=Методист`

## Config

| Env | Default | Purpose |
|-----|---------|---------|
| `CONTENT_ROOT` | `{repo}/frontend/public/content` | Upload path |
| `AUTHORING_ENABLED` | `false` | Dev authoring без JWT |
