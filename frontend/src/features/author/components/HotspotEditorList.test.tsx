/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HotspotItem } from "../../../types/lesson";
import AppTheme from "../../../components/mui/AppTheme";
import HotspotEditorList from "./HotspotEditorList";

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

const secondHotspot: HotspotItem = {
  id: "region-2",
  label: "Меню",
  kind: "region",
  x_pct: 30,
  y_pct: 40,
  width_pct: 12,
  height_pct: 6,
};

describe("HotspotEditorList", () => {
  let container: HTMLDivElement;
  let root: Root;
  const onSelect = vi.fn();

  beforeEach(() => {
    onSelect.mockClear();
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

  function renderList(hotspots: HotspotItem[], selectedId: string | null) {
    act(() => {
      root.render(
        <AppTheme>
          <HotspotEditorList hotspots={hotspots} selectedId={selectedId} onSelect={onSelect} />
        </AppTheme>,
      );
    });
  }

  it("renders compact rows with index and kind badge", () => {
    renderList([regionHotspot, secondHotspot], regionHotspot.id);

    const items = container.querySelectorAll(".hotspot-editor-list-item");
    expect(items).toHaveLength(2);

    expect(container.querySelector(".hotspot-editor-list-item-active")?.textContent).toContain("Кнопка");
    expect(container.querySelectorAll(".hotspot-editor-list-index")).toHaveLength(2);
    expect(container.querySelector(".hotspot-editor-list-body")).toBeNull();
  });

  it("selects hotspot on row click", () => {
    renderList([regionHotspot, secondHotspot], regionHotspot.id);

    const rows = container.querySelectorAll(".hotspot-editor-list-item");
    act(() => {
      rows[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSelect).toHaveBeenCalledWith("region-2");
  });

  it("shows empty state when there are no hotspots", () => {
    renderList([], null);

    expect(container.textContent).toContain("Нет меток");
    expect(container.querySelector(".hotspot-editor-list")).toBeNull();
  });
});
