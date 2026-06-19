import { describe, expect, it } from "vitest";

import { getHotspotCropBackgroundStyle, getHotspotRegionAspectRatio } from "./hotspotZoomCrop";

describe("getHotspotRegionAspectRatio", () => {
  it("multiplies hotspot pct aspect by image aspect ratio", () => {
    expect(
      getHotspotRegionAspectRatio({ width_pct: 30, height_pct: 15 }, 16 / 9),
    ).toBeCloseTo(3.555555, 5);
  });

  it("defaults to pct-only aspect when image aspect is 1", () => {
    expect(getHotspotRegionAspectRatio({ width_pct: 25, height_pct: 50 }, 1)).toBe(0.5);
  });
});

describe("getHotspotCropBackgroundStyle", () => {
  it("scales background uniformly so hotspot rect fills the crop container", () => {
    const style = getHotspotCropBackgroundStyle({
      x_pct: 20,
      y_pct: 10,
      width_pct: 25,
      height_pct: 50,
    });

    expect(style.aspectRatio).toBe(0.5);
    expect(style.backgroundSize).toBe("400% auto");
    const [posX, posY] = String(style.backgroundPosition).replace(/%/g, "").split(" ");
    expect(Number(posX)).toBeCloseTo(2000 / 75, 6);
    expect(Number(posY)).toBeCloseTo(20, 6);
    expect(style.backgroundRepeat).toBe("no-repeat");
  });

  it("uses image aspect ratio for crop container proportions", () => {
    const imageAspectRatio = 16 / 9;
    const style = getHotspotCropBackgroundStyle(
      {
        x_pct: 10,
        y_pct: 20,
        width_pct: 30,
        height_pct: 15,
      },
      { imageAspectRatio },
    );

    expect(style.aspectRatio).toBeCloseTo(3.555555, 5);
    expect(style.backgroundSize).toBe(`${(100 / 30) * 100}% auto`);
  });

  it("keeps independent X/Y background-size only when image aspect is square", () => {
    const style = getHotspotCropBackgroundStyle({
      x_pct: 29.36,
      y_pct: 12,
      width_pct: 16.1,
      height_pct: 9.1,
    });

    expect(style.backgroundSize).toBe(`${(100 / 16.1) * 100}% auto`);
  });

  it("guards against zero-sized hotspot dimensions", () => {
    const style = getHotspotCropBackgroundStyle({
      x_pct: 0,
      y_pct: 0,
      width_pct: 0,
      height_pct: 0,
    });

    expect(style.backgroundSize).toBe("100000% auto");
    expect(style.backgroundPosition).toBe("0% 0%");
  });

  it("aligns hotspot top-left with container for orientation-like zoom region", () => {
    const imageAspectRatio = 1920 / 1080;
    const style = getHotspotCropBackgroundStyle(
      {
        x_pct: 29.36,
        y_pct: 12,
        width_pct: 16.1,
        height_pct: 9.1,
      },
      { imageAspectRatio },
    );

    const scaleW = 100 / 16.1;
    expect(style.backgroundSize).toBe(`${scaleW * 100}% auto`);
    expect(style.aspectRatio).toBeCloseTo((16.1 / 9.1) * imageAspectRatio, 5);

    const posX = (100 * 29.36 * scaleW) / (scaleW * 100 - 100);
    const posY = (100 * 12 * (100 / 9.1)) / ((100 / 9.1) * 100 - 100);
    const [actualX, actualY] = String(style.backgroundPosition).replace(/%/g, "").split(" ");
    expect(Number(actualX)).toBeCloseTo(posX, 6);
    expect(Number(actualY)).toBeCloseTo(posY, 6);
  });
});
