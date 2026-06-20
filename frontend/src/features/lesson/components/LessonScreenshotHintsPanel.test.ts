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
  const slideWithDescriptions = makeSlide([
    {
      id: "h1",
      label: "Кнопка входа",
      x_pct: 10,
      y_pct: 20,
      width_pct: 15,
      height_pct: 8,
      description_html: "<p>Нажмите здесь для входа в систему</p>",
    },
    {
      id: "h2",
      label: "Меню",
      x_pct: 80,
      y_pct: 5,
      width_pct: 10,
      height_pct: 10,
      description_html: "<p>Откройте меню настроек</p>",
    },
  ]);

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

  it("marks inactive hints collapsed and active hint expanded", () => {
    const html = renderToStaticMarkup(
      createElement(LessonScreenshotHintsPanel, {
        slide: slideWithDescriptions,
        activeHotspotId: "h1",
      }),
    );

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('id="lesson-hint-desc-h1"');
    expect(html).toContain("lesson-hints-description--collapsed");
    expect(html).toContain("Нажмите здесь для входа в систему");
    expect(html).toContain("Откройте меню настроек");
    expect(html.match(/lesson-hints-description--collapsed/g)?.length).toBe(1);
  });

  it("shows truncated preview for inactive hints with description", () => {
    const html = renderToStaticMarkup(
      createElement(LessonScreenshotHintsPanel, { slide: slideWithDescriptions }),
    );

    expect(html).toContain("lesson-hints-description--collapsed");
    expect(html).not.toContain('aria-expanded="true"');
  });
});

describe("LessonScreenshotHintsPanel interaction", () => {
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
      description_html: "<p>Подробное описание первой метки</p>",
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

  it("selects hotspot and expands description on click", async () => {
    const onHotspotSelect = vi.fn();

    await act(async () => {
      root.render(
        createElement(LessonScreenshotHintsPanel, {
          slide,
          onHotspotSelect,
        }),
      );
    });

    const secondButton = container.querySelector<HTMLButtonElement>(
      '[data-hotspot-id="h2"] .lesson-hints-btn',
    );
    expect(secondButton?.getAttribute("aria-expanded")).toBe("false");

    await act(async () => {
      secondButton?.click();
    });

    expect(onHotspotSelect).toHaveBeenCalledWith("h2");
  });

  it("activates hotspot on Enter key", async () => {
    const onHotspotSelect = vi.fn();

    await act(async () => {
      root.render(
        createElement(LessonScreenshotHintsPanel, {
          slide,
          onHotspotSelect,
        }),
      );
    });

    const firstButton = container.querySelector<HTMLButtonElement>(
      '[data-hotspot-id="h1"] .lesson-hints-btn',
    );

    await act(async () => {
      firstButton?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    expect(onHotspotSelect).toHaveBeenCalledWith("h1");
  });

  it("shows expanded description only for active hotspot", async () => {
    await act(async () => {
      root.render(
        createElement(LessonScreenshotHintsPanel, {
          slide,
          activeHotspotId: "h1",
        }),
      );
    });

    const activeItem = container.querySelector('[data-hotspot-id="h1"]');
    const inactiveItem = container.querySelector('[data-hotspot-id="h2"]');

    expect(activeItem?.querySelector(".MuiCollapse-root")).not.toBeNull();
    expect(activeItem?.textContent).toContain("Подробное описание первой метки");
    expect(inactiveItem?.querySelector(".lesson-hints-description--collapsed")).toBeNull();
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
