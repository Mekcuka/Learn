import { useCallback, useEffect, useRef, useState } from "react";

import type { VerifyResult } from "../api/learnApi";

const DEFAULT_MAX_ATTEMPTS = 24;
const DEFAULT_INTERVAL_MS = 5000;

type UseVerifyPollingOptions = {
  onPassed: () => void;
  onFailed: (result: VerifyResult) => void;
  maxAttempts?: number;
  intervalMs?: number;
};

export function useVerifyPolling(
  verifyFn: () => Promise<VerifyResult>,
  options: UseVerifyPollingOptions,
) {
  const { onPassed, onFailed, maxAttempts = DEFAULT_MAX_ATTEMPTS, intervalMs = DEFAULT_INTERVAL_MS } =
    options;
  const [polling, setPolling] = useState(false);
  const timerRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const runVerify = useCallback(async () => {
    const result = await verifyFn();
    if (result.status === "passed") {
      setPolling(false);
      clearTimer();
      onPassed();
      return;
    }
    if (result.status === "failed") {
      setPolling(false);
      clearTimer();
      onFailed(result);
      return;
    }

    attemptsRef.current += 1;
    if (attemptsRef.current >= maxAttempts) {
      setPolling(false);
      clearTimer();
      onFailed({
        status: "failed",
        message: "Проверка заняла слишком много времени. Попробуйте снова.",
      });
      return;
    }

    const delaySeconds = result.retry_after_seconds ?? intervalMs / 1000;
    const delayMs = Math.max(1000, delaySeconds * 1000);
    setPolling(true);
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      void runVerify();
    }, delayMs);
  }, [clearTimer, intervalMs, maxAttempts, onFailed, onPassed, verifyFn]);

  const startPolling = useCallback(() => {
    attemptsRef.current = 0;
    clearTimer();
    void runVerify();
  }, [clearTimer, runVerify]);

  const stopPolling = useCallback(() => {
    setPolling(false);
    attemptsRef.current = 0;
    clearTimer();
  }, [clearTimer]);

  return { polling, startPolling, stopPolling };
}
