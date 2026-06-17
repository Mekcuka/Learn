# Руководство методиста: скриншоты и hotspots

Контент уроков Learn — **статические файлы** в `frontend/public/content/` или загрузка через `/author`. Для пакетного захвата с демо-стенда есть скрипт Playwright (см. ниже).

## Стандарт съёмки

- **Разрешение:** 1920×1080 (или фиксированный viewport — одинаковый для всех уроков).
- **Формат:** SVG или WebP/PNG (рекомендуется WebP ≤ 500 KB).
- **Путь:** `frontend/public/content/{module_id}/{lesson_folder}/slide-NN.svg`

Пример:

```
frontend/public/content/orientation-v1/lesson-02-create-project/slide-01.svg
```

В seed (`backend/app/seed/data.py`) укажите:

```python
"image_path": "/content/orientation-v1/lesson-02-create-project/slide-01.svg"
```

## Hotspots (подсветка зон клика)

Координаты задаются **в процентах** от размера изображения — UI масштабируется на любом экране.

```json
{
  "hotspots": [
    {
      "id": "create-btn",
      "label": "Кнопка «Создать проект»",
      "x_pct": 82.0,
      "y_pct": 10.0,
      "width_pct": 14.0,
      "height_pct": 5.0,
      "pulse": true
    }
  ]
}
```

| Поле | Описание |
|------|----------|
| `x_pct`, `y_pct` | Левый верхний угол зоны (% от ширины/высоты) |
| `width_pct`, `height_pct` | Размер зоны |
| `label` | Текст при наведении |
| `pulse` | Пульсирующая рамка (по умолчанию true) |

## Тексты слайда

| Поле | Назначение |
|------|------------|
| `caption_html` | Что сделать на этом слайде |
| `expected_result_html` | Что пользователь увидит после действия |

## Чеклист перед публикацией

- [ ] Все слайды урока имеют `image_path` и файл существует в `public/content/`
- [ ] У интерактивных слайдов есть ≥1 hotspot с `label`
- [ ] Координаты hotspots проверены на эталонном разрешении
- [ ] `expected_result_html` заполнен для шагов «действие → результат»
- [ ] Размер файла изображения разумный (≤ 500 KB для PNG/WebP)

## Обновление контента

### Через скрипт захвата (Playwright)

```powershell
cd frontend
$env:DEMO_EMAIL="your@demo.account"
$env:DEMO_PASSWORD="secret"
npm run capture:screens
```

Скрипт [`scripts/capture-demo-screens.mjs`](../../frontend/scripts/capture-demo-screens.mjs) сохраняет WebP 1920×1080 в `public/content/orientation-v1/`. После захвата обновите `image_path` в seed или загрузите через `/author`.

### Через редактор в портале

1. Войдите как методист: `author@training.local` / `author123` (при `AUTH_ENABLED=true`)
2. Или локально: `AUTHORING_ENABLED=true` в backend `.env` и `VITE_AUTHORING_ENABLED=true` во frontend `.env`
3. Откройте `/author` — список модулей и уроков
4. Редактируйте урок: метаданные, слайды, **WYSIWYG** для текстов (TipTap), hotspots (визуальный редактор), загрузка изображений
5. Экспорт/импорт JSON для резервного копирования

HTML при показе ученику проходит через **DOMPurify** (`SafeHtml`).

## Интеграция с демо (postMessage)

См. [demo-bridge.md](demo-bridge.md) — контракт `learn:step_done` для автоматической verify навигации.

### Через seed (как раньше)

После правки контента:

1. Измените `ORIENTATION_LESSONS` в `backend/app/seed/data.py` (или вынесите в JSON).
2. На dev-БД: пересоздайте модуль или добавьте миграцию данных.
3. На fresh install seed выполняется при первом старте / в pytest.

## Placeholder

До получения реальных скринов с демо-стенда используются SVG-placeholder в `public/content/orientation-v1/`. Замените их реальными скриншотами без изменения путей в seed.
