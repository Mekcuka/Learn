/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthorLessonDetail } from "../../../api/authorApi";
import type { LessonDetail } from "../../../types/lesson";
import AppTheme from "../../../components/mui/AppTheme";
import LessonSlideView from "./LessonSlideView";

vi.mock("./ScreenshotGuide", () => ({
  default: () => <div data-testid="screenshot-guide" />,
}));

const authorLesson: AuthorLessonDetail = {
  id: "lesson-01",
  module_id: "orientation-v1",
  module_title: "Ориентация",
  order: 1,
  title: "Вход",
  summary: null,
  tags: [],
  instruction_html: "",
  deep_link_template: null,
  verify: { type: "manual", config: {} },
  is_optional: false,
  slides: [
    {
      id: "s1",
      order: 1,
      title: "Слайд",
      caption_html: "<p>Подпись</p>",
      expected_result_html: "",
      image_path: "/content/placeholder-slide.svg",
      hotspots: [],
    },
  ],
};

const studentLesson: LessonDetail = {
  ...authorLesson,
  deep_link: "https://demo.example/projects",
  progress_percent: 0,
  project_id: null,
  lesson_states: [{ lesson_id: "lesson-01", status: "active", completed_at: null, verify_result: null }],
  module_lessons: [{ id: "lesson-01", order: 1, title: "Вход", status: "active" }],
  quiz: null,
  instruction_html: "<p>Создайте проект в демо</p>",
  slides: [
    {
      ...authorLesson.slides[0],
      expected_result_html: "<p>Проект появился в списке</p>",
    },
  ],
};

