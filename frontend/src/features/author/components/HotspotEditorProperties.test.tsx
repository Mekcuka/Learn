/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HotspotItem } from "../../../types/lesson";
import AppTheme from "../../../components/mui/AppTheme";
import HotspotEditorProperties from "./HotspotEditorProperties";

const regionHotspot: HotspotItem = {
  id: "region-1",
  label: "Кнопка",
  kind: "region",
  x_pct: 10,
  y_pct: 20,
  width_pct: 15,
  height_pct: 8,
  description_html: "<p>Нажмите на кнопку входа</p>",
};

describe("HotspotEditorProperties", () => {
  let container: HTMLDivElement;
  let root: Root;
  const onUpdate = vi.fn();
  const onRemove = vi.fn();
  const onCoordChange = vi.fn();

  beforeEach(() => {
    onUpdate.mockClear();
    onRemove.mockClear();
    onCoordChange.mockClear();
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

  function renderProperties(hotspot: HotspotItem | null) {
    act(() => {
      root.render(
        <AppTheme>
          <HotspotEditorProperties
            hotspot={hotspot}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onCoordChange={onCoordChange}
          />
        </AppTheme>,
      );
    });
  }

  it("shows empty state when nothing is selected", () => {
    renderProperties(null);

    expect(container.textContent).toContain("Выберите метку");
    expect(container.querySelector(".hotspot-editor-properties--empty")).not.toBeNull();
  });

  it("shows fill toggle and palette for region hotspot", () => {
    renderProperties(regionHotspot);

    expect(container.textContent).toContain("Заливка");
    expect(container.textContent).toContain("Рамка");
    expect(container.textContent).toContain("Пульс");
    expect(container.querySelectorAll(".hotspot-fill-swatch")).toHaveLength(20);
    expect(container.querySelector(".hotspot-editor-coords-grid")).not.toBeNull();
  });

  it("shows full rich text toolbar for description field", () => {
    renderProperties(regionHotspot);

    const toolbar = container.querySelector('[aria-label="Форматирование"]');
    expect(toolbar).not.toBeNull();
    expect(container.textContent).toContain("Описание для ученика");
    expect(container.textContent).toContain("Заголовок");
    expect(container.textContent).toContain("Размер");
    expect(container.textContent).toContain("Ссылка");
    expect(container.textContent).toContain("Таблица");
    expect(container.textContent).toContain("Исходный код");
  });

  it("shows fill toggle and palette for pin hotspot", () => {
    renderProperties({
      ...regionHotspot,
      id: "pin-1",
      kind: "pin",
      width_pct: 2,
      height_pct: 2,
    });

    expect(container.textContent).toContain("Заливка");
    expect(container.textContent).toContain("Рамка");
    expect(container.querySelectorAll(".hotspot-fill-swatch")).toHaveLength(20);
    expect(container.textContent).not.toContain("Пульс");
  });

  it("shows callout width selector for pin hotspot", () => {
    renderProperties({
      ...regionHotspot,
      id: "pin-1",
      kind: "pin",
      width_pct: 2,
      height_pct: 2,
    });

    expect(container.textContent).toContain("Ширина выноски");
    expect(container.textContent).toContain("Обычная");
  });

  it("shows callout side selector for pin hotspot", () => {
    renderProperties({
      ...regionHotspot,
      id: "pin-1",
      kind: "pin",
      width_pct: 2,
      height_pct: 2,
      callout_side: "top",
    });

    expect(container.textContent).toContain("Положение выноски");
    expect(container.textContent).toContain("Сверху");
  });

  it("updates fill_enabled, fill_color and border_color", () => {
    renderProperties(regionHotspot);

    const fillSwitch = container.querySelector('input[type="checkbox"]');
    expect(fillSwitch).not.toBeNull();

    act(() => {
      fillSwitch?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const greenSwatch = container.querySelectorAll<HTMLButtonElement>('[aria-label="Зелёный"]');
    act(() => {
      greenSwatch[0]?.click();
    });

    const purpleSwatch = container.querySelectorAll<HTMLButtonElement>('[aria-label="Фиолетовый"]');
    act(() => {
      purpleSwatch[1]?.click();
    });

    expect(onUpdate).toHaveBeenCalled();
    const calls = onUpdate.mock.calls.map((call) => call[1]);
    expect(calls.some((patch) => patch.fill_color === "green")).toBe(true);
    expect(calls.some((patch) => patch.border_color === "purple")).toBe(true);
  });

  it("applies font size to description and persists in description_html", async () => {
    renderProperties(regionHotspot);

    const proseMirror = container.querySelector(".ProseMirror");
    expect(proseMirror).not.toBeNull();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const sizeButton = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Размер"),
    );
    expect(sizeButton).toBeTruthy();

    act(() => {
      sizeButton!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      sizeButton!.click();
    });

    const menuItem = Array.from(document.querySelectorAll('[role="menuitem"]')).find((item) =>
      item.textContent?.includes("24px"),
    );
    expect(menuItem).toBeTruthy();

    act(() => {
      (menuItem as HTMLElement).click();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const descriptionUpdate = onUpdate.mock.calls.find((call) => call[1].description_html !== undefined);
    expect(descriptionUpdate).toBeTruthy();
    expect(descriptionUpdate![1].description_html).toMatch(/font-size:\s*24px/);
    expect(proseMirror!.innerHTML).toMatch(/font-size:\s*24px/);
  });
});
