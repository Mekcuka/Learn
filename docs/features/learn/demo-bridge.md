# Demo bridge (postMessage)

Контракт связи между **демо-приложением** и **Learn Portal** для автоматической проверки шагов навигации.

## Сообщение от демо → Learn

```json
{
  "type": "learn:step_done",
  "step": "navigation",
  "projectId": "optional-uuid"
}
```

| Поле | Описание |
|------|----------|
| `type` | Всегда `learn:step_done` |
| `step` | Идентификатор шага из `verify.config.learn_step` или query `?learn_step=` |
| `projectId` | Опционально — id проекта ученика |

## Отправка из демо (пример)

```javascript
window.opener?.postMessage(
  { type: "learn:step_done", step: "navigation", projectId: projectId },
  "http://localhost:5173"
);
```

## Приём в Learn

Реализовано в [`frontend/src/utils/learnBridge.ts`](../../frontend/src/utils/learnBridge.ts) и [`LessonPage.tsx`](../../frontend/src/pages/LessonPage.tsx):

- Разрешённые origin: `VITE_DEMO_ORIGIN` или `*.spark.modeltech.ru`, `localhost`
- При совпадении `step` с `lesson.verify.config.learn_step` вызывается `POST /lessons/{id}/verify`

## Deep link

```
https://97.60.spark.modeltech.ru/projects/{project_id}?learn_step=navigation
```

Seed урока «Навигация»: `learn_step: navigation` в `verify_config`.

## Tour hooks (демо-команда)

Рекомендуется на стороне демо:

1. Прочитать `learn_step` из URL
2. Запустить guided tour (Driver.js / Shepherd.js) по `data-testid`
3. По завершении тура — `postMessage` с `learn:step_done`

Fallback MVP: кнопка «Я выполнил» (`navigation` + `fallback: manual`).
