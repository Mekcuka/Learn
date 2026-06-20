/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HotspotItem } from "../../../types/lesson";
import AppTheme from "../../../components/mui/AppTheme";
import "../../../styles/author.css";
import HotspotEditor from "./HotspotEditor";

vi.mock("../../lesson/hooks/useScreenshotViewport", () => ({
  useScreenshotViewport: () => ({
    frameRef: { current: null },
    containerRef: { current: null },
    pan: { x: 0, y: 0 },
    zoom: 1,
    canZoomIn: true,
    canZoomOut: true,
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    reset: vi.fn(),
    panBy: vi.fn(),
    handleWheel: vi.fn(),
  }),
}));

vi.mock("./HotspotEditorFrame", () => ({
  default: () => <div className="hotspot-editor-frame screenshot-frame" data-testid="editor-frame" />,
}));

const regionHotspot: HotspotItem = {
  id: "region-1",
  label: "Кнопка",
  kind: "region",
  x_pct: 10,
  y_pct: 20,
  width_pct: 15,
  height_pct: 8,
};

describe("HotspotEditor layout", () => {
  let container: HTMLDivElement;
  let root: Root;
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
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

  function renderEditor(hotspots: HotspotItem[] = [regionHotspot]) {
    act(() => {
      root.render(
        <AppTheme>
          <HotspotEditor imagePath="/content/test.png" hotspots={hotspots} onChange={onChange} />
        </AppTheme>,
      );
    });
  }

  it("does not trap page scroll in hotspot editor workspace", () => {
    renderEditor();

    const workspace = container.querySelector<HTMLElement>(".hotspot-editor-workspace");
    expect(workspace).not.toBeNull();
    expect(getComputedStyle(workspace!).overflowY).not.toBe("auto");
    expect(getComputedStyle(workspace!).overflowY).not.toBe("scroll");
  });

  it("does not trap page scroll in panel when hotspot is selected", () => {
    act(() => {
      root.render(
        <AppTheme>
          <HotspotEditor
            imagePath="/content/test.png"
            hotspots={[regionHotspot]}
            onChange={onChange}
            selectedId={regionHotspot.id}
            onSelectedIdChange={vi.fn()}
          />
        </AppTheme>,
      );
    });

    const panel = container.querySelector<HTMLElement>(".hotspot-editor-panel");
    const propertiesBody = container.querySelector<HTMLElement>(".hotspot-editor-properties-body");
    expect(panel).not.toBeNull();
    expect(propertiesBody).not.toBeNull();
    expect(getComputedStyle(panel!).overflowY).not.toBe("hidden");
    expect(getComputedStyle(propertiesBody!).overflowY).not.toBe("auto");
    expect(getComputedStyle(propertiesBody!).overscrollBehavior).not.toContain("contain");
  });

  it("places hotspot panel below the screenshot canvas", () => {
    renderEditor();

    const workspace = container.querySelector(".hotspot-editor-workspace");
    const canvas = container.querySelector(".hotspot-editor-canvas");
    const panel = container.querySelector(".hotspot-editor-panel");
    const frame = container.querySelector(".hotspot-editor-frame");

    expect(workspace).not.toBeNull();
    expect(canvas).not.toBeNull();
    expect(panel).not.toBeNull();
    expect(frame).not.toBeNull();
    expect(container.querySelector(".hotspot-editor-sidebar")).toBeNull();

    const children = Array.from(workspace!.children);
    expect(children.indexOf(canvas!)).toBeLessThan(children.indexOf(panel!));
    expect(canvas!.contains(frame!)).toBe(true);
  });

  it("renders compact list and properties inside the bottom panel", () => {
    renderEditor();

    const panel = container.querySelector(".hotspot-editor-panel");
    expect(panel?.querySelector(".hotspot-editor-list-panel")).not.toBeNull();
    expect(panel?.querySelector(".hotspot-editor-properties")).not.toBeNull();
    expect(panel?.textContent).toContain("Кнопка");
    expect(panel?.textContent).toContain("Выберите метку");
    expect(panel?.querySelector(".hotspot-editor-list-item-active")).toBeNull();
  });

  it("starts with no hotspot selected in uncontrolled mode", () => {
    renderEditor();

    expect(container.textContent).toContain("Выберите метку");
    expect(container.querySelector(".hotspot-editor-properties--empty")).not.toBeNull();
    expect(container.querySelector(".hotspot-editor-list-item-active")).toBeNull();
  });

  it("shows empty properties when controlled selectedId is null", () => {
    act(() => {
      root.render(
        <AppTheme>
          <HotspotEditor
            imagePath="/content/test.png"
            hotspots={[regionHotspot]}
            onChange={onChange}
            selectedId={null}
            onSelectedIdChange={vi.fn()}
          />
        </AppTheme>,
      );
    });

    const properties = container.querySelector(".hotspot-editor-properties");
    expect(properties?.classList.contains("hotspot-editor-properties--empty")).toBe(true);
    expect(container.textContent).toContain("Выберите метку");
    expect(container.textContent).not.toContain("Подпись");
  });

  it("deselects hotspot on Escape key", () => {
    const onSelectedIdChange = vi.fn();
    act(() => {
      root.render(
        <AppTheme>
          <HotspotEditor
            imagePath="/content/test.png"
            hotspots={[regionHotspot]}
            onChange={onChange}
            selectedId={regionHotspot.id}
            onSelectedIdChange={onSelectedIdChange}
          />
        </AppTheme>,
      );
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(onSelectedIdChange).toHaveBeenCalledWith(null);
  });

  it("toggles selection off when clicking active list item", () => {
    const onSelectedIdChange = vi.fn();
    act(() => {
      root.render(
        <AppTheme>
          <HotspotEditor
            imagePath="/content/test.png"
            hotspots={[regionHotspot]}
            onChange={onChange}
            selectedId={regionHotspot.id}
            onSelectedIdChange={onSelectedIdChange}
          />
        </AppTheme>,
      );
    });

    const activeRow = container.querySelector(".hotspot-editor-list-item-active");
    act(() => {
      activeRow?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSelectedIdChange).toHaveBeenCalledWith(null);
  });
});
