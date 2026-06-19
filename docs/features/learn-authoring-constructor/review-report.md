# Review Report: Learn Authoring Constructor — Builder Phase 1

**Дата:** 2026-06-18  
**Роль:** Reviewer  
**Репозиторий:** `C:\project\Student`  
**Артефакты:** `plan.md`, `contract.md`, `data-model.md`, `impl-log.md`

---

## Вердикт: ЗЕЛЁНЫЙ

Builder Phase 1 соответствует контракту и критериям приёмки `plan.md`. Backend endpoint reorder уроков, фронтенд-компоненты и интеграция в `AuthorLessonPage` / `AuthorModulesPage` реализованы. Тесты зелёные. Phase 2+ scope не просочился. Блокеров нет; ниже — предупреждения и nitpicks для Phase 2 или follow-up.

---

## Результаты тестов

| Suite | Команда | Результат |
|-------|---------|-----------|
| Backend | `cd backend; pytest -q` | **49 passed** (5 deprecation warnings — `HTTP_422_UNPROCESSABLE_ENTITY`, не связаны с Phase 1) |
| Frontend | `cd frontend; npm run test -- --run` | **69 passed** (17 files; stderr `act(...)` в SlideCarousel — pre-existing) |

---

## Contract checklist

### §1 API

| Пункт | Статус | Комментарий |
|-------|--------|-------------|
| `PATCH /author/modules/{module_id}/lessons/reorder` | ✅ | `author.py:162–181`, auth `get_current_author` |
| Request `{ lesson_ids: string[] }` | ✅ | `ReorderLessonsRequest` |
| Полная перестановка → 422 `validation_error` | ✅ | `set(body.lesson_ids) != set(lesson_map.keys())`, тест `test_author_reorder_lessons_validation` |
| 404 `module_not_found` | ✅ | `_get_module_or_404` |
| Response `AuthorLessonListItem[]`, order 1..N | ✅ | `_lesson_list_items`, тест проверяет `order` |
| Frontend `reorderAuthorLessons` | ✅ | `authorApi.ts:188–196` |
| Reuse PUT lesson/slides, import, slide reorder | ✅ | Без регрессий |

### §2 Frontend (Phase 1 scope)

| Компонент | Статус | Комментарий |
|-----------|--------|-------------|
| `VerifyConfigForm` props + typed fields | ✅ | `VerifyConfigForm.tsx`, `verifyConfigSchema.ts` |
| Advanced JSON accordion «Расширенный режим (JSON)» | ✅ | RU error из contract §6 |
| `mergeVerifyConfigOnTypeChange` сохраняет unknown keys | ✅ | `{ ...existing, ...defaults }` |
| `DeepLinkBuilder` props + 5 presets | ✅ | RU labels, `buildDeepLink` preview chip |
| `learn_step` / `tour` fields | ✅ | Условный показ по preset |
| `SlideReorderList` thumbnail 48×27 | ✅ | `.author-slide-reorder-thumb`, placeholder fallback |
| Sticky toolbar `.author-toolbar--sticky` | ✅ | `AuthorLessonPage` header + `index.css` |
| Keyboard shortcuts §5 | ✅ | Ctrl+S, Ctrl+Shift+S, ←/→; skip в TipTap/input |
| Accordion «Основное» / «Квиз» | ✅ | MUI Accordion |
| `QuizEditor` TipTap compact | ✅ | `RichTextEditor` для `prompt_html` |
| Import JSON on `AuthorLessonPage` | ✅ | reuse `POST .../import` |
| `LessonHtml` caption preview | ✅ | `AuthorLessonPage`, `ExpectedResult` |

### §2 Phase 2 (не в scope Phase 1)

| Компонент | Статус |
|-----------|--------|
| `LessonSlideView` | ⏸ не реализован (ожидаемо) |
| `PublishChecklistPanel` | ⏸ |
| `DemoBridgeTesterPanel` | ⏸ |
| `useAuthorSlideAutosave` | ⏸ |
| HotspotEditor zoom/pan/numeric | ⏸ |
| CSS `author-constructor-*` grid | ⏸ |

