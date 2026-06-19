# impl-log: Learn Authoring Constructor

**????:** Builder Phase 3  
**????:** 2026-06-18  
**??????:** ?????? ? Reviewer Phase 3

---

## ??????????? vs plan.md Phase 3

| # | ?????? plan | ?????? | ????? |
|---|-------------|--------|-------|
| 3.1 | Duplicate lesson API | ? | `author.py`, `authoring_phase3.py`, `authorApi.ts`, `AuthorModulesPage.tsx`, `test_author_phase3.py` |
| 3.2 | Revision snapshots | ? | migration `008`, `lesson_revision.py`, revisions + rollback API, `AuthorRevisionHistoryPanel.tsx` |
| 3.3 | Draft/publish | ? | `lessons.draft_payload`, `publish` endpoint, learner isolation, `?draft=1`, UI badge + �????????????� |
| 3.4 | Capture job | ?? stub | `POST /author/capture-jobs`, `AuthorCaptureWizardModal.tsx` ? CLI instructions |
| 3.5 | Storyboard view | ? | `AuthorStoryboardView.tsx`, toggle ? `AuthorLessonPage.tsx` |
| 3.6 | Duplicate UI | ? | `AuthorModulesPage.tsx` |
| 3.7 | Revision history panel | ? | `AuthorRevisionHistoryPanel.tsx` |
| 3.8 | Draft/publish UI | ? | chips, preview draft link, publish button |
| 3.9 | Capture wizard modal | ?? stub UI | `AuthorCaptureWizardModal.tsx` |

**Skip (?? scope):** per-lesson quiz, AI caption, live demo iframe ? ????????????????? ? `contract.md` �1.3.1.

---

## Backend Phase 3

### ???????? `008_lesson_revisions_drafts`

- `lessons.published_at`, `lessons.draft_payload`, `lessons.has_unpublished_changes`
- ??????? `lesson_revisions` (snapshot_json = export payload)

### ?????? `authoring_phase3.py`

- Working snapshot / draft persist / publish / duplicate / rollback
- Author slide CRUD ? `draft_payload` (?????? ?????? ?????????????? ???????)

### ????? endpoints

| Method | Path |
|--------|------|
| POST | `/author/lessons/{id}/duplicate` |
| GET/POST | `/author/lessons/{id}/revisions` |
| POST | `/author/lessons/{id}/revisions/{rev_id}/rollback` |
| POST | `/author/lessons/{id}/publish` |
| POST | `/author/capture-jobs` (stub) |
| GET | `/lessons/{id}?draft=1` (author) |

---

## Frontend Phase 3

- `AuthorStoryboardView` ? grid thumbnails + caption strip
- `AuthorRevisionHistoryPanel` ? list + ConfirmModal rollback
- `AuthorCaptureWizardModal` ? URL, slide binding, stub job response
- `AuthorLessonPage` ? storyboard toggle, draft badge, publish, revision panel, capture
- `AuthorModulesPage` ? �???????????�
- `getLesson(lessonId, { draft: true })` ??? ?????? ?????????

---

## Deferred / Phase 3.1

- **Capture worker:** async Playwright job, optional `capture_jobs` table
- **AI caption/improve:** ??????? LLM, PO decision
- **Live demo iframe:** CORS + security review
- **Slide templates:** seed JSON ? repo ??? ??

---

## ????? (Builder Phase 3 run)

```
cd backend; pytest -q   ? 53 passed
cd frontend; npm run test -- --run   ? 77 passed (21 files)
```

?????: `test_author_phase3.py`, `AuthorStoryboardView.test.ts`.

---

## Handoff Reviewer Phase 3

?????????:

1. Draft isolation: ?????? ?? ????? ???????? ?? `publish`
2. Rollback ??????????????? ?????????????? ???????
3. Duplicate ???????? slides + image refs
4. Storyboard / revision UI ?? `AuthorLessonPage`
5. Capture stub ?? ??????? async job ? UI ??? backend worker

---

## Integrator Phase 3

