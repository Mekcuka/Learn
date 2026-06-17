import { describe, expect, it } from "vitest";

import { isLearnStepDoneMessage, parseLearnStepDoneMessage } from "./learnBridge";

describe("learnBridge", () => {
  it("accepts valid learn step message", () => {
    expect(isLearnStepDoneMessage({ type: "learn:step_done", step: "navigation" })).toBe(true);
  });

  it("rejects invalid payloads", () => {
    expect(isLearnStepDoneMessage({ type: "other", step: "x" })).toBe(false);
    expect(isLearnStepDoneMessage(null)).toBe(false);
  });

  it("parses message from allowed origin", () => {
    const event = {
      origin: "http://localhost:5173",
      data: { type: "learn:step_done", step: "create-project" },
    } as MessageEvent;
    expect(parseLearnStepDoneMessage(event)?.step).toBe("create-project");
  });
});
