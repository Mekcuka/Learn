/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { clampSlideIndex, moduleProgressLabel, readStoredSlideIndex, resolveNextLessonNavigation, slideStorageKey } from "../utils/lessonUi";

describe("hotspot coordinates", () => {
  it("uses percentage-based layout values", () => {
    const hotspot = {
      x_pct: 85.2,
      y_pct: 12,
      width_pct: 10.5,
      height_pct: 4.2,
    };
    expect(hotspot.x_pct + hotspot.width_pct).toBeLessThanOrEqual(100);
    expect(hotspot.y_pct + hotspot.height_pct).toBeLessThanOrEqual(100);
  });
});

describe("slide navigation", () => {
  it("clamps slide index within bounds", () => {
    const total = 3;
    expect(clampSlideIndex(-1, total)).toBe(0);
    expect(clampSlideIndex(2, total)).toBe(2);
    expect(clampSlideIndex(5, total)).toBe(2);
  });

  it("reads stored slide index from sessionStorage", () => {
    const lessonId = "lesson-test-storage";
    sessionStorage.setItem(slideStorageKey(lessonId), "2");
    expect(readStoredSlideIndex(lessonId)).toBe(2);
    sessionStorage.removeItem(slideStorageKey(lessonId));
    expect(readStoredSlideIndex(lessonId)).toBeNull();
  });
});

describe("resolveNextLessonNavigation", () => {
  const moduleLessons = [
    { id: "lesson-1", order: 1, title: "Урок 1", status: "completed" },
    { id: "lesson-2", order: 2, title: "Урок 2", status: "active" },
    { id: "lesson-3", order: 3, title: "Урок 3", status: "locked" },
    { id: "lesson-4", order: 4, title: "Урок 4", status: "locked" },
  ];

  it("returns null when current lesson is not completed", () => {
    expect(resolveNextLessonNavigation("lesson-1", "active", moduleLessons)).toBeNull();
  });

  it("returns next unlocked lesson in module order", () => {
    expect(resolveNextLessonNavigation("lesson-1", "completed", moduleLessons)).toEqual({
      kind: "lesson",
      lessonId: "lesson-2",
      title: "Урок 2",
    });
  });

  it("skips locked lessons after current", () => {
    const lessons = [
      { id: "lesson-1", order: 1, title: "Урок 1", status: "completed" },
      { id: "lesson-2", order: 2, title: "Урок 2", status: "locked" },
      { id: "lesson-3", order: 3, title: "Урок 3", status: "active" },
    ];
    expect(resolveNextLessonNavigation("lesson-1", "completed", lessons)).toEqual({
      kind: "lesson",
      lessonId: "lesson-3",
      title: "Урок 3",
    });
  });

  it("returns catalog navigation for last completed lesson", () => {
    expect(resolveNextLessonNavigation("lesson-4", "completed", moduleLessons)).toEqual({ kind: "catalog" });
  });
});

describe("moduleProgressLabel", () => {
  it("formats completed lessons count", () => {
    expect(moduleProgressLabel(2, 5)).toBe("2 из 5 уроков");
  });

  it("handles empty module", () => {
    expect(moduleProgressLabel(0, 0)).toBe("Нет уроков");
  });
});
