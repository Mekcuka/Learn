import { useCallback, useRef, useState } from "react";

import type { VerifyResult } from "../../types/lesson";

type UseVerifyPollingOptions = {
  onPassed: () => void;
  onFailed: (result: VerifyResult) => void;
  /** @deprecated MVP verify returns passed/failed immediately; polling is not used */
  maxAttempts?: number;
  /** @deprecated MVP verify returns passed/failed immediately; polling is not used */
  intervalMs?: number;
};

export function useVerifyPolling(
  verifyFn: () => Promise<VerifyResult>,
  options: UseVerifyPollingOptions,
) {
  const { onPassed, onFailed } = options;
  const [polling, setPolling] = useState(false);
  const onPassedRef = useRef(onPassed);
  const onFailedRef = useRef(onFailed);

  onPassedRef.current = onPassed;
  onFailedRef.current = onFailed;

  const stopPolling = useCallback(() => {
    setPolling(false);
  }, []);

  const startPolling = useCallback(async () => {
    setPolling(true);
    try {
      const result = await verifyFn();
      if (result.status === "passed") {
        onPassedRef.current();
        return;
      }
      onFailedRef.current(result);
    } catch {
      onFailedRef.current({
        status: "failed",
        message: "Не удалось выполнить проверку. Попробуйте снова.",
      });
    } finally {
      setPolling(false);
    }
  }, [verifyFn]);

  return { polling, startPolling, stopPolling };
}
