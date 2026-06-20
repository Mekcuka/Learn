/**
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
              showNextStep={false}
              nextLessonNavigation={null}
              upcomingLessonNavigation={null}
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

  it("renders full-width complete button in header next column when visible without upcoming lesson", () => {
    renderHeader({
      showCompleteButton: true,
      upcomingLessonNavigation: { kind: "catalog" },
    });

    const nextColumn = container.querySelector(".lesson-page-header__next");
    expect(nextColumn).not.toBeNull();
    expect(nextColumn?.querySelector(".lesson-complete-button")).not.toBeNull();
    expect(nextColumn?.querySelector('[role="group"]')).toBeNull();
    expect(nextColumn?.textContent).toContain("Завершить урок");
  });

  it("renders split button on final step before lesson completion", () => {
    renderHeader({
      showCompleteButton: true,
      upcomingLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
    });

    const nextColumn = container.querySelector(".lesson-page-header__next");
    const splitGroup = nextColumn?.querySelector('[role="group"][aria-label="Следующий урок и завершение"]');
    expect(splitGroup).not.toBeNull();
    expect(nextColumn?.querySelector(".lesson-complete-button")).toBeNull();
    expect(nextColumn?.textContent).toContain("Следующий урок");
    expect(nextColumn?.textContent).toContain("Завершить урок");
    expect(nextColumn?.querySelector('[aria-label*="Создание проекта"]')).not.toBeNull();
  });

  it("renders unified split button when next step and complete are both visible", () => {
    renderHeader({
      showNextStep: true,
      showCompleteButton: true,
      nextLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
      upcomingLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
    });

    const nextColumn = container.querySelector(".lesson-page-header__next");
    const splitGroup = nextColumn?.querySelector('[role="group"][aria-label="Следующий урок и завершение"]');
    expect(splitGroup).not.toBeNull();
    expect(nextColumn?.querySelector(".lesson-complete-button")).toBeNull();
    expect(nextColumn?.textContent).toContain("Следующий урок");
    expect(nextColumn?.textContent).toContain("Завершить урок");
    expect(nextColumn?.querySelector('[aria-label*="Создание проекта"]')).not.toBeNull();
    expect(nextColumn?.children.length).toBe(1);
  });

  it("calls onComplete when complete half of split button is clicked", () => {
    const onComplete = vi.fn();
    renderHeader({
      showNextStep: true,
      showCompleteButton: true,
      nextLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
      upcomingLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
      onComplete,
    });

    const buttons = container.querySelectorAll('[role="group"] button');
    act(() => buttons[1]?.click());

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls onComplete when standalone complete button is clicked", () => {
    const onComplete = vi.fn();
    renderHeader({ showCompleteButton: true, onComplete });

    const completeButton = container.querySelector(".lesson-complete-button button");
    act(() => completeButton?.click());

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows split next step in header on quiz step after lesson is completed", () => {
    renderHeader({
      showNextStep: true,
      showCompleteButton: false,
      nextLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
      upcomingLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
    });

    expect(container.querySelector(".lesson-page-header__next")).not.toBeNull();
    expect(container.querySelector('[role="group"][aria-label="Следующий урок и завершение"]')).not.toBeNull();
  });

  it("does not render header next column when neither next step nor complete button is shown", () => {
    renderHeader({ showCompleteButton: false, nextLessonNavigation: null });

    expect(container.querySelector(".lesson-page-header__next")).toBeNull();
  });

  it("keeps roadmap in middle grid column when hints are shown without next actions", () => {
    renderHeader({
      showHintsColumn: true,
      showCompleteButton: false,
      showNextStep: false,
      nextLessonNavigation: null,
    });

    expect(container.querySelector(".lesson-page-header-grid")).not.toBeNull();
    expect(container.querySelector(".lesson-page-header__next")).toBeNull();
    expect(container.querySelector(".lesson-page-header__roadmap nav[aria-label='Прогресс по модулю']")).not.toBeNull();

    const cssPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../styles/lesson-page.css",
    );
    const lessonPageCss = readFileSync(cssPath, "utf8");
    expect(lessonPageCss).toMatch(/\.lesson-page-header__roadmap\s*\{[^}]*grid-column:\s*2;/s);
    expect(lessonPageCss).not.toMatch(/lesson-page-header__roadmap[^}]*grid-column:\s*2\s*\/\s*-1/s);
  });
});
