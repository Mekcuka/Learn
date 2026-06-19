# Контракт: Learn Authoring Constructor

**Base path (Author API):** `/api/v1/learn/author`  
**Frontend routes:** `/author`, `/author/lessons/{lessonId}`  
**Связанный контракт:** [learn-authoring/contract.md](../learn-authoring/contract.md)

---

## 1. API changes

### 1.1. Phase 1 — Reorder lessons (NEW)

#### `PATCH /api/v1/learn/author/modules/{module_id}/lessons/reorder`

**Auth:** `role=author`

**Request:**
```json
{
  "lesson_ids": ["lesson-01-login", "lesson-02-create-project", "lesson-03-navigation"]
}
```

**Validation:**
- Все `lesson_ids` принадлежат `module_id`
- Длина списка = количеству уроков модуля (полная перестановка)
- Порядок `sort_order` присваивается 1..N по позиции в массиве

**Response 200:** массив `AuthorLessonListItem[]` в новом порядке

**Errors:**

| HTTP | `detail` | Когда |
|------|----------|-------|
| 404 | `module_not_found` | Неверный module_id |
| 422 | `validation_error` | Неполный список / чужой lesson_id |

**Backend files:** `author.py`, `schemas/author.py` (`ReorderLessonsRequest`), `services/authoring.py` (optional helper)

**Frontend:** `authorApi.reorderAuthorLessons(moduleId, lessonIds)`, `AuthorModulesPage` drag-list

---

### 1.2. Phase 1 — без изменений (reuse)

| Method | Path | Использование в конструкторе |
|--------|------|------------------------------|
| PUT | `/lessons/{lesson_id}` | Сохранение meta + verify после `VerifyConfigForm` |
| PUT | `/slides/{slide_id}` | Autosave Phase 2 |
| POST | `/modules/{module_id}/lessons/import` | Import JSON на `AuthorLessonPage` |
| PATCH | `/lessons/{lesson_id}/slides/reorder` | Уже есть |

---

### 1.3. Phase 3 — Advanced (IMPLEMENTED)

#### `POST /api/v1/learn/author/lessons/{lesson_id}/duplicate`

**Request:** `{ "new_id": "optional-string", "title_suffix": " (копия)" }`  
**Response 201:** `AuthorLessonDetail` — копия урока (draft/working snapshot), новые slide ids, копирование image files в папку урока.

#### `GET /api/v1/learn/author/lessons/{lesson_id}/revisions`

**Response 200:** `{ "items": [{ "id", "created_at", "author_user_id", "summary" }] }`

#### `POST /api/v1/learn/author/lessons/{lesson_id}/revisions`

**Request:** `{ "label": "optional" }`  
**Response 201:** снимок **опубликованного** состояния (таблицы `lessons` + `lesson_slides`).

Автоснимок «Автосохранение» создаётся при первом `PUT /lessons/{id}` после публикации.

#### `POST /api/v1/learn/author/lessons/{lesson_id}/revisions/{revision_id}/rollback`

**Response 200:** `AuthorLessonDetail` — восстанавливает опубликованное состояние из снимка; черновик сбрасывается.

#### `POST /api/v1/learn/author/lessons/{lesson_id}/publish`

**Response 200:** `AuthorLessonDetail` — применяет `draft_payload` к опубликованным таблицам; создаёт revision «Перед публикацией»; сбрасывает `has_unpublished_changes`.

#### `GET /api/v1/learn/lessons/{lesson_id}?draft=1`

**Auth:** `role=author` (иначе 403).  
**Response:** `LessonDetailResponse` из черновика (`draft_payload` или working snapshot).

Ученик без `draft=1` всегда читает опубликованные `lessons` + `lesson_slides`.

#### `AuthorLessonDetail` — новые поля

| Field | Type | Notes |
|-------|------|-------|
| `has_unpublished_changes` | boolean | true если есть несохранённый в публикацию черновик |
| `published_at` | ISO string \| null | время последней публикации |

#### Draft model (Variant B)

