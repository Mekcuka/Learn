import { describe, expect, it } from "vitest";

import { clampPercent, isHotspotInBounds, toPercent } from "./hotspots";

describe("hotspot utils", () => {
  it("converts pixels to percent", () => {
    expect(toPercent(50, 200)).toBe(25);
  });

  it("clamps percent values", () => {
    expect(clampPercent(120)).toBe(100);
    expect(clampPercent(-5)).toBe(0);
  });

  it("validates hotspot bounds", () => {
    expect(
      isHotspotInBounds({ x_pct: 10, y_pct: 10, width_pct: 20, height_pct: 15 }),
    ).toBe(true);
    expect(
      isHotspotInBounds({ x_pct: 90, y_pct: 10, width_pct: 20, height_pct: 15 }),
    ).toBe(false);
  });
});
