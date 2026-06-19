# App-wide refactor — roadmap

**Статус:** Phase 1–4 выполнены (2026-06-18). Phase 5 — по approval PO.

**Цель:** снизить связность монолитных файлов, улучшить навигацию по кодовой базе и подготовить почву для feature-модулей без изменения продуктового поведения MVP.

## Аудит (Phase 0)

### Frontend

| Область | Наблюдение | Риск |
|---------|------------|------|
| `index.css` | ~4540 строк, 8 логических секций | Высокий — правки ломают unrelated UI |
| `LessonPage.tsx` | ~411 строк, header+body+verify в одном файле | Средний |
| `AuthorLessonPage.tsx` | ~793 строк, toolbar+3-col layout | Средний |
| `HotspotEditor.tsx` | ~781 строк | Средний (Phase 2 split) |
| `ScreenshotGuide.tsx` | ~308 строк | Низкий |
| Типы `HotspotItem`, `LessonSlide` | Дублируются через `learnApi` imports | Низкий |
| CSS vars `--lesson-ref-width`, grid | Дублируются className строками | Низкий |

### Backend

| Область | Наблюдение | Риск |
|---------|------------|------|
| `author.py` | 578 строк, CRUD+publish+revisions+capture | Средний (Phase 2 split routers) |
| `verify.py` | 625 строк | Phase 3 |
| `authoring.py` + `authoring_phase3.py` | Разделение draft/publish уже есть | Низкий |
| `__init__.py` learn router | Чистая регистрация 7 роутеров | OK |

### Docs / dead code

- `.screenshot-frame-pannable` — orphan CSS (класс не используется в TSX)
- `.hotspot-callout` — уже удалён ранее

---

## Phase 1 — Safe structural refactors ✅ (this run)

**Scope:** CSS split, lesson layout DRY, page component extraction, types barrel, dead CSS, backend comments.

### Frontend

1. **CSS:** `index.css` → `@import` chain в `frontend/src/styles/`:
   - `tokens.css`, `base.css`, `catalog.css`, `lesson-page.css`, `screenshot.css`, `author.css`, `portal-wiki.css`, `quiz-editor.css`
2. **Lesson layout:** `constants/lessonLayout.ts` — grid class helpers + CSS var names
3. **Components extracted:**
   - `components/lesson/LessonShell.tsx`
   - `components/lesson/LessonPageHeader.tsx`
   - `components/lesson/LessonPreviewBanner.tsx`
   - `components/author/AuthorConstructorLayout.tsx`
   - `components/author/AuthorLessonToolbar.tsx`
4. **Types:** `types/lesson.ts` + `types/index.ts` — re-export domain types
5. **Imports:** hotspot utils/components → `types/lesson`
6. **Dead CSS:** remove `.screenshot-frame-pannable`

**Acceptance criteria:**
- [ ] `npm run test -- --run` green
- [ ] `npm run build` green
- [ ] Visual parity LessonPage + AuthorLessonPage (no layout change)
- [ ] `index.css` < 20 строк (только imports)

**Risk:** Low — no API/DB/verify changes.

### Backend

1. Section comments in `author.py` (modules / lessons / slides / publish / revisions / assets)
2. No route or schema changes

**Acceptance criteria:**
- [ ] `pytest -q` green

---

## Phase 2 — Feature folders & page splits ✅ (2026-06-18)

**Scope:**
- `frontend/src/features/lesson/`, `features/author/`, `features/wiki/`
- Split `HotspotEditor.tsx` → frame + list + hooks
- Split `author.py` → `author_modules.py`, `author_lessons.py`, `author_slides.py`, `author_revisions.py`
- Migrate remaining `learnApi` type imports → `types/`
- `lessonLayout` CSS custom properties → optional shared SCSS/CSS module for grid only

**Risk:** Medium — many import path changes.

**Acceptance criteria:**
- All tests green; no behavior change; import paths documented in impl-log.

---

## Phase 3 — CSS modules & state machines ✅ (2026-06-18)

**Scope:**
- Incremental CSS Modules for lesson/author/screenshot (coexist with global tokens)
- Extract lesson progress state machine (`useLessonProgress` hook)
- Consolidate verify polling + demo bridge into `features/lesson/hooks/`

**Risk:** Medium-high — styling regressions.

**Acceptance criteria:**
- Visual regression checklist (Lesson, Author, Wiki, Self-study)
- E2E smoke script (login → lesson → verify)

---

## Phase 4 — Backend services & dead code ✅ (2026-06-18)

**Scope:**
- Split `verify.py` by verify type strategy
- Merge/refactor `authoring.py` + `authoring_phase3.py` naming
- Remove legacy step-panel CSS if unused
- Seed/data.py modularization

**Risk:** Medium — verify engine is critical path.

**Acceptance criteria:**
- Contract tests unchanged; demo integration smoke pass.

---

## Phase 5 — E2E & CI (future)

**Scope:**
- Playwright E2E: catalog, lesson slide nav, author publish flow
- CI: frontend build + backend pytest on PR

**Out of scope Phase 1–4:** TipTap rewrite, MUI migration (done), DB schema changes.

---

## File map (target architecture)

```
frontend/src/
├── styles/           # global CSS sections (Phase 1)
├── constants/        # layout tokens (Phase 1)
├── types/            # domain types barrel (Phase 1)
├── features/         # Phase 2+
│   ├── lesson/
│   ├── author/
│   └── wiki/
├── components/       # shared UI (shrinks over time)
└── pages/            # thin route shells

backend/app/api/v1/learn/
├── author/           # Phase 2 split
├── lessons.py
└── ...
```

---

## Approval gates

| Handoff | Artifact | Approver |
|---------|----------|----------|
| Phase 1 → 2 | impl-log Phase 1 + green tests | PO |
| Phase 2 → 3 | plan update + import map | PO |
| Phase 3 → 4 | visual checklist | PO + Reviewer |
