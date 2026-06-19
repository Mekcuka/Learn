/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import LessonScreenshotHintsPanel, { slideHotspotHints } from "./LessonScreenshotHintsPanel";
import type { LessonSlide } from "../../../types/lesson";
import * as scrollContainer from "../../../utils/scrollContainer";
function makeSlide(hotspots: LessonSlide["hotspots"]): LessonSlide {
  return {
    id: "slide-1",
    order: 1,
    title: "Тестовый слайд",
    caption_html: "",
    expected_result_html: "",
    image_path: "/content/test.png",
    hotspots,
  };
}

describe("slideHotspotHints", () => {
  it("returns empty list when slide is null", () => {
    expect(slideHotspotHints(null)).toEqual([]);
  });

  it("returns hotspot items from slide data", () => {
    const slide = makeSlide([
      {
        id: "h1",
        label: "Кнопка входа",
        x_pct: 10,
        y_pct: 20,
        width_pct: 15,
        height_pct: 8,
        description_html: "<p>Нажмите здесь</p>",
      },
      {
        id: "h2",
        label: "Меню",
        x_pct: 80,
        y_pct: 5,
        width_pct: 10,
        height_pct: 10,
      },
    ]);

    const hints = slideHotspotHints(slide);
    expect(hints).toHaveLength(2);
    expect(hints[0].label).toBe("Кнопка входа");
    expect(hints[1].id).toBe("h2");
  });
});

describe("LessonScreenshotHintsPanel markup", () => {
  it("wraps scrollable content in lesson-hints-body", () => {
    const slide = makeSlide([
      {
        id: "h1",
        label: "Кнопка входа",
        x_pct: 10,
        y_pct: 20,
        width_pct: 15,
        height_pct: 8,
      },
    ]);

    const html = renderToStaticMarkup(createElement(LessonScreenshotHintsPanel, { slide }));
    expect(html).toContain('class="lesson-hints-body"');
    expect(html).toContain('class="lesson-hints-list"');
    expect(html).toContain("Кнопка входа");
  });
});

describe("LessonScreenshotHintsPanel scroll", () => {
  let container: HTMLDivElement;
  let root: Root;

  const slide = makeSlide([
    {
      id: "h1",
      label: "Первая",
      x_pct: 10,
      y_pct: 20,
      width_pct: 15,
      height_pct: 8,
    },
    {
      id: "h2",
      label: "Вторая",
      x_pct: 20,
      y_pct: 30,
      width_pct: 15,
      height_pct: 8,
    },
  ]);

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
    vi.restoreAllMocks();
  });

  it("does not scroll active item when scrollActiveItem is false", async () => {
    const scrollSpy = vi.spyOn(scrollContainer, "scrollIntoOverflowParent");

    await act(async () => {
      root.render(
        createElement(LessonScreenshotHintsPanel, {
          slide,
          activeHotspotId: "h2",
          scrollActiveItem: false,
        }),
      );
    });

    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it("scrolls active item inside overflow parent when scrollActiveItem is true", async () => {
    const scrollSpy = vi.spyOn(scrollContainer, "scrollIntoOverflowParent");

    await act(async () => {
      root.render(
        createElement(LessonScreenshotHintsPanel, {
          slide,
          activeHotspotId: "h2",
          scrollActiveItem: true,
        }),
      );
    });

    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy.mock.calls[0][0].dataset.hotspotId).toBe("h2");
  });
});
