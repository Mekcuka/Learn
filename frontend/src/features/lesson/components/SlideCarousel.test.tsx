/**
 * @vitest-environment jsdom
 */
/**
 * @vitest-environment jsdom
 */
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LessonSlide } from "../../../types/lesson";
import AppTheme from "../../../components/mui/AppTheme";
import SlideCarousel from "./SlideCarousel";

vi.mock("./ScreenshotGuide", () => ({
  default: ({
    onToolbarPropsChange,
  }: {
    onToolbarPropsChange?: (props: Record<string, unknown>) => void;
  }) => {
    useEffect(() => {
      onToolbarPropsChange?.({
        zoom: 1,
        canZoomIn: true,
        canZoomOut: false,
        showHotspots: true,
        isFullscreen: false,
        onZoomIn: vi.fn(),
        onZoomOut: vi.fn(),
        onReset: vi.fn(),
        onToggleHotspots: vi.fn(),
        onToggleFullscreen: vi.fn(),
      });
    }, [onToolbarPropsChange]);
    return <div data-testid="screenshot-guide" />;
  },
}));

function makeSlide(id: string, order: number, title: string): LessonSlide {
  return {
    id,
    order,
    title,
    caption_html: "",
    expected_result_html: "",
    image_path: `/content/${id}.png`,
    hotspots: [],
  };
}

const slides = [
  makeSlide("slide-1", 1, "Первый"),
  makeSlide("slide-2", 2, "Второй"),
  makeSlide("slide-3", 3, "Третий"),
];

describe("SlideCarousel navigation", () => {
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

  it("advances to the next slide when Далее is clicked", () => {
    const onChange = vi.fn();

    act(() => {
      root.render(
        <AppTheme>
          <SlideCarousel slides={slides} currentIndex={0} onChange={onChange} />
        </AppTheme>,
      );
    });

    const nextButton = container.querySelector(
      'button[aria-label="Следующий слайд"]',
    ) as HTMLButtonElement | null;
    expect(nextButton).not.toBeNull();
    expect(nextButton?.disabled).toBe(false);

    act(() => {
      nextButton?.click();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("disables Далее on the last slide", () => {
    act(() => {
      root.render(
        <AppTheme>
          <SlideCarousel slides={slides} currentIndex={2} onChange={vi.fn()} />
        </AppTheme>,
      );
    });

    const nextButton = container.querySelector(
      'button[aria-label="Следующий слайд"]',
    ) as HTMLButtonElement | null;
    expect(nextButton?.disabled).toBe(true);
  });

  it("renders hotspot-only screenshot toolbar inside slide-nav", () => {
    act(() => {
      root.render(
        <AppTheme>
          <SlideCarousel slides={slides} currentIndex={0} onChange={vi.fn()} />
        </AppTheme>,
      );
    });

    const nav = container.querySelector("nav.slide-nav");
    expect(nav).not.toBeNull();
    expect(nav?.querySelector(".slide-nav-toolbar .screenshot-toolbar")).not.toBeNull();
    expect(container.querySelector(".screenshot-guide .screenshot-toolbar")).toBeNull();
    expect(container.textContent).toContain("Метки");
    expect(container.textContent).not.toContain("На весь экран");
    expect(container.textContent).not.toContain("Сброс");
    expect(container.querySelector('button[aria-label="Уменьшить"]')).toBeNull();
  });
});