### §3 Verify schemas

| Тип | Form | Advanced fallback | Статус |
|-----|------|-------------------|--------|
| `manual` | empty hint | JSON | ✅ |
| `resource_exists` | endpoint, resource_type, match fields | JSON | ✅ defaults match contract |
| `navigation` | learn_step, deep_link_path, tour_anchor, fallback | JSON | ✅ |
| `quiz_passed` | pass_threshold 0–100 | JSON | ✅ client validation RU |
| `job_completed` | endpoint readonly, status, timeout | JSON | ✅ (Author scope, не orientation seed) |
| `calculation_result`, `job_failed_expected`, … | — | warning + JSON only | ✅ `PHASE2_ONLY_TYPES`; не в dropdown `VERIFY_TYPE_VALUES` |

### §5 / plan.md критерии приёмки Phase 1

| Критерий | Статус |
|----------|--------|
| Thumbnails в SlideReorderList | ✅ |
| Drag-reorder уроков в `/author` | ✅ |
| Deep link из пресетов | ✅ (см. warning W1) |
| Verify forms для MVP-типов + advanced JSON | ✅ |
| Sticky toolbar | ✅ |
| Shortcuts | ✅ |
| Collapsible «Основное» / «Квиз» | ✅ |
| TipTap в QuizEditor | ✅ |
| Import JSON на странице урока | ✅ |
| pytest + npm test зелёные | ✅ |

### data-model.md

| Пункт | Статус |
|-------|--------|
| Без миграций БД | ✅ |
| Reorder через `lessons.sort_order` | ✅ |
| Прогресс учеников не сбрасывается | ✅ (только sort_order) |

---

## Module boundaries

| Проверка | Результат |
|----------|-----------|
| Phase 2 layout / `LessonSlideView` | Не добавлено ✅ |
| Phase 3 API (duplicate, revisions, capture) | Не добавлено ✅ |
| `calculation_result` / `job_failed_expected` в Author dropdown | Не экспонируются ✅ |
| `job_completed` form | По contract §3.5 — допустимо в Author ✅ |
| Backend `ALLOWED_VERIFY_TYPES` | Совпадает с Author MVP set ✅ |

---

## Security & error handling

| Область | Оценка |
|---------|--------|
| Reorder endpoint auth | ✅ `role=author` |
| Import module_id validation (server) | ✅ 422 при mismatch |
| Client import `JSON.parse` | Приемлемо — сервер валидирует payload |
| User-facing errors | ✅ RU через `LearnApiError` / локальные строки |
| Deep link / verify config | Строки в БД; рендер через DOMPurify (`LessonHtml`) |
| Секреты в коде | Не обнаружено |

---

## Findings

### Blockers

_Нет._

### Warnings

| ID | Область | Описание |
|----|---------|----------|
| W1 | `DeepLinkBuilder` | После подстановки `learn_step`/`tour` в URL `detectPreset()` не узнаёт шаблон (exact match с `template`) — Select переключается на «Свой URL». Функционально deep link корректен; UX деградирует. |
| W2 | `AuthorLessonPage` validation | Подсказка «Укажите deep link для типа проверки «Навигация»» показывается и для `resource_exists` (contract §6 формулировка только для navigation; PublishChecklist §2.4 — оба типа). Текст вводит в заблуждение для `resource_exists`. |
| W3 | Import на `AuthorLessonPage` | Импорт JSON с **другим** `lesson.id` обновляет state, но URL `/author/lessons/{oldId}` не меняется — reload откатит вид. Рекомендация: `navigate` к `updated.id` после import. |
| W4 | Тестовое покрытие | Нет unit-тестов для `verifyConfigSchema.ts`, `DeepLinkBuilder`, `VerifyConfigForm` (только интеграция вручную). |
| W5 | Navigation sync | Contract §3.3 упоминает ссылку «Подставить в deep link»; реализован `learnStepHint` auto-fill в `DeepLinkBuilder` — частичный эквивалент, явной кнопки нет. |

