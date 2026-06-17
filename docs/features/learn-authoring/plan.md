# План: инструментарий редактирования уроков

**Статус:** реализовано (фазы 1–2 + roadmap 2026-06-17)  
**Проект:** `C:\project\Student`

## Реализовано дополнительно

| Компонент | Описание |
|-----------|----------|
| TipTap `RichTextEditor` | instruction, caption, expected result |
| DOMPurify | `SafeHtml` при показе ученику |
| `job_completed` | тип verify в Author UI (Phase 2) |

## Цель

Дать методисту (`role=author`) возможность редактировать уроки, слайды и hotspots без правки seed-файлов.

## Фазы

| Фаза | Содержание |
|------|------------|
| 1 | `users.role`, Author API, upload, UI-формы, JSON hotspots |
| 2 | Визуальный `HotspotEditor` на скриншоте |

## Границы

- CRUD модулей — вне scope фазы 1 (модули read-only)
- Прогресс учеников (`lesson_states`) при правке контента не сбрасывается

## Критерии приёмки

- [x] Методист входит под `author@training.local`, видит `/author`
- [x] CRUD урока и слайдов сохраняется в БД и виден ученику на `/lessons/{id}`
- [x] Upload изображения попадает в `frontend/public/content/`
- [x] Student получает 403 на Author API
- [x] HotspotEditor: рисование зоны в %, превью как у ученика
- [x] WYSIWYG для HTML-полей (TipTap)
