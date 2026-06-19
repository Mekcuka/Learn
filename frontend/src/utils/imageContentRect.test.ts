import { describe, expect, it } from "vitest";

import {
  clientDeltaToImagePercent,
  clientPointToImagePercent,
  getObjectFitContainRect,
  hotspotOverlayStyle,
  overlayStyleFromContentRect,
  pointToImagePercent,
} from "./imageContentRect";

describe("getObjectFitContainRect", () => {
  it("fills container when aspect ratios match", () => {
    expect(getObjectFitContainRect(800, 450, 1600, 900)).toEqual({
      x: 0,
      y: 0,
      width: 800,
      height: 450,
    });
  });

  it("letterboxes wider images vertically in a 16:9 frame", () => {
    expect(getObjectFitContainRect(800, 450, 1600, 1200)).toEqual({
      x: 100,
      y: 0,
      width: 600,
      height: 450,
    });
  });

  it("letterboxes taller images horizontally in a 16:9 frame", () => {
    expect(getObjectFitContainRect(800, 450, 900, 1600)).toEqual({
      x: 273.4375,
      y: 0,
      width: 253.125,
      height: 450,
    });
  });
});

describe("image hotspot coordinate mapping", () => {
  const container = { left: 100, top: 50 };
  const natural = { width: 1600, height: 1200 };

  it("maps center of letterboxed image to 50%, 50%", () => {
    const content = getObjectFitContainRect(800, 450, natural.width, natural.height);
    const centerX = container.left + content.x + content.width / 2;
    const centerY = container.top + content.y + content.height / 2;

    expect(
      clientPointToImagePercent(
        centerX,
        centerY,
        container,
        800,
        450,
        natural.width,
        natural.height,
      ),
    ).toEqual({ x_pct: 50, y_pct: 50 });
  });

  it("maps top-left of painted image to 0%, 0%", () => {
    const content = getObjectFitContainRect(800, 450, natural.width, natural.height);
    const topLeftX = container.left + content.x;
    const topLeftY = container.top + content.y;

    expect(
      clientPointToImagePercent(
        topLeftX,
        topLeftY,
        container,
        800,
        450,
        natural.width,
        natural.height,
      ),
    ).toEqual({ x_pct: 0, y_pct: 0 });
  });

  it("keeps round-trip consistency between overlay style and hotspot style", () => {
    const content = getObjectFitContainRect(640, 360, 1920, 1080);
    const overlay = overlayStyleFromContentRect(content);
    const hotspot = { x_pct: 25, y_pct: 40, width_pct: 10, height_pct: 12 };

    const absoluteLeft = Number(overlay.left) + (hotspot.x_pct / 100) * Number(overlay.width);
    const absoluteTop = Number(overlay.top) + (hotspot.y_pct / 100) * Number(overlay.height);
    const local = pointToImagePercent(absoluteLeft, absoluteTop, content);

    expect(local).toEqual({ x_pct: 25, y_pct: 40 });
    expect(hotspotOverlayStyle(hotspot, "zone")).toEqual({
      left: "25%",
      top: "40%",
      width: "10%",
      height: "12%",
    });
  });

  it("scales pointer delta by zoom when converting to image percent", () => {
    const content = getObjectFitContainRect(800, 450, 1600, 900);
    expect(clientDeltaToImagePercent(80, 45, content, 2)).toEqual({ dx: 5, dy: 5 });
  });
});