### Nitpicks

| ID | Описание |
|----|----------|
| N1 | `AuthorModulesPage` reorder: нет optimistic UI — список обновляется после ответа API (приемлемо). |
| N2 | Нет теста reorder → 404 для несуществующего `module_id`. |
| N3 | Часть label в verify/deep link на английском (`learn_step`, `Demo endpoint`) — допустимо по convention (API field names). |

---

## Соответствие impl-log.md

Заявления Builder в `impl-log.md` подтверждены diff-ревью и тестами. Расхождений по scope Phase 1 не выявлено.

---

## Рекомендации для Integrator (Phase 1)

1. Smoke: login author → `/author` → drag-reorder уроков → reload — порядок сохранён.
2. Smoke: `/author/lessons/{id}` → смена verify type → сохранить → превью `?preview=1`.
3. Миграции БД **не требуются** (data-model §1).
4. W1–W3 можно отложить на Builder follow-up или Phase 2; не блокируют Integrator.

---

## Handoff

**Phase 1 — ЗЕЛЁНЫЙ.** Integrator может выполнять smoke и подготовку к Phase 2 без возврата к Builder, если PO не требует закрытия W1–W3 до merge.

---

# Review Report: Learn Authoring Constructor — Builder Phase 2

**Дата:** 2026-06-18  
**Роль:** Reviewer  
**Репозиторий:** `C:\project\Student`  
**Артефакты:** `plan.md` §Phase 2, `contract.md` §2.1/2.4–2.8/§4, `impl-log.md` §Phase 2

---

## Вердикт: ЗЕЛЁНЫЙ

Builder Phase 2 реализует конструктор урока: общий `LessonSlideView`, 3-колоночный layout, autosave, чеклист публикации, zoom/pan hotspots, demo bridge tester. Контракт Phase 2 соблюдён; Phase 3 не просочился. Тесты зелёные.

**Reviewer исправил 2 compile-blocker дефекта Builder** (см. §Blockers fixed) — без правок `AuthorLessonPage` не компилировался, `PublishChecklistPanel` имел неверные import paths.

---

## Результаты тестов

| Suite | Команда | Результат |
|-------|---------|-----------|
| Backend | `cd backend; pytest -q` | **49 passed** (5 deprecation warnings — pre-existing) |
| Frontend | `cd frontend; npm run test -- --run` | **76 passed** (20 files; stderr `act(...)` в SlideCarousel/LessonSlideView — pre-existing) |

---

## Contract checklist (Phase 2)

### §2.1 `LessonSlideView`

| Пункт | Статус | Комментарий |
|-------|--------|-------------|
| Props: mode, lesson, slideIndex, onSlideIndexChange | ✅ | `LessonSlideView.tsx` |
| activeHotspotId / onHotspotSelect | ✅ | Проброс в `SlideCarousel` |
| student/preview: LessonActions + SlideCarousel / QuizPanel | ✅ | `LessonPage.tsx:363–378` |
| author: SlideCarousel + banner, без verify API | ✅ | Banner «Режим конструктора» |
| Keyboard ←/→ | ✅ | Через `SlideCarousel` (reuse) |
| Refactor `LessonPage` | ✅ | Inline block заменён на `<LessonSlideView />` |

### §2.4 `PublishChecklistPanel`

| id | Rule | Статус |
|----|------|--------|
| `slides_exist` | ≥1 slide | ✅ |
| `images_present` | non-placeholder image_path | ✅ `publishChecklist.ts` |
| `hotspots_labeled` | label non-empty | ✅ |
| `expected_results` | ≥1 expected_result (non-quiz) | ✅ |
| `verify_config_valid` | schema validate | ✅ `validateVerifyConfig` |
| `deep_link_if_needed` | navigation/resource_exists | ✅ |
| `quiz_questions` | quiz_passed + valid questions | ✅ |

### §2.5 `DemoBridgeTesterPanel`

