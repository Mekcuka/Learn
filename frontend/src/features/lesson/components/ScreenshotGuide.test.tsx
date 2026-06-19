/**
 * @vitest-environment jsdom
 */
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HotspotItem } from "../../../types/lesson";
import AppTheme from "../../../components/mui/AppTheme";
import ScreenshotGuide from "./ScreenshotGuide";

const focusHotspot = vi.fn();

vi.mock("../hooks/useScreenshotViewport", () => ({
  useScreenshotViewport: () => ({
    containerRef: { current: document.createElement("div") },
    frameRef: { current: document.createElement("div") },
    zoom: 1,
    pan: { x: 0, y: 0 },
    canZoomIn: true,
    canZoomOut: false,
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    reset: vi.fn(),
    panBy: vi.fn(),
    focusHotspot,
    focusHotspotZoom: vi.fn(),
    handleWheel: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
  }),
}));

vi.mock("./ScreenshotHotspotOverlay", () => ({
  default: ({
    children,
    imagePath,
    imageAlt,
  }: {
    children: ReactNode;
    imagePath: string;
    imageAlt?: string;
  }) => (
    <>
      <img src={imagePath} alt={imageAlt ?? ""} className="screenshot-image" />
      <div className="screenshot-overlay" style={{ inset: 0 }}>
        {children}
      </div>
    </>
  ),
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

const zoomHotspot: HotspotItem = {
  id: "zoom-1",
  label: "Увеличение",
  kind: "zoom",
  x_pct: 40,
  y_pct: 30,
  width_pct: 20,
  height_pct: 15,
};

const pinHotspot: HotspotItem = {
  id: "pin-1",
  label: "Метка",
  kind: "pin",
  x_pct: 70,
  y_pct: 10,
  width_pct: 4,
  height_pct: 4,
  description_html: "<p>Нажмите на кнопку входа</p>",
};

function ControlledGuide({ hotspots, initialHotspotId = null }: { hotspots: HotspotItem[]; initialHotspotId?: string | null }) {
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(initialHotspotId);
  return (
    <ScreenshotGuide
      imagePath="/screenshot.png"
      alt="Тестовый экран"
      hotspots={hotspots}
      activeHotspotId={activeHotspotId}
      onHotspotSelect={setActiveHotspotId}
    />
  );
}

function renderGuide(
  root: Root,
  props: {
    hotspots: HotspotItem[];
    activeHotspotId?: string | null;
    onHotspotSelect?: (id: string | null) => void;
    controlled?: boolean;
  },
) {
  act(() => {
    root.render(
      <AppTheme>
        {props.controlled ? (
          <ControlledGuide hotspots={props.hotspots} initialHotspotId={props.activeHotspotId} />
        ) : (
          <ScreenshotGuide
            imagePath="/screenshot.png"
            alt="Тестовый экран"
            hotspots={props.hotspots}
            activeHotspotId={props.activeHotspotId}
            onHotspotSelect={props.onHotspotSelect}
          />
        )}
      </AppTheme>,
    );
  });
}

describe("ScreenshotGuide hotspot clicks", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    focusHotspot.mockClear();
    sessionStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.body.querySelectorAll(".zoom-hotspot-overlay, .MuiPopover-root").forEach((node) => node.remove());
  });

  it("does not viewport-zoom on region hotspot click", () => {
    renderGuide(root, { hotspots: [regionHotspot], controlled: true });

    const button = container.querySelector<HTMLButtonElement>(".hotspot");
    expect(button).not.toBeNull();

    act(() => {
      button?.click();
    });

    expect(focusHotspot).not.toHaveBeenCalled();
    expect(container.querySelector(".hotspot-active")).not.toBeNull();
  });

  it("shows pin callout with connector on click, not on initial load", () => {
    renderGuide(root, { hotspots: [pinHotspot], controlled: true });

    const button = container.querySelector<HTMLButtonElement>(".hotspot-pin");
    expect(button).not.toBeNull();
    expect(button?.querySelector(".hotspot-pin-callout")).toBeNull();
    expect(button?.querySelector(".hotspot-pin-dot")).not.toBeNull();

    act(() => {
      button?.click();
    });

    expect(focusHotspot).not.toHaveBeenCalled();
    expect(button?.classList.contains("hotspot-pin-active")).toBe(true);
    expect(button?.querySelector(".hotspot-pin-callout")).not.toBeNull();
    expect(button?.querySelector(".hotspot-pin-callout-html")?.textContent).toBe("Нажмите на кнопку входа");
    expect(button?.querySelector(".hotspot-pin-callout-text")).toBeNull();
    expect(button?.querySelector(".hotspot-pin-connector")).not.toBeNull();
    expect(document.body.querySelector(".hotspot-pin-popover")).toBeNull();
  });

  it("toggles pin callout off on second click", () => {
    renderGuide(root, { hotspots: [pinHotspot], controlled: true, activeHotspotId: "pin-1" });

    let button = container.querySelector<HTMLButtonElement>(".hotspot-pin");
    expect(button?.querySelector(".hotspot-pin-callout")).not.toBeNull();

    act(() => {
      button?.click();
    });

    button = container.querySelector<HTMLButtonElement>(".hotspot-pin");
    expect(button?.classList.contains("hotspot-pin-active")).toBe(false);
    expect(button?.querySelector(".hotspot-pin-callout")).toBeNull();
  });

  it("renders pin without description or label as dot only", () => {
    renderGuide(root, {
      hotspots: [{ ...pinHotspot, id: "pin-empty", label: "   ", description_html: "  " }],
    });

    const button = container.querySelector<HTMLButtonElement>(".hotspot-pin");
    expect(button).not.toBeNull();
    expect(button?.querySelector(".hotspot-pin-callout")).toBeNull();
    expect(button?.querySelector(".hotspot-pin-callout-box")).toBeNull();
    expect(button?.querySelector(".hotspot-pin-dot")).not.toBeNull();
    expect(button?.getAttribute("aria-label")).toBe("Метка");
  });

  it("opens centered zoom popup for zoom hotspot without viewport zoom", () => {
    renderGuide(root, { hotspots: [zoomHotspot], controlled: true });

    const button = container.querySelector<HTMLButtonElement>(".hotspot--zoom");
    expect(button).not.toBeNull();

    act(() => {
      button?.click();
    });

    expect(focusHotspot).not.toHaveBeenCalled();
    expect(container.querySelector(".zoom-hotspot-overlay--interactive")).not.toBeNull();
    expect(container.querySelector(".zoom-hotspot-crop")).not.toBeNull();
    expect(container.querySelector(".screenshot-viewport-clip .zoom-hotspot-overlay")).not.toBeNull();
  });

  it("does not viewport-zoom when activeHotspotId changes externally", () => {
    const onHotspotSelect = vi.fn();
    renderGuide(root, {
      hotspots: [regionHotspot],
      activeHotspotId: null,
      onHotspotSelect,
    });

    renderGuide(root, {
      hotspots: [regionHotspot],
      activeHotspotId: "region-1",
      onHotspotSelect,
    });

    expect(focusHotspot).not.toHaveBeenCalled();
    expect(container.querySelector(".hotspot-active")).not.toBeNull();
  });

  it("renders custom fill color and disabled fill", () => {
    renderGuide(root, {
      hotspots: [{ ...regionHotspot, fill_color: "green" }],
    });

    const button = container.querySelector<HTMLButtonElement>(".hotspot");
    expect(button?.style.background).toContain("34");
    expect(button?.style.background).toContain("197");
    expect(button?.style.borderColor).toContain("34");

    renderGuide(root, {
      hotspots: [{ ...regionHotspot, fill_enabled: false }],
    });

    const noFillButton = container.querySelector<HTMLButtonElement>(".hotspot");
    expect(noFillButton?.style.background).toBe("transparent");
  });

  it("applies pin fill accent via css variable", () => {
    renderGuide(root, {
      hotspots: [{ ...pinHotspot, fill_color: "green" }],
      controlled: true,
      activeHotspotId: "pin-1",
    });

    const button = container.querySelector<HTMLButtonElement>(".hotspot-pin");
    expect(button?.classList.contains("hotspot-pin-filled")).toBe(true);
    expect(button?.style.getPropertyValue("--hotspot-pin-accent")).toBe("#22c55e");

    renderGuide(root, {
      hotspots: [{ ...pinHotspot, fill_enabled: false }],
    });

    const noFillPin = container.querySelector<HTMLButtonElement>(".hotspot-pin");
    expect(noFillPin?.classList.contains("hotspot-pin-filled")).toBe(false);
  });
});
