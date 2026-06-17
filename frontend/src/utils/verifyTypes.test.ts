import { describe, expect, it } from "vitest";

import { VERIFY_TYPE_LABELS, verifyTypeLabel } from "./verifyTypes";

describe("verifyTypeLabel", () => {
  it("returns Russian labels for known types", () => {
    expect(verifyTypeLabel("manual")).toBe(VERIFY_TYPE_LABELS.manual);
    expect(verifyTypeLabel("quiz_passed")).toBe("Мини-квиз");
  });

  it("falls back to raw type for unknown values", () => {
    expect(verifyTypeLabel("custom_type")).toBe("custom_type");
  });
});