| Пункт | Статус |
|-------|--------|
| Input step (default from config) | ✅ |
| «Симулировать postMessage» → `learn:step_done` | ✅ `learnBridge.ts` |
| Match / no match indicator | ✅ Chip |
| Ссылка на demo-bridge.md | ✅ |

### §2.6 `HotspotEditor` extensions

| Пункт | Статус | Комментарий |
|-------|--------|-------------|
| Zoom/pan (wheel, space+drag) | ✅ | `useScreenshotViewport`, `ScreenshotToolbar` |
| «Сбросить масштаб» | ✅ | `viewport.reset` |
| Numeric fields x_pct…height_pct | ✅ | `showNumericFields` |
| Arrow nudge ±0.5% / Shift ±2% | ✅ | `HotspotEditor.tsx:647–675` |
| Delete selected hotspot | ✅ | Delete/Backspace |
| Alt+Arrow resize | ⏸ TBD | По contract §2.6 — не блокер |

### §2.8 Autosave hook

| Пункт | Статус |
|-------|--------|
| debounceMs default 2000 | ✅ |
| dirty / saving / flush | ✅ |
| PUT `/slides/{id}` | ✅ `updateAuthorSlide` |
| beforeunload при dirty | ✅ |
| markClean на ручном save | ✅ `saveActiveSlide` |

### §4 CSS classes

| Class | Статус |
|-------|--------|
| `author-constructor-body` | ✅ 3-col grid |
| `author-constructor-meta` | ✅ |
| `author-constructor-main` | ✅ |
| `author-constructor-hotspots` | ✅ |
| viewport-fit (no page scroll) | ✅ `catalog-layout--author-constructor` height 100dvh |

### plan.md Phase 2 критерии приёмки

| Критерий | Статус | Комментарий |
|----------|--------|-------------|
| Визуальный паритет центральной колонки | ✅ | Общий `LessonSlideView` |
| 3 колонки, viewport-fit | ✅ | |
| Zoom 50–200% | ⚠️ | Реализовано 100–300% (`MIN_ZOOM=1`, `MAX_ZOOM=3`) — см. W6 |
| Pan + reset | ✅ | |
| Numeric coords + keyboard nudge | ✅ | |
| PublishChecklistPanel | ✅ | |
| Thumbnails + индикация проблем в боковой панели | ⚠️ | Thumbnails + hotspot count в `SlideReorderList`; явных warn-иконок «нет image / нет hotspots» нет — см. W7 |
| Autosave 2 с + beforeunload | ✅ | |
| DemoBridgeTesterPanel | ✅ | |
| Ручное «Сохранить слайд» | ✅ | + `markClean` |

### Follow-up W1–W3 (из Phase 1)

| ID | Статус | Комментарий |
|----|--------|-------------|
| W1 DeepLinkBuilder detectPreset | ✅ | `normalizeUrlForPresetMatch` — URL с подставленным learn_step/tour распознаётся |
| W2 validation text | ✅ | Разные RU-сообщения для navigation vs resource_exists |
| W3 import navigate | ✅ | `navigate(/author/lessons/${updated.id})` при смене id |

---

## Module boundaries

| Проверка | Результат |
|----------|-----------|
| Phase 3 API (duplicate lesson, revisions, capture-jobs, draft=1) | Не добавлено ✅ |
| `handleDuplicateSlide` на странице урока | Client-side копия слайда — не Phase 3 duplicate lesson API ✅ |
| draft/publish, storyboard, capture wizard | Не реализовано ✅ |
| Backend changes Phase 2 | Нет новых endpoints (reuse PUT slides) ✅ |

---

## Security & UX

| Область | Оценка |
|---------|--------|
| Autosave / beforeunload | ✅ Предупреждение только при dirty |
| Demo bridge tester postMessage | ✅ `window.location.origin`; listener фильтрует origin (`learnBridge.ts`) |
| Deep link preview / external href | ✅ `rel="noopener noreferrer"` |
| User-facing errors autosave | ✅ RU: «Не удалось автосохранить слайд» |
| Hotspot coords в image space | ✅ Transform только CSS viewport — % не искажаются |
| DOMPurify pipeline | ✅ Без регрессий (LessonHtml / RichTextEditor) |