| Column | Table | Notes |
|--------|-------|-------|
| `draft_payload` | `lessons` | JSON AuthorLessonDetail/export shape |
| `has_unpublished_changes` | `lessons` | |
| `published_at` | `lessons` | |

Author `PUT` slide/lesson, `POST` slide — пишут в `draft_payload`. Публикация — в таблицы.

#### `POST /api/v1/learn/author/capture-jobs`

**Status:** **stub (MVP)** — `202`, `{ id, status: "stub", message }` с инструкцией `npm run capture:screens`.  
**Follow-up:** async job + Playwright worker (Phase 3.1).

---

### 2.9. Phase 3 frontend components

| Component | Path | Назначение |
|-----------|------|------------|
| `AuthorStoryboardView` | `components/author/AuthorStoryboardView.tsx` | Grid слайдов + caption preview |
| `AuthorRevisionHistoryPanel` | `components/author/AuthorRevisionHistoryPanel.tsx` | Список revisions + rollback |
| `AuthorCaptureWizardModal` | `components/author/AuthorCaptureWizardModal.tsx` | URL + slide binding; stub backend |

**AuthorLessonPage:** toggle «Раскадровка», badge «Черновик», «Опубликовать», превью `?preview=1&draft=1`.  
**AuthorModulesPage:** кнопка «Дублировать».

---

### 1.3.1. Phase 3 — Deferred (documented)

| Topic | Status |
|-------|--------|
| Per-lesson quiz | Product change — skip |
| AI caption / LLM | Phase 3.1 follow-up |
| Live demo iframe embed | Security review — follow-up |
| Full capture job worker | Stub + CLI; Phase 3.1 |
| Slide templates (DB) | Seed JSON preferred; not in MVP |

---

## 2. Frontend component contracts

### 2.1. `LessonSlideView` (NEW — Phase 2)

**Path:** `frontend/src/components/LessonSlideView.tsx`

```typescript
type LessonSlideViewMode = "student" | "author" | "preview";

type LessonSlideViewProps = {
  mode: LessonSlideViewMode;
  lesson: LessonDetail | AuthorLessonDetail; // shared slide shape
  slideIndex: number;
  onSlideIndexChange: (index: number) => void;
  activeHotspotId?: string | null;
  onHotspotSelect?: (id: string | null) => void;
  // student/preview only:
  lessonState?: LessonState;
  busy?: boolean;
  feedback?: VerifyResult | null;
  quizResult?: QuizSubmitResult | null;
  isPreview?: boolean;
  onOpenDemo?: () => void;
  onVerify?: () => void;
  onQuizSubmit?: (answers: Record<string, string[]>) => void;
};
```

**Поведение:**
- `student` / `preview`: рендер `LessonActions` + `SlideCarousel` или `QuizPanel`
- `author`: только `SlideCarousel` + опциональный banner «Режим конструктора»; без verify API calls
- Keyboard `←/→` — смена слайда (reuse logic from `SlideCarousel`)

**Refactor:** `LessonPage.tsx` заменяет inline block lines ~354–398 на `<LessonSlideView ... />`.

---

### 2.2. `VerifyConfigForm` (NEW — Phase 1)

**Path:** `frontend/src/components/author/VerifyConfigForm.tsx`

```typescript
type VerifyConfigFormProps = {
  verifyType: VerifyType;
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  disabled?: boolean;
};
```

**UI:**
- Typed fields per verify type (см. §3)
- Link «Расширенный режим (JSON)» → collapsible `TextField` multiline (текущее поведение)
- При смене `verifyType` — merge с **preset defaults** (не затирать неизвестные ключи в advanced JSON)

**Integration:** `AuthorLessonPage` удаляет standalone `verifyConfigJson` state; единый `lesson.verify.config` object.

---

### 2.3. `DeepLinkBuilder` (NEW — Phase 1)

**Path:** `frontend/src/components/author/DeepLinkBuilder.tsx`

