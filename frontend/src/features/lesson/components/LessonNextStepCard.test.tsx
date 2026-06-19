/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import AppTheme from "../../../components/mui/AppTheme";
import LessonNextStepCard from "./LessonNextStepCard";

describe("LessonNextStepCard", () => {
  let container: HTMLDivElement;
  let root: Root;
  let navigatedTo: string | null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    navigatedTo = null;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderCard(navigation: Parameters<typeof LessonNextStepCard>[0]["navigation"]) {
    act(() => {
      root.render(
        <AppTheme>
          <LessonNextStepCard
            navigation={navigation}
            onNavigate={(path) => {
              navigatedTo = path;
            }}
          />
        </AppTheme>,
      );
    });
  }

  it("renders next lesson button with title subtitle", () => {
    renderCard({ kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" });

    const section = container.querySelector("section");
    expect(section?.getAttribute("aria-label")).toBe("Следующий урок");
    expect(container.textContent).toContain("Следующий урок");
    expect(container.textContent).toContain("Создание проекта");
    expect(container.textContent).not.toContain("Урок выполнен");
  });

  it("navigates to next lesson on click", () => {
    renderCard({ kind: "lesson", lessonId: "lesson-02", title: "Создание проекта" });

    const button = container.querySelector("button");
    act(() => button?.click());

    expect(navigatedTo).toBe("/lessons/lesson-02");
  });

  it("renders catalog button for module completion", () => {
    renderCard({ kind: "catalog" });

    const section = container.querySelector("section");
    expect(section?.getAttribute("aria-label")).toBe("Завершение модуля");
    expect(container.textContent).toContain("К каталогу уроков");
    expect(container.textContent).not.toContain("Урок выполнен");
  });

  it("navigates to dashboard on catalog click", () => {
    renderCard({ kind: "catalog" });

    const button = container.querySelector("button");
    act(() => button?.click());

    expect(navigatedTo).toBe("/dashboard");
  });
});
