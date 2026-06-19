# App refactor — implementation log

## Phase 1 (2026-06-18)

**Builder:** CSS split, lesson/author component extraction, types barrel, dead CSS removal, backend author route sections.

### Changed files

#### Documentation
- `docs/features/app-refactor/plan.md` — roadmap Phases 1–5
- `docs/features/app-refactor/impl-log.md` — this file

#### Frontend — CSS
- `frontend/src/index.css` — reduced to `@import` chain
- `frontend/src/styles/tokens.css` — `:root` design tokens
- `frontend/src/styles/base.css` — reset + shared utilities
- `frontend/src/styles/catalog.css` — catalog layout
- `frontend/src/styles/lesson-page.css` — lesson shell, header grid, body grid
- `frontend/src/styles/screenshot.css` — screenshot guide, hotspot buttons
- `frontend/src/styles/author.css` — author editor + constructor
- `frontend/src/styles/portal-wiki.css` — home, wiki
- `frontend/src/styles/quiz-editor.css` — quiz panel, rich text editor

#### Frontend — structure
- `frontend/src/constants/lessonLayout.ts` — grid class helpers
- `frontend/src/types/lesson.ts`, `types/index.ts` — domain type barrel
- `frontend/src/components/lesson/LessonShell.tsx`
- `frontend/src/components/lesson/LessonPageHeader.tsx`
- `frontend/src/components/lesson/LessonPreviewBanner.tsx`
- `frontend/src/components/author/AuthorConstructorLayout.tsx`
- `frontend/src/components/author/AuthorLessonToolbar.tsx`
- `frontend/src/pages/LessonPage.tsx` — uses extracted components
- `frontend/src/pages/AuthorLessonPage.tsx` — uses extracted layout/toolbar
- `frontend/src/components/author/HotspotEditor.tsx` — types import
- `frontend/src/utils/hotspots.ts` — types import

#### Backend
- `backend/app/api/v1/learn/author.py` — section comments (modules/lessons/slides/…)

### Removed / cleaned
- Orphan CSS class `.screenshot-frame-pannable`
- Duplicate utility block in `lesson-page.css` (moved to `base.css`)

### Tests & build
- `pytest -q`: **54 passed**
- `npm run test -- --run`: **105 passed** (29 files)
- `npm run build`: **OK**

### Notes
- No product behavior, verify, or DB changes.
- TipTap/MUI stack untouched.
- Phase 2 pending PO approval.

---

## Phase 2 (2026-06-18)

**Builder:** Feature folders, HotspotEditor split, backend author router package, types migration, backward-compatible re-exports.

### Frontend — feature folders

**New canonical paths:**

| Feature | Path | Contents |
|---------|------|----------|
| `lesson` | `frontend/src/features/lesson/` | LessonActions, LessonReferencePanel, LessonRoadmap, LessonNextStepCard, LessonSlideView, LessonHtml, LessonScreenshotHintsPanel, LessonShell, LessonPageHeader, LessonPreviewBanner + tests |
| `author` | `frontend/src/features/author/` | All author components (HotspotEditor, RichTextEditor, …), extensions/, `useAuthorSlideAutosave` hook |

**Barrel exports:** `features/lesson/index.ts`, `features/author/index.ts`

**Backward-compatible re-exports** (thin stubs, no logic):
- `frontend/src/components/Lesson*.tsx` → `features/lesson/components/`
- `frontend/src/components/lesson/*.tsx` → `features/lesson/components/`
- `frontend/src/components/author/**` → `features/author/components/`
- `frontend/src/hooks/useAuthorSlideAutosave.ts` → `features/author/hooks/`

Existing pages (`LessonPage`, `AuthorLessonPage`, …) continue importing from `components/` without change.

### Frontend — HotspotEditor split