```typescript
type DeepLinkBuilderProps = {
  value: string | null;
  onChange: (template: string) => void;
  disabled?: boolean;
};
```

**Presets (RU labels, EN values):**

| Preset id | Template |
|-----------|----------|
| `projects_list` | `https://97.60.spark.modeltech.ru/projects` |
| `projects_with_step` | `https://97.60.spark.modeltech.ru/projects?learn_step={learn_step}` |
| `project_map` | `https://97.60.spark.modeltech.ru/projects/{project_id}` |
| `project_map_tour` | `https://97.60.spark.modeltech.ru/projects/{project_id}?learn_step={learn_step}&tour={tour}` |
| `custom` | free TextField |

**Fields:** `learn_step` (text), `tour` (text, optional), hint про `{project_id}` placeholder.

**Util:** reuse `buildDeepLink()` from `utils/deepLink.ts` for live preview chip.

---

### 2.4. `PublishChecklistPanel` (NEW — Phase 2)

**Path:** `frontend/src/components/author/PublishChecklistPanel.tsx`

```typescript
type ChecklistItem = {
  id: string;
  label: string;
  status: "ok" | "warn" | "error";
  hint?: string;
};

type PublishChecklistPanelProps = {
  lesson: AuthorLessonDetail;
  quiz?: AuthorQuiz | null;
};
```

**Rules (client-side):**

| id | Rule | severity |
|----|------|----------|
| `slides_exist` | `slides.length >= 1` | error |
| `images_present` | each slide `image_path` non-empty and ≠ placeholder | warn |
| `hotspots_labeled` | slides with hotspots: each has non-empty `label` | warn |
| `expected_results` | ≥1 slide has `expected_result_html` if not quiz lesson | warn |
| `verify_config_valid` | schema validate per type | error |
| `deep_link_if_needed` | `navigation`/`resource_exists` → deep_link_template set | warn |
| `quiz_questions` | if `quiz_passed`: module quiz ≥1 question with correct option | error |

---

### 2.5. `DemoBridgeTesterPanel` (NEW — Phase 2)

**Path:** `frontend/src/components/author/DemoBridgeTesterPanel.tsx`

```typescript
type DemoBridgeTesterPanelProps = {
  learnStep: string | undefined; // from verify.config.learn_step
};
```

**UI:**
- Input `step` (default from config)
- Button «Симулировать postMessage» → `window.postMessage({ type: "learn:step_done", step })`
- Indicator: match / no match с `learn_step`
- Ссылка на [demo-bridge.md](../learn/demo-bridge.md)

**Note:** тестер работает в контексте той же вкладки; для полного E2E — открыть превью + демо в двух окнах.

---

### 2.6. `HotspotEditor` extensions (Phase 2)

**Existing path:** `frontend/src/components/author/HotspotEditor.tsx`

**New optional props:**
```typescript
type HotspotEditorProps = {
  // ...existing
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  showNumericFields?: boolean;
};
```

**Keyboard (when hotspot selected, not in input):**
- `Arrow keys` — nudge position ±0.5%
- `Shift+Arrow` — nudge ±2%
- `Alt+Arrow` — resize edge (TBD in impl-log)

---

### 2.7. `SlideReorderList` extensions (Phase 1)

**Add:** thumbnail `<img src={slide.image_path}>` 48×27 или `object-fit: cover` в `.author-slide-reorder-thumb`

---

### 2.8. Autosave hook (Phase 2)

**Path:** `frontend/src/hooks/useAuthorSlideAutosave.ts`

```typescript
function useAuthorSlideAutosave(options: {
  slide: LessonSlide | null;
  lessonId: string;
  debounceMs?: number; // default 2000
  onSaved: (lesson: AuthorLessonDetail) => void;
  onError: (message: string) => void;
}): { dirty: boolean; saving: boolean; flush: () => Promise<void> };
```

---

## 3. VerifyConfigForm schemas per verify type

Значения полей соответствуют [learn/contract.md](../learn/contract.md) §2 и `backend/app/services/authoring.py` `ALLOWED_VERIFY_TYPES`.

