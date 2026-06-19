# Learn Authoring Constructor — интерактивный конструктор урока

**Статус:** Planner — артефакты готовы, ожидает approval для Builder  
**Проект:** `C:\project\Student`  
**Родительская фича:** [learn-authoring](../learn-authoring/plan.md) (CRUD уже реализован)

## Назначение

Эволюция редактора `/author/lessons/{id}` из вертикальной формы в **интерактивный конструктор** с трёхколоночным layout, WYSIWYG-превью как у ученика, типизированными формами verify/deep link и улучшенным HotspotEditor.

## Артефакты

| Файл | Содержание |
|------|------------|
| [plan.md](plan.md) | Фазы Builder 1–3, scope, критерии приёмки, out-of-scope |
| [contract.md](contract.md) | API (Phase 1 reorder), frontend component contracts, VerifyConfigForm schemas |
| [data-model.md](data-model.md) | Изменения БД (Phase 1 — нет; Phase 3 — revisions, draft) |
| [integration-map.md](integration-map.md) | Demo bridge tester, capture script, preview flow |

## Связанные документы

- [content-authoring.md](../learn/content-authoring.md) — текущий редактор методиста
- [learn-authoring/contract.md](../learn-authoring/contract.md) — базовый Author API
- [learn/contract.md](../learn/contract.md) §2 — verify types
- [demo-bridge.md](../learn/demo-bridge.md) — postMessage `learn:step_done`

## Конвейер

```
Planner (этот пакет) → Builder Phase 1 → Reviewer → Integrator
                    → Builder Phase 2 → Reviewer → Integrator
                    → Builder Phase 3 (опционально, по approval PO)
```