| File | Role |
|------|------|
| `HotspotEditor.tsx` | Main orchestrator (**251 lines**, was ~842) |
| `HotspotEditorFrame.tsx` | Canvas + overlay rendering |
| `HotspotEditorList.tsx` | Sidebar list + list item |
| `useHotspotDrag.ts` | Draw/move/resize drag hook |
| `hotspotEditorUtils.ts` | clamp, toPercent, displayHotspot, zoneClassName, isEditableTarget |

`HotspotToolToolbar.tsx` unchanged (already extracted in Phase 1 scope).

### Frontend — types migration

Domain types moved from `learnApi` imports to `types/lesson` in:
- `features/lesson/components/*`
- `features/author/components/*`, `features/author/hooks/*`
- `api/authorApi.ts`
- `components/QuizPanel.tsx`, `SlideCarousel.tsx`, catalog components
- `utils/catalogGrouping.ts`, `utils/lessonUi.ts`, `utils/screenshotViewport.ts`, `utils/hotspotZoomCrop.ts`, `hooks/useScreenshotViewport.ts`, `hooks/useVerifyPolling.ts`

`LearnApiError` and API functions remain imported from `learnApi`.

### Backend — author router split

Replaced monolithic `author.py` with package `backend/app/api/v1/learn/author/`:

| Module | Routes |
|--------|--------|
| `helpers.py` | Shared 404 helpers, `lesson_to_detail`, `lesson_list_items` |
| `modules.py` | `GET /modules`, `GET/PATCH …/lessons` |
| `lessons.py` | Lesson CRUD, import/export, duplicate, publish |
| `slides.py` | Slide CRUD, reorder, upload |
| `quiz.py` | Module quiz GET/PUT |
| `revisions.py` | Revisions list/create/rollback |
| `capture.py` | Capture job stub |
| `__init__.py` | Combined router `prefix="/author"` |

**API paths unchanged.** `learn/__init__.py` import unchanged: `from app.api.v1.learn.author import router`.

**Fix:** `authoring_phase3.snapshot_to_detail` lazy import corrected to `lessons._slide_to_response` (was broken reference to removed `author._slide_to_response`).

### Tests & build
- `pytest -q`: **54 passed**
- `npm run test -- --run`: **106 passed** (30 files)
- `npm run build`: **OK**

### Notes
- No product behavior, verify, or DB changes.
- Phase 3 pending PO approval.

---

## Phase 3 (2026-06-18)

**Builder:** Incremental CSS Modules for high-traffic lesson/author components; lesson progress state machine + verify/demo-bridge hooks; `LessonPage` slimmed to orchestrator.

### CSS Modules (coexist with global `tokens.css`)

| Component | Module | Removed from global |
|-----------|--------|---------------------|
| `LessonRoadmap` | `features/lesson/components/LessonRoadmap.module.css` | `lesson-page.css` roadmap block + mobile overrides |
| `LessonNextStepCard` | `features/lesson/components/LessonNextStepCard.module.css` | `lesson-page.css` next-step block |
| `HotspotToolToolbar` | `features/author/components/HotspotToolToolbar.module.css` | `author.css` toolbar block |

Parent context (`.lesson-page-header__roadmap`) kept in global CSS; roadmap module uses `:global(.lesson-page-header__roadmap) .root` for nested overrides.

### Lesson hooks (`features/lesson/hooks/`)

| Hook | Role |
|------|------|
| `useLessonProgress` | Phase machine: `loading` \| `active` \| `verifying` \| `completed` \| `error`; slide index + sessionStorage; hotspot selection; quiz/demo handlers |
| `useLessonVerify` | `verifyLesson` + `useVerifyPolling`; actions `startVerify`, `completeManual` |
| `useDemoBridge` | `listenForLearnStepDone` → auto-verify when `learn_step` matches |

`LessonPage.tsx` (~140 lines) delegates to `useLessonProgress`; no API/DB/verify contract changes.

**Barrel:** `features/lesson/index.ts` exports hooks + `LessonProgressPhase`.

### Tests & build
- `pytest -q`: **54 passed**
- `npm run test -- --run`: **106 passed** (30 files)
- `npm run build`: **OK**