### 3.1. `manual`

```json
{ "type": "manual", "config": {} }
```

**Form fields:** нет (empty config).  
**Preset:** `{}`

---

### 3.2. `resource_exists`

```json
{
  "type": "resource_exists",
  "config": {
    "demo_endpoint": "GET /api/v1/projects",
    "resource_type": "project",
    "match": {
      "created_after_step_start": true,
      "timestamp_field": "created_at",
      "name_contains": null
    }
  }
}
```

| Field | UI | Default |
|-------|-----|---------|
| `demo_endpoint` | Select: `GET /api/v1/projects`, `GET /api/v1/projects/{project_id}/jobs` (Phase 2 label) | projects |
| `resource_type` | Text / select | `project` |
| `match.created_after_step_start` | Checkbox | `true` |
| `match.timestamp_field` | Text | `created_at` |
| `match.name_contains` | Text optional | empty → null |

---

### 3.3. `navigation`

```json
{
  "type": "navigation",
  "config": {
    "learn_step": "navigation",
    "deep_link_path": "/projects/{project_id}/map",
    "tour_anchor": "",
    "fallback": "manual"
  }
}
```

| Field | UI | Default |
|-------|-----|---------|
| `learn_step` | Text | `navigation` |
| `deep_link_path` | Text | `/projects/{project_id}/map` |
| `tour_anchor` | Text optional | `""` |
| `fallback` | Select: `manual` | `manual` |

**Sync:** `learn_step` дублируется в deep link query через `DeepLinkBuilder` (helper link «Подставить в deep link»).

---

### 3.4. `quiz_passed`

```json
{
  "type": "quiz_passed",
  "config": {
    "pass_threshold_percent": 80
  }
}
```

| Field | UI | Default |
|-------|-----|---------|
| `pass_threshold_percent` | Number 0–100 | `80` |

**Note:** `question_ids` не в Author form — вопросы из module quiz (`QuizEditor`).

---

### 3.5. `job_completed`

```json
{
  "type": "job_completed",
  "config": {
    "demo_endpoint": "GET /projects/{project_id}/jobs/{job_id}",
    "expected_status": "completed",
    "timeout_seconds": 600
  }
}
```

| Field | UI | Default |
|-------|-----|---------|
| `demo_endpoint` | Text (readonly preset) | см. JSON |
| `expected_status` | Select: `completed`, `success` | `completed` |
| `timeout_seconds` | Number | `600` |

**Scope:** форма есть в Author; orientation seed не использует. Не путать с MVP orientation verify.

---

### 3.6. NOT in form (Phase 2 Learn only)

`calculation_result`, `job_failed_expected`, `resource_field_equals`, `file_uploaded` — только advanced JSON mode с предупреждением.

---

## 4. CSS classes (Phase 2)

| Class | Назначение |
|-------|------------|
| `author-constructor-body` | Grid 3-col, mirror `lesson-body` |
| `author-constructor-meta` | Left column |
| `author-constructor-main` | Center — `LessonSlideView` |
| `author-constructor-hotspots` | Right column |
| `author-toolbar--sticky` | Sticky toolbar Phase 1 |

Добавить в `frontend/src/index.css` рядом с `.author-layout`, `.lesson-body`.

---

## 5. Keyboard shortcuts (Phase 1)

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+S` | Save active slide (or lesson if no slide dirty) | `AuthorLessonPage` |
| `Ctrl+Shift+S` | Save lesson meta | `AuthorLessonPage` |
| `←` / `→` | Prev/next slide | Not in TipTap focus |
| `Delete` | Delete selected hotspot | `HotspotEditor` focus, Phase 2 |

---

## 6. Errors (no new codes Phase 1–2)

Reuse Author API errors from [learn-authoring/contract.md](../learn-authoring/contract.md).

Client-side validation errors (RU messages):
- `Невалидный JSON в расширенном режиме verify`
- `Укажите deep link для типа проверки «Навигация»`
- `Порог квиза должен быть от 0 до 100`
