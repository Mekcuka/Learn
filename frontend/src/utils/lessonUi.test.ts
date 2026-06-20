/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import {
  clampLessonSlideIndex,
  clampSlideIndex,
  isMixedQuizLesson,
  isOnFinalLessonStep,
  isQuizOnlyLesson,
  maxLessonSlideIndex,
  moduleProgressLabel,
  patchLessonCompleted,
  readStoredSlideIndex,
  resolveCompleteLessonAction,
  resolveNextLessonNavigation,
  sanitizeStoredSlideIndex,
  shouldShowCompleteLessonButton,
  slideStorageKey,
} from "../utils/lessonUi";

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

const mixedLesson = {
  verify: { type: "quiz_passed" as const },
  slides: [{ id: "s1" }, { id: "s2" }],
};

const quizOnlyLesson = {
  verify: { type: "quiz_passed" as const },
  slides: [] as { id: string }[],
};

describe("mixed quiz lessons", () => {
  it("detects mixed and quiz-only lessons", () => {
    expect(isMixedQuizLesson(mixedLesson)).toBe(true);
    expect(isQuizOnlyLesson(mixedLesson)).toBe(false);
    expect(isMixedQuizLesson(quizOnlyLesson)).toBe(false);
    expect(isQuizOnlyLesson(quizOnlyLesson)).toBe(true);
  });

  it("allows virtual quiz step index for mixed lessons with loaded quiz", () => {
    const mixedWithQuiz = {
      ...mixedLesson,
      quiz: { questions: [{ id: "q1" }] },
    };
    expect(maxLessonSlideIndex(mixedWithQuiz)).toBe(2);
    expect(clampLessonSlideIndex(5, mixedWithQuiz)).toBe(2);
    expect(clampLessonSlideIndex(1, mixedWithQuiz)).toBe(1);
  });

  it("keeps navigation on last slide when mixed lesson quiz is not loaded yet", () => {
    expect(maxLessonSlideIndex(mixedLesson)).toBe(1);
    expect(clampLessonSlideIndex(2, mixedLesson)).toBe(1);
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

  it("sanitizes out-of-bounds stored index for mixed lessons", () => {
    const lessonId = "lesson-test-sanitize";
    const mixedWithQuiz = { ...mixedLesson, quiz: { questions: [{ id: "q1" }] } };
    sessionStorage.setItem(slideStorageKey(lessonId), "99");
    expect(sanitizeStoredSlideIndex(lessonId, mixedWithQuiz)).toBe(2);
    expect(sessionStorage.getItem(slideStorageKey(lessonId))).toBe("2");
    sessionStorage.removeItem(slideStorageKey(lessonId));
  });

  it("resets quiz step to first slide for not_started mixed lessons", () => {
    const lessonId = "lesson-test-reset";
    sessionStorage.setItem(slideStorageKey(lessonId), "2");
    expect(
      sanitizeStoredSlideIndex(lessonId, mixedLesson, undefined, {
        resetQuizStepForNotStarted: true,
        lessonStatus: "not_started",
      }),
    ).toBe(0);
    expect(sessionStorage.getItem(slideStorageKey(lessonId))).toBe("0");
    sessionStorage.removeItem(slideStorageKey(lessonId));
  });

  it("resets quiz step to first slide for active mixed lessons", () => {
    const lessonId = "lesson-test-reset-active";
    sessionStorage.setItem(slideStorageKey(lessonId), "2");
    expect(
      sanitizeStoredSlideIndex(lessonId, mixedLesson, undefined, {
        resetQuizStepForNotStarted: true,
        lessonStatus: "active",
      }),
    ).toBe(0);
    expect(sessionStorage.getItem(slideStorageKey(lessonId))).toBe("0");
    sessionStorage.removeItem(slideStorageKey(lessonId));
  });

  it("keeps quiz step for completed mixed lessons", () => {
    const lessonId = "lesson-test-reset-completed";
    const mixedWithQuiz = { ...mixedLesson, quiz: { questions: [{ id: "q1" }] } };
    sessionStorage.setItem(slideStorageKey(lessonId), "2");
    expect(
      sanitizeStoredSlideIndex(lessonId, mixedWithQuiz, undefined, {
        resetQuizStepForNotStarted: true,
        lessonStatus: "completed",
      }),
    ).toBe(2);
    sessionStorage.removeItem(slideStorageKey(lessonId));
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

describe("shouldShowCompleteLessonButton", () => {
  const manualMultiSlide = {
    verify: { type: "manual" as const },
    slides: [{ id: "s1" }, { id: "s2" }],
  };

  const mixedWithQuiz = {
    verify: { type: "quiz_passed" as const },
    slides: [{ id: "s1" }, { id: "s2" }],
    quiz: { questions: [{ id: "q1" }] },
  };

  it("shows on last slide for active manual lessons", () => {
    expect(
      shouldShowCompleteLessonButton({
        lesson: manualMultiSlide,
        slideIndex: 0,
        lessonStatus: "active",
        isPreview: false,
        isOnQuizStep: false,
      }),
    ).toBe(false);
    expect(
      shouldShowCompleteLessonButton({
        lesson: manualMultiSlide,
        slideIndex: 1,
        lessonStatus: "active",
        isPreview: false,
        isOnQuizStep: false,
      }),
    ).toBe(true);
  });

  it("hides for completed, locked, and preview modes", () => {
    const base = {
      lesson: manualMultiSlide,
      slideIndex: 1,
      isOnQuizStep: false,
    };
    expect(shouldShowCompleteLessonButton({ ...base, lessonStatus: "completed", isPreview: false })).toBe(
      false,
    );
    expect(shouldShowCompleteLessonButton({ ...base, lessonStatus: "locked", isPreview: false })).toBe(
      false,
    );
    expect(shouldShowCompleteLessonButton({ ...base, lessonStatus: "active", isPreview: true })).toBe(
      false,
    );
  });

  it("shows on last content slide and quiz step for mixed quiz lessons", () => {
    expect(
      shouldShowCompleteLessonButton({
        lesson: mixedWithQuiz,
        slideIndex: 0,
        lessonStatus: "active",
        isPreview: false,
        isOnQuizStep: false,
      }),
    ).toBe(false);
    expect(
      shouldShowCompleteLessonButton({
        lesson: mixedWithQuiz,
        slideIndex: 1,
        lessonStatus: "active",
        isPreview: false,
        isOnQuizStep: false,
      }),
    ).toBe(true);
    expect(
      shouldShowCompleteLessonButton({
        lesson: mixedWithQuiz,
        slideIndex: 2,
        lessonStatus: "active",
        isPreview: false,
        isOnQuizStep: true,
      }),
    ).toBe(true);
  });

  it("shows for quiz-only lessons when quiz is loaded", () => {
    const quizOnly = {
      verify: { type: "quiz_passed" as const },
      slides: [],
      quiz: { questions: [{ id: "q1" }] },
    };

    expect(
      shouldShowCompleteLessonButton({
        lesson: quizOnly,
        slideIndex: 0,
        lessonStatus: "active",
        isPreview: false,
        isOnQuizStep: false,
      }),
    ).toBe(true);
  });

  it("shows complete button on quiz step after quiz passed even when lesson status is completed", () => {
    expect(
      shouldShowCompleteLessonButton({
        lesson: mixedWithQuiz,
        slideIndex: 2,
        lessonStatus: "completed",
        isPreview: false,
        isOnQuizStep: true,
        quizPassed: true,
      }),
    ).toBe(true);
    expect(
      shouldShowCompleteLessonButton({
        lesson: mixedWithQuiz,
        slideIndex: 2,
        lessonStatus: "completed",
        isPreview: false,
        isOnQuizStep: true,
        quizPassed: false,
      }),
    ).toBe(false);
  });
});

describe("isOnFinalLessonStep", () => {
  const mixedWithQuiz = {
    verify: { type: "quiz_passed" as const },
    slides: [{ id: "s1" }, { id: "s2" }],
    quiz: { questions: [{ id: "q1" }] },
  };

  it("treats quiz-only lessons as always on final step when quiz loaded", () => {
    expect(
      isOnFinalLessonStep(
        { verify: { type: "quiz_passed" }, slides: [], quiz: { questions: [{ id: "q1" }] } },
        0,
        false,
      ),
    ).toBe(true);
  });

  it("treats mixed lesson last slide and quiz step as final", () => {
    expect(isOnFinalLessonStep(mixedWithQuiz, 1, false)).toBe(true);
    expect(isOnFinalLessonStep(mixedWithQuiz, 2, true)).toBe(true);
    expect(isOnFinalLessonStep(mixedWithQuiz, 0, false)).toBe(false);
  });
});

describe("resolveCompleteLessonAction", () => {
  const manualMultiSlide = {
    verify: { type: "manual" as const },
    slides: [{ id: "s1" }, { id: "s2" }],
  };

  const mixedWithQuiz = {
    verify: { type: "quiz_passed" as const },
    slides: [{ id: "s1" }, { id: "s2" }],
    quiz: { questions: [{ id: "q1" }] },
  };

  const quizOnly = {
    verify: { type: "quiz_passed" as const },
    slides: [],
    quiz: { questions: [{ id: "q1" }] },
  };

  it("verifies manual lessons on the final step", () => {
    expect(
      resolveCompleteLessonAction({
        lesson: manualMultiSlide,
        slideIndex: 1,
        isOnQuizStep: false,
        lessonStatus: "active",
        quizPassed: false,
      }),
    ).toEqual({ type: "verify" });
  });

  it("routes mixed lessons from last slide to quiz with guidance", () => {
    expect(
      resolveCompleteLessonAction({
        lesson: mixedWithQuiz,
        slideIndex: 1,
        isOnQuizStep: false,
        lessonStatus: "active",
        quizPassed: false,
      }),
    ).toEqual({
      type: "goToQuiz",
      message: "Перед завершением ответьте на вопросы квиза.",
    });
  });

  it("requires quiz submission before completing quiz-based lessons", () => {
    expect(
      resolveCompleteLessonAction({
        lesson: mixedWithQuiz,
        slideIndex: 2,
        isOnQuizStep: true,
        lessonStatus: "active",
        quizPassed: false,
      }),
    ).toEqual({
      type: "requireQuiz",
      message: "Сначала отправьте ответы на квиз.",
    });

    expect(
      resolveCompleteLessonAction({
        lesson: quizOnly,
        slideIndex: 0,
        isOnQuizStep: false,
        lessonStatus: "active",
        quizPassed: false,
      }),
    ).toEqual({
      type: "requireQuiz",
      message: "Сначала отправьте ответы на квиз.",
    });
  });

  it("reloads quiz-based lessons after quiz is passed instead of calling verify", () => {
    expect(
      resolveCompleteLessonAction({
        lesson: mixedWithQuiz,
        slideIndex: 2,
        isOnQuizStep: true,
        lessonStatus: "active",
        quizPassed: true,
      }),
    ).toEqual({ type: "reload" });

    expect(
      resolveCompleteLessonAction({
        lesson: mixedWithQuiz,
        slideIndex: 2,
        isOnQuizStep: true,
        lessonStatus: "completed",
        quizPassed: true,
      }),
    ).toEqual({ type: "reload" });
  });

  it("does nothing when the lesson is already completed", () => {
    expect(
      resolveCompleteLessonAction({
        lesson: manualMultiSlide,
        slideIndex: 1,
        isOnQuizStep: false,
        lessonStatus: "completed",
        quizPassed: false,
      }),
    ).toEqual({ type: "noop" });
  });
});

describe("patchLessonCompleted", () => {
  it("marks current lesson as completed in local lesson detail", () => {
    const lesson = {
      lesson_states: [
        { lesson_id: "lesson-01", status: "active", completed_at: null },
        { lesson_id: "lesson-02", status: "locked", completed_at: null },
      ],
      module_lessons: [
        { id: "lesson-01", status: "active" },
        { id: "lesson-02", status: "locked" },
      ],
    };

    const patched = patchLessonCompleted(lesson, "lesson-01", "2026-06-20T10:00:00.000Z");

    expect(patched.lesson_states[0]).toMatchObject({
      lesson_id: "lesson-01",
      status: "completed",
      completed_at: "2026-06-20T10:00:00.000Z",
    });
    expect(patched.module_lessons[0]).toMatchObject({ id: "lesson-01", status: "completed" });
    expect(patched.lesson_states[1]?.status).toBe("locked");
  });
});
