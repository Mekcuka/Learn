# Review report — Self-study

**Дата:** 2026-06-18  
**Reviewer:** AI Reviewer  
**Scope:** `/self-study` assignments + step verify  
**Verdict:** GREEN

## Summary

Самостоятельная работа реализована по `contract.md`: список заданий с прогрессом, детальный сценарий, start/verify/complete-manual на шагах. Verify переиспользует Learn engine (`manual`, legacy types → manual fallback). Seed `self-study-test-v1` (7–8 шагов). Тесты `test_self_study.py` в CI PostgreSQL critical suite.

## Test results

| Suite | Команда | Result |
|-------|---------|--------|
| Backend | `pytest tests/test_self_study.py -q` | **3 passed** |
| Frontend | `selfStudyUi`, pages | unit coverage |
| E2E | `e2e/lesson-smoke.spec.ts` | self-study не в smoke |

## Contract checklist

| Contract item | Status | Notes |
|---------------|--------|-------|
| `GET /self-study/assignments` | ✅ | `items[]` с progress_percent, counts |
| `GET /self-study/assignments/{id}` | ✅ | steps, step_states, current_step_id |
| `POST .../steps/{id}/start` | ✅ | `started_at`, activate step |
| `POST .../steps/{id}/verify` | ✅ | manual / quiz; legacy → manual |
| `POST .../steps/{id}/complete-manual` | ✅ | |
| Блокировка locked шагов | ✅ | 400 `invalid_step_transition` |
| Unlock next после verify | ✅ | |
| Таблицы self_study_* | ✅ | Миграция `007_self_study` |
| `/self-study`, `/self-study/:id` | ✅ | `SelfStudyPage`, `SelfStudyAssignmentPage` |
| Главная → карточка self-study | ✅ | |
| Ошибки 400/404 | ✅ | |
| Batch N+1 fix (list counts) | ✅ | impl-log sprint |

## Acceptance (plan.md)

| Критерий | Status |
|----------|--------|
| Seed `self-study-test-v1` | ✅ |
| Отдельный прогресс от module lessons | ✅ |
| Deep links + instruction_html | ✅ |
| PPTX → seed контент | ✅ `extract_pptx.py` |

## Known gaps / deferred

| ID | Severity | Description |
|----|----------|-------------|
| S1 | major (deferred) | Author CRUD self-study — только seed (`contract.md` §6) |
| S2 | minor | Legacy verify types в seed (`resource_exists`) → manual fallback; Demo API не вызывается |
| S3 | minor | Self-study не в Playwright smoke |
| S4 | minor | `useVerifyPolling` упрощён; polling Demo API не используется в MVP |
| S5 | info | WebP для скринов self-study — TODO |

## Recommendation

**GREEN** для MVP (read-only контент через seed). Author UI для self-study — отдельная фича. Рекомендуется E2E smoke `/self-study` после стабилизации lesson smoke в CI.
