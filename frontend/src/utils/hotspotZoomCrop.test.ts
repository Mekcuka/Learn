import { describe, expect, it } from "vitest";

import {
  getHotspotCropBackgroundStyle,
  getHotspotCropViewport,
  getHotspotEdgeContainerFractions,
  getHotspotPopupSizeScale,
  getHotspotPopupStyle,
  getHotspotRegionAspectRatio,
} from "./hotspotZoomCrop";

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

describe("getHotspotCropViewport", () => {
  it("expands the crop window when zoom_scale is below 1", () => {
    expect(
      getHotspotCropViewport({
        x_pct: 20,
        y_pct: 10,
        width_pct: 25,
        height_pct: 50,
        zoom_scale: 0.5,
      }),
    ).toEqual({
      x_pct: 7.5,
      y_pct: -15,
      width_pct: 50,
      height_pct: 100,
    });
  });

  it("tightens the crop window when zoom_scale is above 1", () => {
    expect(
      getHotspotCropViewport({
        x_pct: 20,
        y_pct: 10,
        width_pct: 25,
        height_pct: 50,
        zoom_scale: 2,
      }),
    ).toEqual({
      x_pct: 26.25,
      y_pct: 22.5,
      width_pct: 12.5,
      height_pct: 25,
    });
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

  it("zooms out with a wider viewport when zoom_scale is below 1", () => {
    const style = getHotspotCropBackgroundStyle({
      x_pct: 25,
      y_pct: 25,
      width_pct: 25,
      height_pct: 50,
      zoom_scale: 0.5,
    });

    expect(style.backgroundSize).toBe("200% auto");
    expect(style.aspectRatio).toBe(0.5);
  });

  it("keeps background scale while popup grows when zoom_scale is above 1", () => {
    const atOne = getHotspotCropBackgroundStyle({
      x_pct: 20,
      y_pct: 10,
      width_pct: 25,
      height_pct: 50,
      zoom_scale: 1,
    });
    const atTwo = getHotspotCropBackgroundStyle({
      x_pct: 20,
      y_pct: 10,
      width_pct: 25,
      height_pct: 50,
      zoom_scale: 2,
    });

    expect(atTwo.backgroundSize).toBe(atOne.backgroundSize);
    expect(atTwo.aspectRatio).toBe(atOne.aspectRatio);
    expect(atTwo.backgroundPosition).toBe(atOne.backgroundPosition);
  });

  it("defaults zoom_scale to 1 when omitted", () => {
    const withDefault = getHotspotCropBackgroundStyle({
      x_pct: 20,
      y_pct: 10,
      width_pct: 25,
      height_pct: 50,
    });
    const explicit = getHotspotCropBackgroundStyle({
      x_pct: 20,
      y_pct: 10,
      width_pct: 25,
      height_pct: 50,
      zoom_scale: 1,
    });

    expect(withDefault.backgroundSize).toBe(explicit.backgroundSize);
    expect(withDefault.backgroundPosition).toBe(explicit.backgroundPosition);
  });
});

describe("getHotspotPopupSizeScale", () => {
  it("returns 1 for zoom_scale at or below 1", () => {
    expect(getHotspotPopupSizeScale({ zoom_scale: 0.5 })).toBe(1);
    expect(getHotspotPopupSizeScale({ zoom_scale: 1 })).toBe(1);
    expect(getHotspotPopupSizeScale({})).toBe(1);
  });

  it("returns zoom_scale when above 1", () => {
    expect(getHotspotPopupSizeScale({ zoom_scale: 2 })).toBe(2);
    expect(getHotspotPopupSizeScale({ zoom_scale: 3.5 })).toBe(3.5);
  });
});

describe("getHotspotPopupStyle", () => {
  it("exposes popup scale as a CSS variable when zoom_scale is above 1", () => {
    expect((getHotspotPopupStyle({ zoom_scale: 1 }) as Record<string, string>)["--zoom-hotspot-popup-scale"]).toBe("1");
    expect((getHotspotPopupStyle({ zoom_scale: 2 }) as Record<string, string>)["--zoom-hotspot-popup-scale"]).toBe("2");
  });
});

describe("getHotspotEdgeContainerFractions", () => {
  const hotspot = {
    x_pct: 29.36,
    y_pct: 12,
    width_pct: 16.1,
    height_pct: 9.1,
  };
  const imageAspectRatio = 1920 / 1080;

  it.each([0.5, 1, 2] as const)(
    "keeps the authored hotspot fully inside the popup at zoom_scale %s",
    (zoom_scale) => {
      const edges = getHotspotEdgeContainerFractions(
        { ...hotspot, zoom_scale },
        { imageAspectRatio },
      );

      expect(edges.left).toBeGreaterThanOrEqual(-0.001);
      expect(edges.top).toBeGreaterThanOrEqual(-0.001);
      expect(edges.right).toBeLessThanOrEqual(1.001);
      expect(edges.bottom).toBeLessThanOrEqual(1.001);
    },
  );

  it("keeps hotspot edges aligned with the container at zoom_scale above 1", () => {
    const edges = getHotspotEdgeContainerFractions(
      { ...hotspot, zoom_scale: 2 },
      { imageAspectRatio },
    );

    expect(edges.left).toBeCloseTo(0, 4);
    expect(edges.top).toBeCloseTo(0, 4);
    expect(edges.right).toBeCloseTo(1, 4);
    expect(edges.bottom).toBeCloseTo(1, 4);
  });

  it("centers the hotspot when zoom_scale is below 1", () => {
    const edges = getHotspotEdgeContainerFractions(
      {
        x_pct: 25,
        y_pct: 25,
        width_pct: 25,
        height_pct: 50,
        zoom_scale: 0.5,
      },
      { imageAspectRatio: 1 },
    );

    expect(edges.left).toBeCloseTo(0.25, 4);
    expect(edges.right).toBeCloseTo(0.75, 4);
    expect(edges.top).toBeCloseTo(0.25, 4);
    expect(edges.bottom).toBeCloseTo(0.75, 4);
  });

  it("maps hotspot edges exactly to the container at zoom_scale 1", () => {
    const edges = getHotspotEdgeContainerFractions(
      {
        x_pct: 20,
        y_pct: 10,
        width_pct: 25,
        height_pct: 50,
        zoom_scale: 1,
      },
      { imageAspectRatio: 1 },
    );

    expect(edges.left).toBeCloseTo(0, 5);
    expect(edges.top).toBeCloseTo(0, 5);
    expect(edges.right).toBeCloseTo(1, 5);
    expect(edges.bottom).toBeCloseTo(1, 5);
  });
});
