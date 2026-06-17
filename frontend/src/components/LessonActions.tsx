import type { LessonDetail, LessonStateItem, VerifyResult } from "../api/learnApi";

type LessonActionsProps = {
  lesson: LessonDetail;
  lessonState: LessonStateItem | undefined;
  busy: boolean;
  feedback: VerifyResult | null;
  isPreview?: boolean;
  onOpenDemo: () => void;
  onVerify: () => void;
};

export default function LessonActions({
  lesson,
  lessonState,
  busy,
  feedback,
  isPreview = false,
  onOpenDemo,
  onVerify,
}: LessonActionsProps) {
  const isManual =
    lesson.verify.type === "manual" ||
    (lesson.verify.type === "navigation" &&
      (lesson.verify.config as { fallback?: string }).fallback === "manual");
  const verifyLabel = isManual ? "Я выполнил" : busy ? "Проверка…" : "Проверить выполнение";
  const isCompleted = lessonState?.status === "completed";
  const isLocked = lessonState?.status === "locked";

  return (
    <section className="lesson-actions" aria-live="polite">
      {isCompleted ? (
        <p className="step-status step-status-passed">Урок выполнен</p>
      ) : (
        <>
          {feedback && (
            <p className={`step-status step-status-${feedback.status}`}>
              {feedback.message}
              {feedback.status === "failed" && feedback.hint_lesson_id && (
                <>
                  {" "}
                  <a href={`/lessons/${feedback.hint_lesson_id}`}>Перейти к подсказке</a>
                </>
              )}
            </p>
          )}

          <div className="step-actions">
            {lesson.deep_link && (
              <button type="button" className="secondary" onClick={onOpenDemo} disabled={busy || isLocked}>
                {isPreview ? "Открыть демо (без прогресса)" : "Открыть в демо"}
              </button>
            )}
            <button
              type="button"
              onClick={onVerify}
              disabled={busy || isLocked || isPreview}
              title={isPreview ? "Проверка недоступна в режиме предпросмотра" : undefined}
            >
              {isPreview ? "Проверка недоступна" : verifyLabel}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
