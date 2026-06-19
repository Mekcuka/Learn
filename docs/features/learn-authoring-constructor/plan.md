# План: интерактивный конструктор урока (Author Constructor)

**Дата:** 2026-06-18  
**Статус:** ready for Builder Phase 1  
**Проект:** `C:\project\Student`  
**Предыдущий этап:** [learn-authoring](../learn-authoring/plan.md) — CRUD, HotspotEditor v1, TipTap, QuizEditor

---

## Цель

Превратить `AuthorLessonPage` в **конструктор урока** с layout как у ученика (`LessonPage`), типизированными формами verify/deep link вместо JSON textarea, улучшенным HotspotEditor и чеклистом публикации.

## Текущее состояние (baseline)

| Компонент | Файл | Сейчас |
|-----------|------|--------|
| Редактор урока | `frontend/src/pages/AuthorLessonPage.tsx` | Вертикальные секции; `verify_config` — JSON textarea; deep link — plain `TextField` |
| Список уроков | `frontend/src/pages/AuthorModulesPage.tsx` | Список без drag-reorder; import JSON только здесь |
| HotspotEditor | `frontend/src/components/author/HotspotEditor.tsx` | Draw/move/resize в %; без zoom/pan, без numeric fields, без keyboard nudge |
| SlideReorderList | `frontend/src/components/author/SlideReorderList.tsx` | Текст + drag handle; без thumbnail |
| QuizEditor | `frontend/src/components/author/QuizEditor.tsx` | `prompt_html` через plain `TextField` + `plainToPrompt` |
| Урок ученика | `frontend/src/pages/LessonPage.tsx` | 3 колонки: `LessonReferencePanel` \| main (`LessonActions` + `SlideCarousel`) \| `LessonScreenshotHintsPanel` |
| Превью | `?preview=1` на `LessonPage` | Открывается в новой вкладке; прогресс не пишется |
| Author API | `backend/app/api/v1/learn/author.py` | Reorder слайдов есть; **reorder уроков — нет** |

---

## Фазы Builder (конвейер)

### Builder Phase 1 — Quick wins (frontend-first)

**Цель:** улучшить UX редактора без смены layout; один новый backend endpoint.

| # | Задача | Файлы | Backend |
|---|--------|-------|---------|
| 1.1 | Thumbnails в `SlideReorderList` | `SlideReorderList.tsx`, `index.css` | — |
| 1.2 | Reorder уроков в `AuthorModulesPage` | `AuthorModulesPage.tsx`, `authorApi.ts` | `PATCH /author/modules/{id}/lessons/reorder` |
| 1.3 | `DeepLinkBuilder` — пресеты URL + query params | `components/author/DeepLinkBuilder.tsx`, `AuthorLessonPage.tsx` | — |
| 1.4 | `VerifyConfigForm` — presets по типу (замена textarea для MVP-типов) | `components/author/VerifyConfigForm.tsx`, `utils/verifyConfigSchema.ts` | — |
| 1.5 | Sticky toolbar + keyboard shortcuts | `AuthorLessonPage.tsx`, `index.css` | — |
| 1.6 | Collapsible sections (метаданные, квиз) | `AuthorLessonPage.tsx` или `AuthorCollapsibleSection.tsx` | — |
| 1.7 | TipTap в `QuizEditor` для `prompt_html` | `QuizEditor.tsx` — `RichTextEditor` compact | — |
| 1.8 | Import JSON на странице урока | `AuthorLessonPage.tsx` — кнопка + file input | reuse `POST .../import` |
| 1.9 | `LessonHtml` для caption preview (единый pipeline) | Уже частично; убрать дубли, проверить `ExpectedResult` | — |

**Критерии приёмки Phase 1:**

- [ ] В `SlideReorderList` у каждого слайда — миниатюра `image_path` (fallback placeholder)
- [ ] Методист перетаскивает уроки в `/author`; порядок сохраняется через API
- [ ] Deep link собирается из пресетов (базовый URL, `learn_step`, `tour`, `{project_id}`) без ручного JSON
- [ ] Для `manual`, `resource_exists`, `navigation`, `quiz_passed`, `job_completed` — форма полей; JSON textarea — «Расширенный режим» (collapse)
- [ ] Toolbar «Сохранить урок / Слайд / Превью» закреплён при скролле
- [ ] Shortcuts: `Ctrl+S` — сохранить активный контекст; `Ctrl+Shift+S` — сохранить урок; `←/→` — слайды (как в `SlideCarousel`)
- [ ] Секции «Основное» и «Квиз» сворачиваются
- [ ] Вопросы квиза редактируются в TipTap (compact)
- [ ] Import JSON доступен на `AuthorLessonPage` (в текущий модуль)
- [ ] `npm run test` и `pytest -q` зелёные

**Out of scope Phase 1:** 3-column layout, autosave, zoom/pan hotspots, publish checklist.

---

### Builder Phase 2 — Core constructor

**Цель:** layout конструктора = layout ученика; полноценный preview; autosave; publish checklist.

| # | Задача | Файлы |
|---|--------|-------|
| 2.1 | Извлечь `LessonSlideView` из `LessonPage` | `components/LessonSlideView.tsx` (новый), рефактор `LessonPage.tsx` |
| 2.2 | 3-column layout в `AuthorLessonPage` | `AuthorLessonPage.tsx`, `index.css` — классы `author-constructor-body` |
| 2.3 | Левая колонка: метаданные + verify + deep link (collapsible) | `AuthorLessonMetaPanel.tsx` |
| 2.4 | Центр: `LessonSlideView` в режиме `author` + inline editors | caption/expected через accordion под preview |
| 2.5 | Правая колонка: `HotspotEditor` + hotspot list | reuse `LessonScreenshotHintsPanel` patterns |
| 2.6 | `HotspotEditor` zoom/pan | wheel zoom, space+drag pan, reset button |
| 2.7 | Hotspot numeric coords + keyboard nudge | fields `x_pct`…`height_pct`; arrows ±0.5% (Shift ±2%) |
| 2.8 | `PublishChecklistPanel` | `components/author/PublishChecklistPanel.tsx` |
| 2.9 | Autosave активного слайда + dirty state | debounce 2s → `PUT /slides/{id}`; banner «Несохранённые изменения» |
| 2.10 | `DemoBridgeTesterPanel` | `components/author/DemoBridgeTesterPanel.tsx`, `learnBridge.ts` |

