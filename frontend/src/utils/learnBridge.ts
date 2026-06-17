/** Bridge between Learn Portal and Demo App (postMessage). */

export const LEARN_MESSAGE_TYPE = "learn:step_done" as const;

export type LearnStepDoneMessage = {
  type: typeof LEARN_MESSAGE_TYPE;
  step: string;
  projectId?: string;
};

export function isLearnStepDoneMessage(data: unknown): data is LearnStepDoneMessage {
  if (!data || typeof data !== "object") {
    return false;
  }
  const payload = data as Record<string, unknown>;
  return payload.type === LEARN_MESSAGE_TYPE && typeof payload.step === "string";
}

export function parseLearnStepDoneMessage(event: MessageEvent): LearnStepDoneMessage | null {
  const portalOrigin = typeof window !== "undefined" ? window.location.origin : null;
  const originAllowed =
    (portalOrigin && event.origin === portalOrigin) || isAllowedDemoOrigin(event.origin);
  if (!originAllowed) {
    return null;
  }
  if (!isLearnStepDoneMessage(event.data)) {
    return null;
  }
  return event.data;
}

function isAllowedDemoOrigin(origin: string): boolean {
  const allowed = import.meta.env.VITE_DEMO_ORIGIN;
  if (allowed) {
    return origin === allowed;
  }
  return origin.includes("spark.modeltech.ru") || origin.includes("localhost");
}

export function listenForLearnStepDone(
  handler: (message: LearnStepDoneMessage) => void,
): () => void {
  const listener = (event: MessageEvent) => {
    const message = parseLearnStepDoneMessage(event);
    if (message) {
      handler(message);
    }
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
