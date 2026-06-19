import { describe, expect, it } from "vitest";

import { LearnApiError, parseApiError } from "./api/httpClient";

describe("learnApi", () => {
  it("creates LearnApiError with message", () => {
    const error = new LearnApiError(401, "Требуется авторизация", "unauthorized");
    expect(error.message).toBe("Требуется авторизация");
    expect(error.status).toBe(401);
    expect(error.code).toBe("unauthorized");
  });

  it("parses unified flat error format from backend", () => {
    const parsed = parseApiError({
      detail: "unauthorized",
      message: "Требуется авторизация",
      request_id: "abc-123",
    });
    expect(parsed.message).toBe("Требуется авторизация");
    expect(parsed.code).toBe("unauthorized");
  });

  it("parses nested detail.message from backend errors", () => {
    const parsed = parseApiError({
      detail: {
        detail: "invalid_step_transition",
        message: "Сначала выполните предыдущие шаги",
      },
    });
    expect(parsed.message).toBe("Сначала выполните предыдущие шаги");
    expect(parsed.code).toBe("invalid_step_transition");
  });

  it("parses flat invalid_credentials detail", () => {
    const parsed = parseApiError({ detail: "invalid_credentials" });
    expect(parsed.message).toBe("Неверный email или пароль");
    expect(parsed.code).toBe("invalid_credentials");
  });
});