**Layout Phase 2 (целевой):**

```
┌─────────────────────────────────────────────────────────────────┐
│ Sticky toolbar: Сохранить | Превью | Экспорт | Чеклист | ...    │
├──────────────┬────────────────────────────┬─────────────────────┤
│ Meta panel   │ LessonSlideView (author)   │ HotspotEditor       │
│ DeepLink     │  + slide nav + actions bar   │ + hints list        │
│ VerifyForm   │  + caption/expected editors  │ + numeric coords    │
│ Quiz (coll.) │                            │                     │
│ Slide thumbs │                            │                     │
└──────────────┴────────────────────────────┴─────────────────────┘
```

**`LessonSlideView` props (контракт — см. contract.md):**

- Режимы: `student` | `author` | `preview`
- Собирает: `LessonActions` (опц.), `SlideCarousel`, quiz branch
- Используется в `LessonPage` и `AuthorLessonPage` (центральная колонка)

**Критерии приёмки Phase 2:**

- [ ] `LessonPage` и `AuthorLessonPage` используют общий `LessonSlideView` — визуальный паритет центральной колонки
- [ ] Конструктор — 3 колонки, viewport-fit (без page scroll, как `lesson-body`)
- [ ] Zoom 50–200%, pan, «Сбросить масштаб» в HotspotEditor
- [ ] Выбранный hotspot редактируется полями % и стрелками клавиатуры
- [ ] `PublishChecklistPanel` показывает статус пунктов из [content-authoring.md](../learn/content-authoring.md) §чеклист
- [ ] Thumbnails слайдов в чеклисте / боковой панели с индикацией проблем (нет image, нет hotspots)
- [ ] Autosave слайда через 2 с после последнего изменения; `beforeunload` при dirty
- [ ] `DemoBridgeTesterPanel` симулирует `postMessage` и показывает match с `verify.config.learn_step`
- [ ] Ручное «Сохранить слайд» по-прежнему работает

**Out of scope Phase 2:** draft/publish, revisions, capture API, storyboard, duplicate lesson API.

---

### Builder Phase 3 — Advanced (документировано; реализация по отдельному approval)

См. [data-model.md](data-model.md) и [contract.md](contract.md) §Phase 3. Кратко:

| Тема | Описание | Зависимости |
|------|----------|-------------|
| Capture wizard/API | UI поверх `npm run capture:screens` + опц. backend job | Playwright, demo credentials |
| Slide templates | Preset слайдов (пустой, скрин+hotspot grid) | — |
| Duplicate lesson | `POST /author/lessons/{id}/duplicate` | copy slides + files |
| Storyboard view | Grid всех слайдов урока | Phase 2 layout |
| Revision snapshots | `lesson_revisions` table | data-model §3 |
| Draft/publish | `draft_content` vs published | preview draft endpoint |
| AI caption/improve | Внешний LLM API | PO decision |
| Per-lesson quiz | Модель «квиз на урок» vs «квиз на модуль» | **product change** — не без PO |
| Live demo embed | iframe демо в конструкторе | CORS, security review |

**Phase 3 не блокирует приёмку Phase 1–2.**

---

## Явный out-of-scope (MVP конструктора)

| Тема | Причина |
|------|---------|
| CRUD модулей через UI | Отдельная фича; модули read-only |
| Author UI для self-study | [self-study/plan.md](../self-study/plan.md) — только seed |
| `calculation_result`, `job_failed_expected` verify forms | Phase 2 Learn verify; не в Author presets MVP |
| Сброс прогресса учеников при правке | По решению learn-authoring — не сбрасываем |
| Production deploy | O3 |
| Мобильная вёрстка конструктора | desktop-first |

---

## Порядок работ Builder

1. **Phase 1:** backend reorder endpoint → frontend quick wins (можно параллелить 1.3–1.9 после 1.2)
2. **Phase 2:** extract `LessonSlideView` → CSS layout → HotspotEditor → autosave → checklist → demo tester
3. **impl-log.md** в этой папке — Builder ведёт по фазам

---

## Риски

| Риск | Митигация |
|------|-----------|
| Рефактор `LessonPage` ломает E2E | Сохранить class names `lesson-body`, `lesson-main`; snapshot tests |
| Autosave конфликтует с ручным save | Один `saveSlide` pipeline; debounce cancel on explicit save |
| Zoom/pan ломает % координаты | Координаты всегда в image space; transform только CSS |
| `job_completed` form сложный | Preset с demo_endpoint; advanced JSON fallback |

---

## Чеклист приёмки фичи (все фазы 1–2)

- [ ] Методист создаёт урок с verify `resource_exists` без редактирования JSON
- [ ] Deep link с `learn_step` и `{project_id}` собирается в UI
- [ ] Hotspots точно позиционируются через numeric fields на 1920×1080
- [ ] Превью в конструкторе совпадает с `/lessons/{id}?preview=1`
- [ ] Чеклист публикации зелёный перед сдачей контента PO
- [ ] Документация: `content-authoring.md` обновлена Builder'ом; `impl-log.md` заполнен
