/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { LessonDetail } from "../../../types/lesson";
import AppTheme from "../../../components/mui/AppTheme";
import LessonActions from "./LessonActions";

const baseLesson: LessonDetail = {
  id: "lesson-01",
  module_id: "orientation-v1",
  module_title: "Ориентация",
  order: 1,
  title: "Вход",
  summary: null,
  tags: [],
  instruction_html: "<p>Войдите в демо</p>",
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
      title: "Слайд",
      caption_html: "",
      expected_result_html: "<p>Готово</p>",
      image_path: "/content/placeholder-slide.svg",
      hotspots: [],
    },
  ],
};

describe("LessonActions", () => {
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

  it("shows assignment for active lesson", () => {
    act(() => {
      root.render(
        <AppTheme>
          <MemoryRouter>
            <LessonActions
              lesson={baseLesson}
              slide={baseLesson.slides[0]}
              lessonState={{ lesson_id: "lesson-01", status: "active", completed_at: null, verify_result: null }}
              busy={false}
              feedback={null}
              onVerify={() => undefined}
            />
          </MemoryRouter>
        </AppTheme>,
      );
    });

    expect(container.textContent).toContain("Задание");
    expect(container.textContent).toContain("Войдите в демо");
    expect(container.textContent).toContain("Ожидаемый результат");
  });

  it("hides block when lesson completed", () => {
    act(() => {
      root.render(
        <AppTheme>
          <MemoryRouter>
            <LessonActions
              lesson={baseLesson}
              slide={baseLesson.slides[0]}
              lessonState={{
                lesson_id: "lesson-01",
                status: "completed",
                completed_at: "2026-06-18T10:00:00Z",
                verify_result: null,
              }}
              busy={false}
              feedback={null}
              onVerify={() => undefined}
            />
          </MemoryRouter>
        </AppTheme>,
      );
    });

    expect(container.querySelector(".lesson-actions")).toBeNull();
  });

  it("shows actions in preview even when instruction is empty", () => {
    act(() => {
      root.render(
        <AppTheme>
          <MemoryRouter>
            <LessonActions
              lesson={{ ...baseLesson, instruction_html: "" }}
              slide={{ ...baseLesson.slides[0], expected_result_html: "" }}
              lessonState={{ lesson_id: "lesson-01", status: "active", completed_at: null, verify_result: null }}
              busy={false}
              feedback={null}
              isPreview
              onVerify={() => undefined}
            />
          </MemoryRouter>
        </AppTheme>,
      );
    });

    expect(container.querySelector(".lesson-actions")).not.toBeNull();
    expect(container.textContent).toContain("Проверка недоступна");
  });
});
