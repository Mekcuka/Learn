/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppTheme from "../../../components/mui/AppTheme";
import QuizPanel from "./QuizPanel";

const quiz = {
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
};

describe("QuizPanel", () => {
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

  it("shows submit error message when provided", () => {
    act(() => {
      root.render(
        <AppTheme>
          <QuizPanel
            quiz={quiz}
            busy={false}
            result={null}
            submitError="Урок не найден"
            onSubmit={vi.fn()}
          />
        </AppTheme>,
      );
    });

    expect(container.textContent).toContain("Урок не найден");
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });
});
