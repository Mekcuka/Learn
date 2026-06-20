/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppTheme from "../../../components/mui/AppTheme";
import LessonCompleteButton from "./LessonCompleteButton";

describe("LessonCompleteButton", () => {
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

  it("renders complete lesson label and calls handler", () => {
    const onComplete = vi.fn();

    act(() => {
      root.render(
        <AppTheme>
          <LessonCompleteButton busy={false} onComplete={onComplete} />
        </AppTheme>,
      );
    });

    const wrapper = container.querySelector(".lesson-complete-button");
    expect(wrapper).not.toBeNull();
    expect(getComputedStyle(wrapper!).position).not.toBe("fixed");

    const button = container.querySelector("button");
    expect(button?.textContent).toBe("Завершить урок");

    act(() => {
      button?.click();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows busy label and disables button while verifying", () => {
    act(() => {
      root.render(
        <AppTheme>
          <LessonCompleteButton busy onComplete={() => undefined} />
        </AppTheme>,
      );
    });

    const button = container.querySelector("button");
    expect(button?.textContent).toBe("Завершение…");
    expect(button?.disabled).toBe(true);
  });

  it("renders validation hint when provided", () => {
    act(() => {
      root.render(
        <AppTheme>
          <LessonCompleteButton
            busy={false}
            hint="Сначала отправьте ответы на квиз."
            onComplete={() => undefined}
          />
        </AppTheme>,
      );
    });

    const hint = container.querySelector(".lesson-complete-button__hint");
    expect(hint?.textContent).toBe("Сначала отправьте ответы на квиз.");
    expect(hint?.getAttribute("role")).toBe("alert");
  });

  it("does not render hint element when hint is absent", () => {
    act(() => {
      root.render(
        <AppTheme>
          <LessonCompleteButton busy={false} onComplete={() => undefined} />
        </AppTheme>,
      );
    });

    expect(container.querySelector(".lesson-complete-button__hint")).toBeNull();
  });

  it("keeps button offset stable when hint appears", () => {
    const onComplete = vi.fn();

    act(() => {
      root.render(
        <AppTheme>
          <LessonCompleteButton busy={false} onComplete={onComplete} />
        </AppTheme>,
      );
    });

    const button = container.querySelector(".lesson-complete-button button");
    const topWithoutHint = (button as HTMLElement | null)?.offsetTop;

    act(() => {
      root.render(
        <AppTheme>
          <LessonCompleteButton
            busy={false}
            hint="Сначала отправьте ответы на квиз."
            onComplete={onComplete}
          />
        </AppTheme>,
      );
    });

    const buttonWithHint = container.querySelector(".lesson-complete-button button");
    expect((buttonWithHint as HTMLElement | null)?.offsetTop).toBe(topWithoutHint);
  });
});
