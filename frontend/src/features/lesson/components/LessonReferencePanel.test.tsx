/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { LessonDetail } from "../../../types/lesson";
import AppTheme from "../../../components/mui/AppTheme";
import LessonReferencePanel from "./LessonReferencePanel";

const baseLesson: LessonDetail = {
  id: "lesson-01",
  module_id: "orientation-v1",
  module_title: "Ориентация",
  order: 1,
  title: "Вход",
  summary: null,
  tags: [],
  instruction_html: "<p>Создайте проект в демо</p>",
  deep_link: "https://demo.example/projects",
  verify: { type: "manual", config: {} },
  progress_percent: 0,
  project_id: null,
  lesson_states: [],
  module_lessons: [],
  quiz: null,
  slides: [
    {
      id: "s1",
      order: 1,
      title: "Слайд 1",
      caption_html: "<p>Подсказка</p>",
      expected_result_html: "<p>Проект появился в списке</p>",
      image_path: "/content/placeholder-slide.svg",
      hotspots: [],
    },
  ],
};

describe("LessonReferencePanel", () => {
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

  it("shows assignment block without verify button for active lesson", () => {
    act(() => {
      root.render(
        <AppTheme>
          <MemoryRouter>
            <LessonReferencePanel
              lesson={baseLesson}
              slide={baseLesson.slides[0]}
              slideIndex={0}
              slideTotal={1}
              lessonState={{ lesson_id: "lesson-01", status: "active", completed_at: null, verify_result: null }}
            />
          </MemoryRouter>
        </AppTheme>,
      );
    });

    const panel = container.querySelector(".lesson-reference-panel");
    expect(panel?.querySelector(".lesson-actions")).not.toBeNull();
    expect(panel?.querySelector(".lesson-actions-block--assignment")).not.toBeNull();
    expect(panel?.querySelector(".lesson-actions-block--expected")).not.toBeNull();
    expect(container.textContent).toContain("Задание");
    expect(container.textContent).toContain("Создайте проект в демо");
    expect(container.textContent).toContain("Ожидаемый результат");
    expect(container.querySelector(".step-actions")).toBeNull();
    expect(container.textContent).not.toContain("Я выполнил");
  });

  it("hides assignment when lesson completed", () => {
    act(() => {
      root.render(
        <AppTheme>
          <MemoryRouter>
            <LessonReferencePanel
              lesson={baseLesson}
              slide={baseLesson.slides[0]}
              slideIndex={0}
              slideTotal={1}
              lessonState={{
                lesson_id: "lesson-01",
                status: "completed",
                completed_at: "2026-06-18T10:00:00Z",
                verify_result: null,
              }}
            />
          </MemoryRouter>
        </AppTheme>,
      );
    });

    expect(container.querySelector(".lesson-actions")).toBeNull();
  });

  it("does not show assignment for quiz lessons", () => {
    act(() => {
      root.render(
        <AppTheme>
          <MemoryRouter>
            <LessonReferencePanel
              lesson={{
                ...baseLesson,
                verify: { type: "quiz_passed", config: {} },
                quiz: { module_id: "orientation-v1", pass_threshold_percent: 80,
                  questions: [{ id: "q1", order: 1, prompt_html: "?", options: [{ id: "o1", text: "A" }], allow_multiple: false }],
                },
              }}
              slide={baseLesson.slides[0]}
              slideIndex={0}
              slideTotal={1}
            />
          </MemoryRouter>
        </AppTheme>,
      );
    });

    expect(container.querySelector(".lesson-actions")).toBeNull();
    expect(container.textContent).not.toContain("Квиз");
  });

  it("shows quiz reference only on quiz step for mixed lessons", () => {
    const mixedLesson: LessonDetail = {
      ...baseLesson,
      verify: { type: "quiz_passed", config: {} },
      quiz: {
        module_id: "orientation-v1",
        pass_threshold_percent: 80,
        questions: [{ id: "q1", order: 1, prompt_html: "?", options: [{ id: "o1", text: "A" }], allow_multiple: false }],
      },
      slides: [
        baseLesson.slides[0],
        { ...baseLesson.slides[0], id: "s2", order: 2, title: "Слайд 2" },
      ],
    };

    act(() => {
      root.render(
        <AppTheme>
          <MemoryRouter>
            <LessonReferencePanel
              lesson={mixedLesson}
              slide={mixedLesson.slides[0]}
              slideIndex={0}
              slideTotal={2}
              isOnQuizStep={false}
            />
          </MemoryRouter>
        </AppTheme>,
      );
    });

    expect(container.textContent).toContain("Слайд 1/2");
    expect(container.textContent).not.toContain("Квиз");

    act(() => {
      root.render(
        <AppTheme>
          <MemoryRouter>
            <LessonReferencePanel
              lesson={mixedLesson}
              slide={null}
              slideIndex={2}
              slideTotal={2}
              isOnQuizStep
            />
          </MemoryRouter>
        </AppTheme>,
      );
    });

    expect(container.textContent).toContain("Квиз");
    expect(container.textContent).toContain("80%");
  });

  it("shows quiz reference for quiz-only lessons", () => {
    act(() => {
      root.render(
        <AppTheme>
          <MemoryRouter>
            <LessonReferencePanel
              lesson={{
                ...baseLesson,
                slides: [],
                verify: { type: "quiz_passed", config: {} },
                quiz: {
                  module_id: "orientation-v1",
                  pass_threshold_percent: 80,
                  questions: [{ id: "q1", order: 1, prompt_html: "?", options: [{ id: "o1", text: "A" }], allow_multiple: false }],
                },
              }}
              slide={null}
              slideIndex={0}
              slideTotal={0}
            />
          </MemoryRouter>
        </AppTheme>,
      );
    });

    expect(container.textContent).toContain("Квиз");
  });
});

