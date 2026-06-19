# Руководство методиста: скриншоты, hotspots и редактор

Контент уроков Learn — **статические файлы** в `frontend/public/content/` или загрузка через `/author`. Wiki-изображения — в `frontend/public/content/wiki/`. Для пакетного захвата с демо-стенда есть скрипт Playwright (см. ниже).

**UI редактора:** MUI v6 + TipTap. Старый Consta Design System **не используется**.

---

## Редактор `/author`

| URL | Назначение |
|-----|------------|
| `/author` | Список модулей и уроков |
| `/author/lessons/{lessonId}` | Редактор урока |
| `/author/wiki` | Список wiki-статей |
| `/author/wiki/new` | Новая статья |
| `/author/wiki/{slug}/edit` | Редактирование статьи |

Локально без входа: `AUTHORING_ENABLED=true` (backend) + `VITE_AUTHORING_ENABLED=true` (frontend).

### Редактор урока (`AuthorLessonPage`)

- **Метаданные:** title, summary, tags, verify type, deep link template
- **Слайды:** drag-and-drop reorder, дублирование слайда, добавление/удаление
- **Загрузка изображений:** `POST /author/slides/{slide_id}/upload` → `/content/...`
- **Hotspots:** визуальный `HotspotEditor` + **компактный RichText** для `label` hotspot
- **Квиз модуля:** `QuizEditor` — вопросы, варианты, порог прохождения (`GET/PUT /author/modules/{id}/quiz`)
- **Экспорт/импорт:** JSON backup урока

### RichTextEditor (TipTap)

Режимы: `editorMode="lesson"` (уроки, слайды) и `editorMode="wiki"` (статьи wiki).

| Возможность | lesson | wiki |
|-------------|--------|------|
| Toolbar (bold, italic, lists, align, quote, HR) | ✅ | ✅ |
| Slash commands (`/`) | ✅ | ✅ |
| Bubble menu (выделение текста) | ✅ | ✅ |
| Tables | ✅ | ✅ |
| Links + LinkInsertModal | ✅ | ✅ |
| Wiki link picker | — | ✅ |
| Images (upload / URL) | — | ✅ |
| Callout, footnote, popup blocks | ✅ | ✅ |
| Source HTML mode | ✅ | ✅ |
| Preview (`ContentHtml`) | опц. | опц. |
| Compact mode (hotspot label) | ✅ | — |

HTML при показе ученику проходит через **DOMPurify** (`ContentHtml`, `LessonHtml`, `utils/contentHtml.ts`, `utils/lessonHtml.ts`).

Модалки редактора: `BaseModal`, `PromptModal`, `ConfirmModal` (`frontend/src/components/mui/`).

---

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
| `label` | Текст при наведении (поддерживает HTML через compact RichText) |
| `pulse` | Пульсирующая рамка (по умолчанию true) |

На экране урока hotspots отображаются на скриншоте и дублируются в **`LessonScreenshotHintsPanel`** (правая колонка).

## Тексты слайда

| Поле | Назначение |
|------|------------|
| `caption_html` | Что сделать на этом слайде |
| `expected_result_html` | Что пользователь увидит после действия |

## QuizEditor

Редактирование квиза модуля (не отдельного урока):

- API: `GET/PUT /api/v1/learn/author/modules/{module_id}/quiz`
- Поля вопроса: `prompt_html`, `options[]`, `correct_option_ids[]`
- `pass_threshold_percent` (по умолчанию 80)
- Компактный UI внизу страницы редактора урока модуля с `quiz_passed`

## Wiki authoring

- CRUD: `/api/v1/learn/author/wiki/articles`
- Upload: `POST /api/v1/learn/author/wiki/upload` → `/content/wiki/{hash}.png`
- Подробнее: [../wiki/contract.md](../wiki/contract.md)

## Чеклист перед публикацией

- [ ] Все слайды урока имеют `image_path` и файл существует в `public/content/`
- [ ] У интерактивных слайдов есть ≥1 hotspot с `label`
- [ ] Координаты hotspots проверены на эталонном разрешении
- [ ] `expected_result_html` заполнен для шагов «действие → результат»
- [ ] Размер файла изображения разумный (≤ 500 KB для PNG/WebP)
- [ ] Wiki-изображения доступны по `/content/wiki/...`
- [ ] Квиз: ≥1 вопрос, каждый с ≥1 правильным вариантом

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
2. Или локально: `AUTHORING_ENABLED=true` + `VITE_AUTHORING_ENABLED=true`
3. Откройте `/author` — список модулей и уроков
4. Редактируйте урок: метаданные, слайды (drag-drop), TipTap для текстов, hotspots, загрузка изображений
5. Экспорт/импорт JSON для резервного копирования

### Через seed (как раньше)

После правки контента:

1. Измените `ORIENTATION_LESSONS` в `backend/app/seed/data.py` (или вынесите в JSON).
2. На dev-БД: пересоздайте модуль или добавьте миграцию данных.
3. На fresh install seed выполняется при первом старте / в pytest.

## Placeholder

До получения реальных скринов с демо-стенда используются SVG-placeholder в `public/content/orientation-v1/`. Замените их реальными скриншотами без изменения путей в seed.
