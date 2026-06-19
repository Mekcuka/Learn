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

vi.mock("../../../components/ScreenshotGuide", () => ({
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
    expect(slideView?.querySelector(".lesson-actions")).toBeNull();
    expect(container.textContent).not.toContain("Задание");
  });
});