### Notes
- No product behavior or layout changes intended.
- Global CSS sections (`lesson-page.css`, `author.css`, `screenshot.css`) remain for non-migrated components.
- Phase 4 pending PO approval.

---

## Phase 4 (2026-06-18)

**Builder:** Verify engine package split; authoring service merge; orphan CSS cleanup; modular seed.

### Backend — verify package

`backend/app/services/verify/` (replaces monolithic `verify.py`):

| Module | Role |
|--------|------|
| `_common.py` | Audit log, pass helpers, touch verify timestamps |
| `demo.py` | Re-export Demo API polling (`poll_for_project`, `poll_for_job`) |
| `manual.py` | `manual` strategy (lesson / step / self-study) |
| `navigation.py` | `navigation` strategy |
| `resource_exists.py` | `resource_exists` + Demo polling |
| `quiz_passed.py` | `quiz_passed` pending response |
| `job_completed.py` | `job_completed` + job polling |
| `lesson.py` | `run_lesson_verify` dispatcher |
| `step.py` | `run_verify` (legacy steps API) |
| `self_study.py` | `run_self_study_verify` |
| `__init__.py` | Public API unchanged for routes |

### Backend — authoring package

`backend/app/services/authoring/` (merges `authoring.py` + `authoring_phase3.py`):

| Module | Role |
|--------|------|
| `validation.py` | slugify, tags, hotspots, quiz, verify_type validation |
| `files.py` | Content/wiki file writes |
| `slide_response.py` | `hotspots_from_json`, `slide_to_response` (shared with lessons API) |
| `lifecycle.py` | draft/publish, revisions, duplicate, snapshot helpers |
| `__init__.py` | Single import path `from app.services.authoring import …` |

**Removed circular import:** `snapshot_to_detail` no longer lazy-imports from `lessons.py`; uses `slide_response.py`.

**Deleted:** `authoring.py`, `authoring_phase3.py`.

### Backend — modular seed

| File | Content |
|------|---------|
| `seed/data.py` | `run_seed` orchestrator (unchanged import path) |
| `seed/constants.py` | `DEMO_UI_BASE`, `CONTENT_BASE`, `PLACEHOLDER_SLIDE`, `RETIRED_LESSON_IDS` |
| `seed/orientation.py` | `ORIENTATION_STEPS`, `ORIENTATION_LESSONS`, `QUIZ_PLACEHOLDERS` |
| `seed/catalog.py` | Extra modules + `MODULE_SPECS`, `_remove_retired_lessons` |
| `seed/modules.py` | `seed_module`, `seed_all_modules` |
| `seed/accounts.py` | `seed_training_accounts` |
| `seed/wiki.py` | `WIKI_ARTICLE_SPECS`, `seed_wiki_articles` |
| `seed/self_study.py` | `SELF_STUDY_*`, `seed_self_study` |

### Frontend — dead CSS removed

Orphan global rules (not referenced in TSX) removed from:

- `styles/lesson-page.css` — `lesson-ref-expected`, `lesson-ref-hotspots`, `lesson-ref-outline`, `lesson-ref-slide-progress`, `lesson-hints-title`
- `styles/author.css` — `author-slide-tabs`, `author-split`, `author-file-label`, `author-toolbar-group`, `btn-preview*`, `hotspot-editor-description`
- `styles/screenshot.css` — `screenshot-frame-dragging`, `screenshot-viewport--animate`, `slide-caption`
- `mui-overrides.css` — orphan `lesson-ref-expected` accordion hover

Phase 3 CSS module blocks (roadmap, next-step, hotspot toolbar) were already migrated in Phase 3.

### Tests & build

- `pytest -q`: **54 passed**
- `npm run test -- --run`: **106 passed** (30 files)
- `npm run build`: **OK**

### Notes

- No API contract or product behavior changes.
- Phase 5 (E2E & CI) pending PO approval.

---

## Phase 5+ (planned)

See `plan.md`.
