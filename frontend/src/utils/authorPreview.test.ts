import { describe, expect, it } from "vitest";

import { authorLessonPreviewUrl, draftSaveMessage } from "./authorPreview";

describe("authorLessonPreviewUrl", () => {
  it("defaults to draft preview for authors", () => {
    expect(authorLessonPreviewUrl("lesson-01")).toBe("/lessons/lesson-01?preview=1&draft=1");
  });

  it("can build published learner preview", () => {
    expect(authorLessonPreviewUrl("lesson-01", { draft: false })).toBe("/lessons/lesson-01?preview=1");
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
