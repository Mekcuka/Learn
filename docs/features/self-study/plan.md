# Self-study — самостоятельная работа

Краткий план фичи **Самостоятельная работа**: отдельный поток заданий с пошаговой проверкой в демо, без привязки к модулю orientation.

**Статус:** реализовано (2026-06-18)  
**Миграция:** `007_self_study`  
**Полный контракт:** [contract.md](contract.md)

---

## Назначение

- Ученик выбирает задание на `/self-study` (третий блок на главной `/`).
- Задание состоит из шагов с `instruction_html`, deep link и verify (те же типы, что в уроках).
- Прогресс хранится отдельно от `user_progress` / уроков модуля.
- Контент первого задания (`self-study-test-v1`) сгенерирован из PPTX (скрипт `backend/scripts/extract_pptx.py`).

---

## Scope (реализовано)

| Область | Описание |
|---------|----------|
| Backend | `self_study_assignments`, `self_study_steps`, `self_study_progress`, `self_study_step_states` |
| API | `GET /self-study/assignments`, detail, start/verify/complete-manual per step |
| Verify | `run_self_study_verify` — reuse verify engine (`manual`, `resource_exists`, …) |
| Seed | `SELF_STUDY_ASSIGNMENT` + `SELF_STUDY_STEPS` в `data.py` |
| Frontend | `SelfStudyPage`, `SelfStudyAssignmentPage` |

---

## Seed: тестовое задание

| Поле | Значение |
|------|----------|
| `id` | `self-study-test-v1` |
| `title` | Тестовое задание: модель энергосистемы |
| Шаги | 8 шагов: создание проекта, импорт ВВП, сеть, генерация, CAPEX/OPEX и др. |

Источник инструкций: PPTX → `backend/pptx_extract.txt` → seed.

---

## Вне scope (MVP)

- Author UI для self-study (только seed / будущий admin)
- Отдельный квиз в self-study
- Production hosting

---

## Связанные документы

- [contract.md](contract.md) — API endpoints
- [../learn/contract.md](../learn/contract.md) §2 — verify types (reuse)
- [../learn/impl-log.md](../learn/impl-log.md) — changelog 2026-06-18
