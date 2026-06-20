import { describe, expect, it } from "vitest";

import { authorLessonPreviewUrl, draftSaveMessage } from "./authorPreview";

describe("authorLessonPreviewUrl", () => {
  it("builds published learner preview", () => {
    expect(authorLessonPreviewUrl("lesson-01")).toBe("/lessons/lesson-01?preview=1");
  });
});

describe("draftSaveMessage", () => {
  it("adds publish hint when draft exists", () => {
    expect(draftSaveMessage("Слайд сохранён", true)).toContain("Опубликуйте");
  });

  it("keeps short message when already published", () => {
    expect(draftSaveMessage("Слайд сохранён", false)).toBe("Слайд сохранён");
  });
});
