/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppTheme from "../../../components/mui/AppTheme";
import LessonHeaderNextActions from "./LessonHeaderNextActions";

describe("LessonHeaderNextActions", () => {
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

  function renderActions(overrides: Partial<Parameters<typeof LessonHeaderNextActions>[0]> = {}) {
    act(() => {
      root.render(
        <AppTheme>
          <LessonHeaderNextActions
            showNextStep={false}
            showComplete={false}
            nextLessonNavigation={null}
            upcomingLessonNavigation={null}
            verifyBusy={false}
            onNavigate={() => undefined}
            onComplete={() => undefined}
            {...overrides}
          />
        </AppTheme>,
      );
    });
  }

  it("renders full-width complete button when only complete is visible and no upcoming lesson", () => {
    renderActions({ showComplete: true, upcomingLessonNavigation: { kind: "catalog" } });

    expect(container.querySelector(".lesson-complete-button")).not.toBeNull();
    expect(container.querySelector('[role="group"]')).toBeNull();
    expect(container.textContent).toContain("Завершить урок");
  });

  it("renders split button on final step before lesson completion", () => {
    renderActions({
      showComplete: true,
      upcomingLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
    });

    const splitGroup = container.querySelector('[role="group"][aria-label="Следующий урок и завершение"]');
    expect(splitGroup).not.toBeNull();
    expect(container.querySelector(".lesson-complete-button")).toBeNull();

    const buttons = splitGroup?.querySelectorAll("button");
    expect(buttons?.length).toBe(2);
    expect(buttons?.[0]?.disabled).toBe(true);
    expect(buttons?.[0]?.textContent).toContain("Следующий урок");
    expect(buttons?.[0]?.textContent).not.toContain("Создание проекта");
    expect(buttons?.[0]?.getAttribute("aria-label")).toBe("Следующий урок: Создание проекта");
    expect(buttons?.[1]?.textContent).toBe("Завершить урок");
  });

  it("renders next step card when only next lesson is visible without upcoming split", () => {
    renderActions({
      showNextStep: true,
      nextLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
      upcomingLessonNavigation: { kind: "catalog" },
    });

    const section = container.querySelector("section");
    expect(section?.getAttribute("aria-label")).toBe("Следующий урок");
    expect(container.textContent).toContain("Создание проекта");
    expect(container.querySelector(".lesson-complete-button")).toBeNull();
  });

  it("renders unified split button when both next lesson and complete are visible", () => {
    renderActions({
      showNextStep: true,
      showComplete: true,
      nextLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
      upcomingLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
    });

    const splitGroup = container.querySelector('[role="group"][aria-label="Следующий урок и завершение"]');
    expect(splitGroup).not.toBeNull();
    expect(container.querySelector(".lesson-complete-button")).toBeNull();
    expect(container.querySelector('[role="separator"]')).not.toBeNull();

    const buttons = splitGroup?.querySelectorAll("button");
    expect(buttons?.length).toBe(2);
    expect(buttons?.[0]?.textContent).toContain("Следующий урок");
    expect(buttons?.[0]?.textContent).not.toContain("Создание проекта");
    expect(buttons?.[1]?.textContent).toBe("Завершить урок");
  });

  it("calls onNavigate and onComplete from split halves", () => {
    const onNavigate = vi.fn();
    const onComplete = vi.fn();

    renderActions({
      showNextStep: true,
      showComplete: true,
      nextLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
      upcomingLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
      onNavigate,
      onComplete,
    });

    const buttons = container.querySelectorAll('[role="group"] button');
    act(() => buttons[0]?.click());
    act(() => buttons[1]?.click());

    expect(onNavigate).toHaveBeenCalledWith("/lessons/lesson-02");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("renders split with enabled next half after lesson completion", () => {
    renderActions({
      showNextStep: true,
      nextLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
      upcomingLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
    });

    const buttons = container.querySelectorAll('[role="group"] button');
    expect(buttons.length).toBe(2);
    expect(buttons[0]?.textContent).toContain("Следующий урок");
    expect(buttons[0]?.textContent).not.toContain("Создание проекта");
    expect(buttons[1]?.textContent).toBe("Выполнен");
  });

  it("renders catalog button for module completion without split", () => {
    renderActions({
      showNextStep: true,
      nextLessonNavigation: { kind: "catalog" },
    });

    expect(container.textContent).toContain("К каталогу уроков");
    expect(container.querySelector('[role="group"]')).toBeNull();
  });

  it("shows complete hint overlay without shifting split bar", () => {
    renderActions({
      showComplete: true,
      upcomingLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
    });

    const splitGroup = container.querySelector('[role="group"]');
    const topWithoutHint = splitGroup?.getBoundingClientRect().top;

    expect(container.querySelector('[role="alert"]')).toBeNull();

    renderActions({
      showComplete: true,
      completeHint: "Сначала отправьте ответы на квиз.",
      upcomingLessonNavigation: { kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" },
    });

    const splitGroupWithHint = container.querySelector('[role="group"]');
    expect(splitGroupWithHint?.getBoundingClientRect().top).toBe(topWithoutHint);
    expect(container.querySelector('[role="alert"]')?.textContent).toBe("Сначала отправьте ответы на квиз.");
  });
});
