import { describe, expect, it } from "vitest";

import type { LessonSlide } from "../../../types/lesson";
import { isSlideDirty } from "./useAuthorSlideAutosave";

const slide: LessonSlide = {
  id: "slide-1",
  order: 1,
  title: "Слайд",
  caption_html: "<p>a</p>",
  expected_result_html: "",
  image_path: "/content/test.svg",
  hotspots: [],
};

describe("useAuthorSlideAutosave helpers", () => {
  it("detects dirty when caption changes", () => {
    const baseline = JSON.stringify({
      title: slide.title,
      caption_html: slide.caption_html,
      expected_result_html: slide.expected_result_html,
      image_path: slide.image_path,
      hotspots: slide.hotspots,
    });
    expect(isSlideDirty(slide, baseline)).toBe(false);
    expect(isSlideDirty({ ...slide, caption_html: "<p>b</p>" }, baseline)).toBe(true);
  });

  it("treats null baseline as clean", () => {
    expect(isSlideDirty(slide, null)).toBe(false);
  });
});