**Дата:** 2026-06-18  
**Роль:** Integrator  
**Статус:** **READY** (конвейер Learn Authoring Constructor Phase 3 — **COMPLETE**)

### 1. Миграция БД (revision `008`)

| Пункт | Результат |
|-------|-----------|
| PostgreSQL | `deploy-postgres-1` (порт **5433** → 5432), Up |
| `alembic current` до | `007` |
| `alembic upgrade head` | **Не прошёл чисто:** `DuplicateTable lesson_revisions` — таблица уже создана `Base.metadata.create_all()` в `app/main.py` lifespan при запущенном uvicorn (:8000) |
| Восстановление | Ручной DDL (эквивалент `008`): колонки `lessons.published_at`, `draft_payload`, `has_unpublished_changes`; индекс `ix_lesson_revisions_lesson_created`; затем `alembic stamp 008` |
| `alembic current` после | **`008 (head)`** |

**Рекомендация PO/Dev:** перед `alembic upgrade head` на чистой среде **остановить backend** или не полагаться на `create_all` для новых таблиц (долгосрочно — только Alembic). На fresh DB без запущенного API достаточно `alembic upgrade head`.

### 2. Seed / backward compat

- Уроков в БД: **13**; `has_unpublished_changes` **NULL: 0** (default `false`).
- `draft_payload` заполнен: **0** (существующий контент в published tables).
- Модуль `orientation-v1`: 5 уроков, флаги `has_unpublished_changes=false`, `published_at` пуст — learner flow без изменений до первого author publish.

### 3. `.env.example`

Новых переменных Phase 3 **нет** — файл без изменений.

### 4. Автотесты (Integrator run)

| Suite | Команда | Результат |
|-------|---------|-----------|
| Backend | `cd backend; pytest -q` | **53 passed** |
| Backend Phase 3 | `pytest tests/test_author_phase3.py -q` | **4 passed** (duplicate, revisions, publish/draft, capture stub) |
| Frontend | `cd frontend; npm run test -- --run` | **77 passed** (21 files) |

### 5. Health

- `GET http://localhost:8000/health` → `{"status":"ok"}`

### 6. Smoke checklist

| Сценарий | Авто / ручной | Результат |
|----------|---------------|-----------|
| Duplicate lesson (`AuthorModulesPage`) | API: `test_author_phase3` duplicate | **PASS** (тест) |
| Edit → draft badge → publish → learner published | API: draft isolation + publish в phase3 tests | **PASS** (тест); UI badge/publish — **ручной PO** |
| Revision history + rollback | API: revisions + rollback tests | **PASS** (тест); ConfirmModal — **ручной PO** |
| Storyboard toggle | Unit: `AuthorStoryboardView.test.ts` | **PASS** (helper); toggle UI — **ручной PO** |
| Capture wizard stub (202) | API: capture-jobs test | **PASS** (тест); modal — **ручной PO** |
| Preview draft `?preview=1&draft=1` (author) | Нет e2e | **Не проверено Integrator** (Reviewer W14); ручной PO |
| Regression Phase 1+2 constructor | Полные pytest + vitest | **PASS** |

### 7. Ручные шаги для PO (приёмка UI)

1. Войти как author → `/author/modules` → **Дублировать** урок → открыть копию.
2. Изменить слайд → убедиться в бейдже черновика → **Опубликовать** → learner без `draft=1` видит новое.
3. Панель истории → откат с подтверждением.
4. Переключатель **Раскадровка** на странице урока.
5. Мастер захвата → ответ 202 и текст CLI (stub).
6. Ссылка предпросмотра черновика; ученик не видит черновик.
7. Регрессия: reorder, autosave, чеклист публикации, verify form (Phase 1–2).

### Итог Integrator

- Миграция **008 применена** (stamp + DDL; см. примечание про uvicorn/`create_all`).
- Seed совместим; тесты зелёные; health OK.
- **READY** для PO smoke UI; конвейер **Phase 3 COMPLETE**.
