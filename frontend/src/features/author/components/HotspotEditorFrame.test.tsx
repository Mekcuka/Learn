/**
 * @vitest-environment jsdom
 */
import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HotspotItem } from "../../../types/lesson";
import "../../../styles/author.css";
import "../../../styles/screenshot.css";
import HotspotEditorFrame from "./HotspotEditorFrame";

vi.mock("../../../hooks/useImageNaturalAspectRatio", () => ({
  useImageNaturalAspectRatio: () => 16 / 9,
}));

vi.mock("../../../components/ScreenshotHotspotOverlay", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div className="screenshot-overlay">{children}</div>
  ),
}));

const pinA: HotspotItem = {
  id: "pin-a",
  label: "Первая",
  kind: "pin",
  description_html: "<p>Первая подсказка</p>",
  x_pct: 20,
  y_pct: 30,
  width_pct: 0,
  height_pct: 0,
};

const pinB: HotspotItem = {
  id: "pin-b",
  label: "Вторая",
  kind: "pin",
  description_html: "<p>Вторая подсказка</p>",
  x_pct: 60,
  y_pct: 50,
  width_pct: 0,
  height_pct: 0,
};

const regionHotspot: HotspotItem = {
  id: "region-1",
  label: "Область",
  kind: "region",
  x_pct: 10,
  y_pct: 20,
  width_pct: 15,
  height_pct: 8,
};

const zoomHotspot: HotspotItem = {
  id: "zoom-1",
  label: "Зум",
  kind: "zoom",
  x_pct: 40,
  y_pct: 40,
  width_pct: 20,
  height_pct: 15,
};

describe("HotspotEditorFrame", () => {
  let container: HTMLDivElement;
  let root: Root;
  const noop = vi.fn();

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

  function renderFrame(
    hotspots: HotspotItem[],
    selectedId: string | null,
  ) {
    const frameRef = createRef<HTMLDivElement>();
    const containerRef = createRef<HTMLDivElement>();

    act(() => {
      root.render(
        <HotspotEditorFrame
          imagePath="/content/test.png"
          hotspots={hotspots}
          selectedId={selectedId}
          liveRect={null}
          draft={null}
          frameRef={frameRef}
          containerRef={containerRef}
          viewportTransform="translate(0px, 0px) scale(1)"
          spacePanActive={false}
          onFrameMouseDown={noop}
          onHotspotMouseDown={noop}
          onResizeMouseDown={noop}
          onWheel={noop}
        />,
      );
    });
  }

  it("shows pin callout only for the selected hotspot", () => {
    renderFrame([pinA, pinB], "pin-a");

    const pins = container.querySelectorAll(".hotspot-editor-pin");
    expect(pins).toHaveLength(2);

    expect(pins[0].classList.contains("hotspot-editor-zone-active")).toBe(true);
    expect(pins[0].querySelector(".hotspot-pin-callout")).not.toBeNull();

    expect(pins[1].classList.contains("hotspot-editor-zone-active")).toBe(false);
    expect(pins[1].querySelector(".hotspot-pin-callout")).toBeNull();
    expect(pins[1].querySelector(".hotspot-pin-dot")).not.toBeNull();
  });

  it("highlights only the selected region hotspot", () => {
    const secondRegion: HotspotItem = {
      ...regionHotspot,
      id: "region-2",
      label: "Вторая область",
      x_pct: 50,
      y_pct: 50,
    };
    renderFrame([regionHotspot, secondRegion], "region-2");

    const zones = container.querySelectorAll(".hotspot-editor-zone");
    expect(zones).toHaveLength(2);
    expect(zones[0].classList.contains("hotspot-editor-zone-active")).toBe(false);
    expect(zones[1].classList.contains("hotspot-editor-zone-active")).toBe(true);
  });

  it("shows zoom popup preview only for the selected zoom hotspot", () => {
    const secondZoom: HotspotItem = {
      ...zoomHotspot,
      id: "zoom-2",
      label: "Второй зум",
      x_pct: 70,
      y_pct: 70,
    };
    renderFrame([zoomHotspot, secondZoom], "zoom-2");

    expect(container.querySelectorAll(".zoom-hotspot-overlay")).toHaveLength(1);
    expect(container.querySelector(".zoom-hotspot-overlay--preview")).not.toBeNull();
    expect(container.querySelector(".zoom-hotspot-overlay--interactive")).toBeNull();

    const zones = container.querySelectorAll(".hotspot-editor-zone--zoom");
    expect(zones[0].classList.contains("hotspot-editor-zone-active")).toBe(false);
    expect(zones[1].classList.contains("hotspot-editor-zone-active")).toBe(true);
  });

  it("shows no callouts, highlights, or zoom preview when nothing is selected", () => {
    renderFrame([pinA, pinB, regionHotspot, zoomHotspot], null);

    expect(container.querySelectorAll(".hotspot-editor-zone-active")).toHaveLength(0);
    expect(container.querySelector(".hotspot-pin-callout")).toBeNull();
    expect(container.querySelector(".zoom-hotspot-overlay")).toBeNull();
  });
});
