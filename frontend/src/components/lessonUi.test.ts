import { describe, expect, it } from "vitest";

describe("hotspot coordinates", () => {
  it("uses percentage-based layout values", () => {
    const hotspot = {
      x_pct: 85.2,
      y_pct: 12,
      width_pct: 10.5,
      height_pct: 4.2,
    };
    expect(hotspot.x_pct + hotspot.width_pct).toBeLessThanOrEqual(100);
    expect(hotspot.y_pct + hotspot.height_pct).toBeLessThanOrEqual(100);
  });
});

describe("slide navigation", () => {
  it("clamps slide index within bounds", () => {
    const total = 3;
    const clamp = (index: number) => Math.max(0, Math.min(index, total - 1));
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(2);
    expect(clamp(5)).toBe(2);
  });
});
