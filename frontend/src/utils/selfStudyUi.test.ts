import { describe, expect, it } from "vitest";

import {
  selfStudyProgressLabel,
  selfStudyStatusLabel,
  selfStudyStepStatusLabel,
} from "./selfStudyUi";

describe("selfStudyUi", () => {
  it("formats progress label", () => {
    expect(selfStudyProgressLabel(2, 7)).toBe("2 из 7 шагов");
  });

  it("maps assignment status", () => {
    expect(selfStudyStatusLabel("not_started")).toBe("Не начато");
    expect(selfStudyStatusLabel("in_progress")).toBe("В процессе");
    expect(selfStudyStatusLabel("completed")).toBe("Выполнено");
  });

  it("maps step status", () => {
    expect(selfStudyStepStatusLabel("locked")).toBe("Не начат");
    expect(selfStudyStepStatusLabel("active")).toBe("В процессе");
    expect(selfStudyStepStatusLabel("completed")).toBe("Выполнен");
  });
});
