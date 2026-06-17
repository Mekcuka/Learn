import { describe, expect, it } from "vitest";

import {
  clampPan,
  clampZoom,
  panForZoomAtPoint,
  panToCenterHotspot,
  toggleHotspotSelection,
} from "./screenshotViewport";

describe("screenshotViewport", () => {
  it("clamps zoom to step and bounds", () => {
    expect(clampZoom(1.1)).toBe(1);
    expect(clampZoom(1.26)).toBe(1.25);
    expect(clampZoom(4)).toBe(3);
  });

  it("resets pan when zoom is 100%", () => {
    expect(clampPan(120, -80, 1, 800, 450)).toEqual({ panX: 0, panY: 0 });
  });

  it("clears pan when zoom returns to 100%", () => {
    const pan = panForZoomAtPoint(-200, -100, 2, 1, 400, 200, 800, 400);
    expect(pan).toEqual({ panX: 0, panY: 0 });
  });

  it("keeps focal point stable when zooming", () => {
    const pan = panForZoomAtPoint(0, 0, 1, 2, 400, 200, 800, 400);
    expect(pan.panX).toBe(-400);
    expect(pan.panY).toBe(-200);
  });

  it("centers hotspot toward visible area", () => {
    const pan = panToCenterHotspot(
      { x_pct: 70, y_pct: 10, width_pct: 10, height_pct: 10 },
      2,
      800,
      400,
    );
    expect(pan.panX).toBeLessThan(0);
    expect(pan.panY).toBeGreaterThan(0);
  });

  it("toggles hotspot selection", () => {
    expect(toggleHotspotSelection(null, "a")).toBe("a");
    expect(toggleHotspotSelection("a", "a")).toBeNull();
    expect(toggleHotspotSelection("a", "b")).toBe("b");
  });
});