---

## Findings

### Blockers fixed by Reviewer

| ID | Файл | Проблема | Исправление |
|----|------|----------|-------------|
| B1 | `AuthorLessonPage.tsx` | Отсутствовало `const validationHint = useMemo(() => {` — TS1128, страница не компилировалась | Добавлено объявление useMemo |
| B2 | `PublishChecklistPanel.tsx` | Import paths `../api` вместо `../../api` — модуль не резолвился | Исправлены пути |

### Warnings

| ID | Область | Описание |
|----|---------|----------|
| W6 | Zoom range | plan.md: 50–200%; код: 100–300% (`screenshotViewport.ts`). Функционально zoom/pan есть; расхождение с текстом плана. |
| W7 | Slide problem indicators | plan.md §2: индикация проблем (нет image, нет hotspots) в боковой панели. `SlideReorderList` показывает thumbnail + badge count hotspots, но не подсвечивает placeholder image или отсутствие hotspots. Чеклист в toolbar компенсирует частично. |
| W8 | `lessonId` в autosave hook | Параметр объявлен в contract, не используется в теле hook — TS6133 при strict tsc. |
| W9 | Alt+Arrow resize | Contract §2.6 TBD — не реализовано (ожидаемо). |
| W10 | Unit coverage | Нет тестов `DeepLinkBuilder.detectPreset`, `PublishChecklistPanel` render; есть `publishChecklist.test.ts`, `useAuthorSlideAutosave.test.ts`, `LessonSlideView.test.tsx`. |

### Nitpicks

| ID | Описание |
|----|----------|
| N4 | `LessonSlideView.tsx` — unused import `LessonSlide` (tsc) |
| N5 | `HotspotEditor.tsx` — unused `rect` variable (tsc) |
| N6 | Autosave message «Слайд автосохранён» может мелькать часто при активном редактировании |

---

## Соответствие impl-log.md

Заявления Builder Phase 2 в `impl-log.md` подтверждены diff-ревью и тестами, за исключением B1/B2 — дефекты сборки, исправленные Reviewer.

---

## Рекомендации для Integrator (Phase 2)

1. Smoke: `/author/lessons/{id}` — 3 колонки, viewport без page scroll; редактирование caption → dirty chip → autosave через ~2 с.
2. Smoke: HotspotEditor — zoom wheel, Space+drag pan, numeric fields, стрелки nudge.
3. Smoke: `PublishChecklistPanel` — ошибки/warn на неполном уроке; «Готово» на seed orientation уроке.
4. Smoke: `DemoBridgeTesterPanel` — simulate postMessage, chip match при совпадении learn_step.
5. Smoke: `LessonPage` — регрессия после extract `LessonSlideView` (carousel, verify, quiz).
6. Smoke: Import JSON с другим `lesson.id` → URL меняется (W3).
7. Миграции БД **не требуются**.

---

## Handoff

**Phase 2 — ЗЕЛЁНЫЙ** (после исправления B1–B2 Reviewer). Integrator может выполнять smoke Phase 2. W6–W7 — follow-up Builder или PO acceptance, не блокируют Integrator.

---

# Review Report: Learn Authoring Constructor — Builder Phase 3

**Дата:** 2026-06-18  
**Роль:** Reviewer  
**Репозиторий:** `C:\project\Student`  
**Артефакты:** `plan.md` §Phase 3, `contract.md` §1.3/§2.9, `data-model.md` §3, `impl-log.md` §Phase 3

---

## Вердикт: ЗЕЛЁНЫЙ

Builder Phase 3 реализует draft/publish, revisions/rollback, duplicate lesson, capture-jobs stub и фронтенд-компоненты (storyboard, revision panel, capture wizard). Контракт §1.3 соблюдён; изоляция черновика для ученика подтверждена тестами. **Reviewer исправил 1 compile-blocker** в `AuthorStoryboardView.tsx` (неверный import path). Миграция `008` не применена локально (нет `psycopg2`/PostgreSQL) — задача Integrator.

