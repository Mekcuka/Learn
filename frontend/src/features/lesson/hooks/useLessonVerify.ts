import { useCallback, useState } from "react";

import { verifyLesson } from "../../../api/learnApi";
import { useVerifyPolling } from "../../../hooks/useVerifyPolling";
import type { VerifyResult } from "../../../types/lesson";

type UseLessonVerifyOptions = {
  lessonId: string | undefined;
  isPreview: boolean;
  onLessonReload: () => Promise<void>;
};

export function useLessonVerify({ lessonId, isPreview, onLessonReload }: UseLessonVerifyOptions) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<VerifyResult | null>(null);

  const verifyFn = useCallback(async () => {
    if (!lessonId) {
      throw new Error("Урок не найден");
    }
    return verifyLesson(lessonId);
  }, [lessonId]);

  const handleVerifyPassed = useCallback(async () => {
    await onLessonReload();
    setFeedback(null);
    setBusy(false);
  }, [onLessonReload]);

  const handleVerifyFailed = useCallback((result: VerifyResult) => {
    setFeedback(result);
    setBusy(false);
  }, []);

  const { polling, startPolling, stopPolling } = useVerifyPolling(verifyFn, {
    onPassed: handleVerifyPassed,
    onFailed: handleVerifyFailed,
  });

  const startVerify = useCallback(async () => {
    if (!lessonId || isPreview) {
      return;
    }

    setBusy(true);
    setFeedback(null);
    stopPolling();

    try {
      const result = await verifyLesson(lessonId);
      setFeedback(result);

      if (result.status === "passed") {
        await onLessonReload();
        setFeedback(null);
        setBusy(false);
        return;
      }

      if (result.status === "pending" && result.retry_after_seconds != null) {
        startPolling();
        return;
      }

      setBusy(false);
    } catch (err) {
      setFeedback({
        status: "failed",
        message: err instanceof Error ? err.message : "Не удалось проверить урок",
      });
      setBusy(false);
    }
  }, [isPreview, lessonId, onLessonReload, startPolling, stopPolling]);

  const completeManual = useCallback(() => {
    void startVerify();
  }, [startVerify]);

  const verifyBusy = busy || polling;
  const isVerifying = verifyBusy;

  return {
    feedback,
    verifyBusy,
    isVerifying,
    polling,
    startVerify,
    completeManual,
    setFeedback,
    setBusy,
    stopPolling,
  };
}
