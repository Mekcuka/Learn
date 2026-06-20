/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LessonDetail } from "../../../types/lesson";
import AppTheme from "../../../components/mui/AppTheme";
import LessonPageHeader from "./LessonPageHeader";

const baseLesson: LessonDetail = {
  id: "lesson-01",
  module_id: "orientation-v1",
  module_title: "Ориентация",
  order: 1,
  title: "Вход",
  summary: null,
  tags: [],
  instruction_html: null,
  deep_link: null,
  verify: { type: "manual", config: {} },
  progress_percent: 0,
  project_id: null,
  lesson_states: [],
  module_lessons: [
    { id: "lesson-01", order: 1, title: "Вход", status: "active" },
    { id: "lesson-02", order: 2, title: "Создание проекта", status: "locked" },
  ],
  quiz: null,
  slides: [
    {
      id: "s1",
      order: 1,
      title: "Слайд 1",
      caption_html: null,
      expected_result_html: null,
      image_path: "/content/placeholder-slide.svg",
      hotspots: [],
    },
  ],
};

describe("LessonPageHeader", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderHeader(overrides: Partial<Parameters<typeof LessonPageHeader>[0]> = {}) {
    act(() => {
      root.render(
        <MemoryRouter>
          <AppTheme>
            <LessonPageHeader
              lesson={baseLesson}
              lessonState={{ lesson_id: "lesson-01", status: "active" }}
              totalLessons={2}
              completedLessons={0}
              isPreview={false}
              isDraftPreview={false}
              showHintsColumn
              nextLessonNavigation={null}
              showCompleteButton={false}
              verifyBusy={false}
              onBack={() => undefined}
              onNavigate={() => undefined}
              onComplete={() => undefined}
              roadmapLinkTo={(id) => `/lessons/${id}`}
              {...overrides}
            />
          </AppTheme>
        </MemoryRouter>,
      );
    });
  }

  it("renders complete button in header next column when visible without next step card", () => {
    renderHeader({ showCompleteButton: true });

    const nextColumn = container.querySelector(".lesson-page-header__next");
    expect(nextColumn).not.toBeNull();
    expect(nextColumn?.querySelector(".lesson-complete-button")).not.toBeNull();
    expect(nextColumn?.querySelector("section")).toBeNull();
    expect(nextColumn?.textContent).toContain("Завершить урок");
  });

  it("renders next step card and complete button in the same header next row", () => {
    renderHeader({
      showCompleteButton: true,
      nextLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
    });

    const nextColumn = container.querySelector(".lesson-page-header__next");
    expect(nextColumn?.querySelector("section")?.getAttribute("aria-label")).toBe("Следующий урок");
    expect(nextColumn?.querySelector(".lesson-complete-button")).not.toBeNull();

    const children = nextColumn?.children;
    expect(children?.length).toBe(2);
    expect(children?.[0]?.tagName).toBe("SECTION");
    expect(children?.[1]?.classList.contains("lesson-complete-button")).toBe(true);
  });

  it("calls onComplete when complete button is clicked", () => {
    const onComplete = vi.fn();
    renderHeader({ showCompleteButton: true, onComplete });

    const completeButton = container.querySelector(".lesson-complete-button button");
    act(() => completeButton?.click());

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not render header next column when neither next step nor complete button is shown", () => {
    renderHeader({ showCompleteButton: false, nextLessonNavigation: null });

    expect(container.querySelector(".lesson-page-header__next")).toBeNull();
  });
});