---

## Результаты тестов

| Suite | Команда | Результат |
|-------|---------|-----------|
| Backend | `cd backend; pytest -q` | **53 passed** (5 deprecation warnings — pre-existing) |
| Frontend | `cd frontend; npm run test -- --run` | **77 passed** (21 files; stderr `act(...)` — pre-existing) |
| Alembic | `alembic upgrade head` | **Не выполнено** — `ModuleNotFoundError: psycopg2`; синтаксис `008_lesson_revisions_drafts.py` проверен code review |

---

## Contract checklist (§1.3 Phase 3)

### API

| Пункт | Статус | Комментарий |
|-------|--------|-------------|
| `POST /author/lessons/{id}/duplicate` | ✅ | `author.py:536–553`, копия slides + image files |
| Request `new_id`, `title_suffix` | ✅ | `DuplicateLessonRequest` |
| Response 201 `AuthorLessonDetail` | ✅ | тест `test_duplicate_lesson` |
| `GET /author/lessons/{id}/revisions` | ✅ | `items[{id, created_at, author_user_id, summary}]` |
| `POST /author/lessons/{id}/revisions` | ✅ | Снимок **опубликованного** состояния |
| Автоснимок «Автосохранение» при первом `PUT` после публикации | ✅ | `author.py:241–242` |
| `POST .../revisions/{id}/rollback` | ✅ | Восстанавливает published; сбрасывает draft |
| `POST /author/lessons/{id}/publish` | ✅ | Revision «Перед публикацией» → apply draft → clear flag |
| `GET /lessons/{id}?draft=1` author-only | ✅ | 403 для non-author; тест draft isolation |
| Ученик без `draft=1` — только published tables | ✅ | `lessons.py:180–212` |
| `AuthorLessonDetail.has_unpublished_changes` | ✅ | schema + UI chip |
| `AuthorLessonDetail.published_at` | ✅ | ISO string \| null |
| Draft model Variant B (`draft_payload`, columns on `lessons`) | ✅ | migration 008 + model |
| Author PUT/POST slide → `draft_payload` | ✅ | `persist_draft` во всех write paths |
| `POST /author/capture-jobs` stub 202 | ✅ | `status: "stub"`, CLI instruction |

### Frontend (§2.9)

| Компонент | Статус | Комментарий |
|-----------|--------|-------------|
| `AuthorStoryboardView` | ✅ | Grid thumbnails + caption strip; CSS в `index.css` |
| `AuthorRevisionHistoryPanel` | ✅ | List + ConfirmModal rollback |
| `AuthorCaptureWizardModal` | ✅ | URL + slide binding; stub response |
| `AuthorLessonPage` — раскадровка toggle | ✅ | |
| Badge «Черновик» / «Опубликовать» | ✅ | Chips + publish button |
| Превью `?preview=1&draft=1` | ✅ | Link в toolbar |
| `AuthorModulesPage` — «Дублировать» | ✅ | `duplicateAuthorLesson` |
| `getLesson(id, { draft: true })` | ✅ | `learnApi.ts`, `LessonPage` |

### Deferred (§1.3.1)

| Тема | Статус |
|------|--------|
| Per-lesson quiz | ⏸ не реализовано (ожидаемо) |
| AI caption / LLM | ⏸ |
| Live demo iframe | ⏸ |
| Full capture worker | ⏸ stub + CLI |
| Slide templates DB | ⏸ |

---

## Data model (§3)