describe("LessonSlideView", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders author mode banner and carousel", () => {
    act(() => {
      root.render(
        <AppTheme>
          <LessonSlideView
            mode="author"
            lesson={authorLesson}
            slideIndex={0}
            onSlideIndexChange={() => undefined}
          />
        </AppTheme>,
      );
    });

    expect(container.textContent).toContain("Режим конструктора");
    expect(container.querySelector(".slide-carousel")).not.toBeNull();
    expect(container.querySelector(".slide-carousel-header")).toBeNull();
    expect(container.querySelector(".slide-context-strip")).toBeNull();
  });

  it("renders carousel only in student mode (assignment lives in reference panel)", () => {
    act(() => {
      root.render(
        <AppTheme>
          <LessonSlideView
            mode="student"
            lesson={studentLesson}
            slideIndex={0}
            onSlideIndexChange={() => undefined}
          />
        </AppTheme>,
      );
    });

    const slideView = container.querySelector(".lesson-slide-view");
    const carousel = slideView?.querySelector(".slide-carousel");
    expect(carousel).not.toBeNull();
    expect(carousel?.querySelector(".slide-carousel-header")).not.toBeNull();
    expect(carousel?.querySelector(".slide-context-strip")).not.toBeNull();
    expect(slideView?.querySelector(".lesson-actions")).toBeNull();
    expect(container.textContent).not.toContain("Задание");
  });

  it("shows slides before quiz for mixed quiz_passed lessons", () => {
    const mixedLesson: LessonDetail = {
      ...studentLesson,
      verify: { type: "quiz_passed", config: { pass_threshold_percent: 80 } },
      quiz: {
        module_id: "orientation-v1",
        pass_threshold_percent: 80,
        questions: [
          {
            id: "q1",
            order: 1,
            prompt_html: "<p>Вопрос?</p>",
            options: [{ id: "o1", text: "Да" }],
            allow_multiple: false,
          },
        ],
      },
    };

    act(() => {
      root.render(
        <AppTheme>
          <LessonSlideView
            mode="student"
            lesson={mixedLesson}
            slideIndex={0}
            onSlideIndexChange={() => undefined}
          />
        </AppTheme>,
      );
    });

    expect(container.querySelector(".slide-carousel")).not.toBeNull();
    expect(container.querySelector(".quiz-panel")).toBeNull();
  });

  it("shows quiz step after slides in mixed quiz_passed lessons", () => {
    const mixedLesson: LessonDetail = {
      ...studentLesson,
      verify: { type: "quiz_passed", config: { pass_threshold_percent: 80 } },
      quiz: {
        module_id: "orientation-v1",
        pass_threshold_percent: 80,
        questions: [
          {
            id: "q1",
            order: 1,
            prompt_html: "<p>Вопрос?</p>",
            options: [{ id: "o1", text: "Да" }],
            allow_multiple: false,
          },
        ],
      },
    };

    act(() => {
      root.render(
        <AppTheme>
          <LessonSlideView
            mode="student"
            lesson={mixedLesson}
            slideIndex={mixedLesson.slides.length}
            onSlideIndexChange={() => undefined}
          />
        </AppTheme>,
      );
    });

    expect(container.querySelector(".quiz-panel")).not.toBeNull();
    expect(container.querySelector(".slide-carousel")).not.toBeNull();
    expect(container.querySelector("nav.slide-nav")).not.toBeNull();
    expect(container.textContent).toContain("Назад");
    expect(container.querySelector(".slide-dot--quiz.active")).not.toBeNull();
  });

  it("navigates back from quiz step via Назад in slide-nav", () => {
    const mixedLesson: LessonDetail = {
      ...studentLesson,
      verify: { type: "quiz_passed", config: { pass_threshold_percent: 80 } },
      quiz: {
        module_id: "orientation-v1",
        pass_threshold_percent: 80,
        questions: [
          {
            id: "q1",
            order: 1,
            prompt_html: "<p>Вопрос?</p>",
            options: [{ id: "o1", text: "Да" }],
            allow_multiple: false,
          },
        ],
      },
    };
    const onSlideIndexChange = vi.fn();

    act(() => {
      root.render(
        <AppTheme>
          <LessonSlideView
            mode="student"
            lesson={mixedLesson}
            slideIndex={mixedLesson.slides.length}
            onSlideIndexChange={onSlideIndexChange}
          />
        </AppTheme>,
      );
    });

    const backButton = container.querySelector(
      'button[aria-label="Предыдущий слайд"]',
    ) as HTMLButtonElement | null;
    expect(backButton).not.toBeNull();
    expect(backButton?.disabled).toBe(false);

    act(() => {
      backButton?.click();
    });

    expect(onSlideIndexChange).toHaveBeenCalledWith(mixedLesson.slides.length - 1);
  });

  it("shows manual verify in slide-nav on last slide in student mode", () => {
    const onVerify = vi.fn();
    const multiSlideLesson: LessonDetail = {
      ...studentLesson,
      slides: [
        studentLesson.slides[0],
        { ...studentLesson.slides[0], id: "s2", order: 2, title: "Слайд 2" },
      ],
    };

    act(() => {
      root.render(
        <AppTheme>
          <LessonSlideView
            mode="student"
            lesson={multiSlideLesson}
            slideIndex={0}
            onSlideIndexChange={() => undefined}
            manualVerify={{ onVerify }}
          />
        </AppTheme>,
      );
    });

    expect(container.querySelector(".slide-nav-verify-btn")).toBeNull();

    act(() => {
      root.render(
        <AppTheme>
          <LessonSlideView
            mode="student"
            lesson={multiSlideLesson}
            slideIndex={1}
            onSlideIndexChange={() => undefined}
            manualVerify={{ onVerify }}
          />
        </AppTheme>,
      );
    });

    expect(container.querySelector(".slide-nav-verify-btn")).not.toBeNull();
    expect(container.textContent).toContain("Выполнено");
  });

  it("does not show manual verify in author or preview mode", () => {
    const manualVerify = { onVerify: vi.fn() };

    act(() => {
      root.render(
        <AppTheme>
          <LessonSlideView
            mode="author"
            lesson={authorLesson}
            slideIndex={0}
            onSlideIndexChange={() => undefined}
            manualVerify={manualVerify}
          />
        </AppTheme>,
      );
    });

    expect(container.querySelector(".slide-nav-verify-btn")).toBeNull();

    act(() => {
      root.render(
        <AppTheme>
          <LessonSlideView
            mode="preview"
            lesson={studentLesson}
            slideIndex={0}
            onSlideIndexChange={() => undefined}
            manualVerify={manualVerify}
          />
        </AppTheme>,
      );
    });

    expect(container.querySelector(".slide-nav-verify-btn")).toBeNull();
  });
});