| Пункт | Статус | Комментарий |
|-------|--------|-------------|
| `lesson_revisions` table | ✅ | `id`, `lesson_id`, `created_at`, `created_by_user_id`, `label`, `snapshot_json` |
| Index `(lesson_id, created_at)` | ✅ | `ix_lesson_revisions_lesson_created` |
| `lessons.draft_payload` JSONB | ✅ | AuthorLessonDetail/export shape |
| `lessons.has_unpublished_changes` | ✅ | default `false` (server_default) |
| `lessons.published_at` | ✅ | nullable TIMESTAMPTZ |
| Publish: draft → published tables, clear draft | ✅ | `publish_lesson` |
| Rollback: snapshot → published, clear draft | ✅ | `rollback_revision` + safety snapshot «Перед откатом» |
| Combined migration 008 (revisions + draft cols) | ✅ | data-model планировал 008/009 отдельно — допустимое упрощение |

---

## Security

| Область | Оценка |
|---------|--------|
| Duplicate / revisions / publish / capture-jobs | ✅ `get_current_author` |
| `?draft=1` learner endpoint | ✅ 403 `forbidden` при `role != author` |
| Rollback safety | ✅ Pre-rollback snapshot «Перед откатом»; ConfirmModal в UI |
| Duplicate image copy path traversal | ✅ Reject `..` in module_id/lesson_id/filename |
| Learner isolation | ✅ Student GET без draft читает `lesson_slides`, не `draft_payload` |
| Capture stub | ✅ Нет write в demo; только инструкция CLI |

---

## Module boundaries

| Проверка | Результат |
|----------|-----------|
| Per-lesson quiz | Не добавлено ✅ |
| AI / LLM endpoints | Не добавлено ✅ |
| Async capture worker / `capture_jobs` table | Не добавлено ✅ |
| Phase 2 regressions | Тесты зелёные ✅ |

---

## Findings

### Blockers fixed by Reviewer

| ID | Файл | Проблема | Исправление |
|----|------|----------|-------------|
| B3 | `AuthorStoryboardView.tsx` | Import `../api/authorApi` — модуль не резолвится (`tsc` TS2307) | Заменено на `../../api/authorApi` |

### Warnings

| ID | Область | Описание |
|----|---------|----------|
| W11 | Onboarding publish | Новый урок + слайд через Author API пишет слайды только в `draft_payload`; ученик не видит контент до первого `POST /publish`. По контракту корректно; методисту нужен явный publish. |
| W12 | Import JSON | `import_lesson` пишет напрямую в published tables, минуя draft — поведение legacy, не описано в §1.3. |
| W13 | Alembic smoke | Локально `alembic upgrade head` не проверен (нет PostgreSQL driver). Integrator обязан применить на PG. |
| W14 | Test coverage | Нет теста `GET ?draft=1` → 403 для student; security реализован в коде. |
| W15 | Storyboard tests | `AuthorStoryboardView.test.ts` тестирует только `stripHtmlToText` helper, не render компонента. |
| W16 | impl-log encoding | `impl-log.md` Phase 3 — битая кодировка (mojibake) в заголовках; содержание читаемо. |

### Nitpicks

| ID | Описание |
|----|----------|
| N7 | `publish` без `has_unpublished_changes` всё равно создаёт revision и re-apply — безвредно, но лишний round-trip. |
| N8 | Duplicate UI не навигирует к новому уроку — только добавляет в список. |

---

## Соответствие impl-log.md

Заявления Builder Phase 3 подтверждены diff-ревью и тестами. Расхождение: B3 compile-blocker исправлен Reviewer до handoff.

---

## Рекомендации для Integrator (Phase 3)

1. `alembic upgrade head` — revision `008_lesson_revisions_drafts` на PostgreSQL.
2. Seed backward compat: существующие уроки получают `has_unpublished_changes=false` (server_default).
3. Smoke: duplicate урок → edit draft → learner не видит → publish → learner видит.
4. Smoke: revision list → rollback → ConfirmModal → published content restored.
5. Smoke: author `?preview=1&draft=1` vs student `?preview=1` (без draft).
6. Smoke: capture wizard → stub 202 + CLI message.
7. Smoke: orientation seed уроки — регрессия learner flow.

---

## Handoff

**Phase 3 — ЗЕЛЁНЫЙ** (после исправления B3). Integrator может выполнять `alembic upgrade head` и smoke Phase 3. W11–W15 не блокируют Integrator.

