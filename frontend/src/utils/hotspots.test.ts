import { describe, expect, it } from "vitest";

import {
  clampPercent,
  defaultHotspotFillColor,
  defaultHotspotLabel,
  getHotspotBorderColor,
  getHotspotFillColor,
  getHotspotFillEnabled,
  getHotspotKind,
  hotspotKindLabel,
  hotspotPinFillProps,
  hotspotPulseAccentStyle,
  hotspotRectVisualStyle,
  isHotspotInBounds,
  hasPinLabel,
  isPinHotspot,
  isRectHotspot,
  isZoomHotspot,
  pinHotspotAriaLabel,
  pinRectAtPoint,
  PIN_SIZE_PCT,
  resolveCalloutMaxWidth,
  resolveCalloutSide,
  resolveZoneLabelPlacement,
  shouldFlipCallout,
  stripInlineFontSizeFromHtml,
  PIN_CALLOUT_FLIP_THRESHOLD_PCT,
  ZONE_LABEL_EDGE_THRESHOLD_PCT,
  ZONE_LABEL_TOP_THRESHOLD_PCT,
  toPercent,
} from "./hotspots";

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

  it("defaults missing kind to region", () => {
    expect(getHotspotKind({})).toBe("region");
    expect(isRectHotspot({})).toBe(true);
    expect(isPinHotspot({ kind: "pin" })).toBe(true);
    expect(isZoomHotspot({ kind: "zoom" })).toBe(true);
  });

  it("returns Russian kind labels", () => {
    expect(hotspotKindLabel("region")).toBe("Зона");
    expect(hotspotKindLabel("zoom")).toBe("Увеличение");
    expect(hotspotKindLabel("pin")).toBe("Метка");
    expect(defaultHotspotLabel("zoom")).toBe("Увеличение");
  });

  it("detects pin label text and aria fallback", () => {
    expect(hasPinLabel("Кнопка")).toBe(true);
    expect(hasPinLabel("  ")).toBe(false);
    expect(hasPinLabel(undefined)).toBe(false);
    expect(pinHotspotAriaLabel("Вход")).toBe("Вход");
    expect(pinHotspotAriaLabel("")).toBe("Метка");
  });

  it("creates pin rect centered on point", () => {
    const rect = pinRectAtPoint(50, 50);
    expect(rect.width_pct).toBe(PIN_SIZE_PCT);
    expect(rect.height_pct).toBe(PIN_SIZE_PCT);
    expect(rect.x_pct + rect.width_pct / 2).toBeCloseTo(50);
    expect(rect.y_pct + rect.height_pct / 2).toBeCloseTo(50);
    expect(isHotspotInBounds(rect)).toBe(true);
  });

  it("defaults fill color by hotspot kind", () => {
    expect(defaultHotspotFillColor("region")).toBe("yellow");
    expect(defaultHotspotFillColor("zoom")).toBe("blue");
    expect(defaultHotspotFillColor("pin")).toBe("blue");
    expect(getHotspotFillColor({ kind: "region" })).toBe("yellow");
    expect(getHotspotFillColor({ kind: "pin" })).toBe("blue");
    expect(getHotspotFillColor({ kind: "zoom", fill_color: "green" })).toBe("green");
  });

  it("treats missing fill_enabled as enabled", () => {
    expect(getHotspotFillEnabled({})).toBe(true);
    expect(getHotspotFillEnabled({ fill_enabled: false })).toBe(false);
  });

  it("builds pin fill props with accent css variable", () => {
    const hotspot = {
      id: "pin-1",
      label: "Метка",
      kind: "pin" as const,
      x_pct: 10,
      y_pct: 10,
      width_pct: 2,
      height_pct: 2,
      fill_color: "green" as const,
    };

    const props = hotspotPinFillProps(hotspot);
    expect(props.className).toBe("hotspot-pin-filled");
    expect((props.style as Record<string, string>)["--hotspot-pin-accent"]).toBe("#22c55e");
    expect((props.style as Record<string, string>)["--hotspot-pulse-accent"]).toBe("#22c55e");

    const disabled = hotspotPinFillProps({ ...hotspot, fill_enabled: false });
    expect(disabled.className).toBe("");
    expect(disabled.style).toEqual({});
  });

  it("builds rect visual style with fill toggle, fill and border palette", () => {
    const hotspot = {
      id: "zone-1",
      label: "Зона",
      x_pct: 10,
      y_pct: 10,
      width_pct: 20,
      height_pct: 10,
      fill_color: "green" as const,
      border_color: "purple" as const,
    };

    expect(hotspotRectVisualStyle(hotspot).background).toBe("rgb(34 197 94 / 18%)");
    expect(hotspotRectVisualStyle(hotspot).borderColor).toBe("#a855f7");
    expect((hotspotRectVisualStyle(hotspot) as Record<string, string>)["--hotspot-pulse-accent"]).toBe("#a855f7");
    expect(hotspotPulseAccentStyle({ kind: "region", fill_color: "green", border_color: "purple" })).toEqual({
      "--hotspot-pulse-accent": "#a855f7",
    });
    expect(hotspotRectVisualStyle({ ...hotspot, fill_enabled: false }).background).toBe("transparent");
    expect(hotspotRectVisualStyle(hotspot, true).background).toBe("rgb(34 197 94 / 30%)");
    expect(getHotspotBorderColor({ kind: "region", fill_color: "green" })).toBe("green");
    expect(getHotspotBorderColor({ kind: "region", fill_color: "green", border_color: "red" })).toBe("red");
  });

  it("applies pin accent from border_color when fill is disabled", () => {
    const hotspot = {
      id: "pin-1",
      label: "Метка",
      kind: "pin" as const,
      x_pct: 10,
      y_pct: 10,
      width_pct: 2,
      height_pct: 2,
      fill_enabled: false,
      border_color: "purple" as const,
    };

    const props = hotspotPinFillProps(hotspot);
    expect(props.className).toBe("hotspot-pin-filled");
    expect((props.style as Record<string, string>)["--hotspot-pin-accent"]).toBe("#a855f7");
  });

  it("resolves callout max width presets", () => {
    expect(resolveCalloutMaxWidth("compact")).toBe("8rem");
    expect(resolveCalloutMaxWidth("wide")).toBe("16rem");
    expect(resolveCalloutMaxWidth()).toBe("11rem");
  });

  it("resolves callout side with auto flip and explicit override", () => {
    expect(resolveCalloutSide(undefined, 30)).toBe("right");
    expect(resolveCalloutSide("auto", PIN_CALLOUT_FLIP_THRESHOLD_PCT)).toBe("left");
    expect(resolveCalloutSide("auto", PIN_CALLOUT_FLIP_THRESHOLD_PCT - 1)).toBe("right");
    expect(resolveCalloutSide("top", PIN_CALLOUT_FLIP_THRESHOLD_PCT)).toBe("top");
    expect(shouldFlipCallout(PIN_CALLOUT_FLIP_THRESHOLD_PCT)).toBe(true);
  });

  it("resolves zone label placement near viewport edges", () => {
    expect(resolveZoneLabelPlacement(0.85, 20, 8, 6)).toBe("start");
    expect(resolveZoneLabelPlacement(88, 20, 10, 6)).toBe("end");
    expect(resolveZoneLabelPlacement(40, ZONE_LABEL_TOP_THRESHOLD_PCT - 1, 10, 6)).toBe("below-center");
    expect(
      resolveZoneLabelPlacement(1, ZONE_LABEL_TOP_THRESHOLD_PCT - 1, 8, 6),
    ).toBe("below-start");
    expect(
      resolveZoneLabelPlacement(100 - ZONE_LABEL_EDGE_THRESHOLD_PCT, ZONE_LABEL_TOP_THRESHOLD_PCT - 1, 10, 6),
    ).toBe("below-end");
    expect(resolveZoneLabelPlacement(40, 30, 12, 8)).toBe("center");
  });

  it("strips inline font-size from hotspot description HTML for canvas preview", () => {
    const html = '<p><span style="font-size: 24px">Подсказка</span></p>';
    expect(stripInlineFontSizeFromHtml(html)).not.toMatch(/font-size/i);
    expect(stripInlineFontSizeFromHtml(html)).toContain("Подсказка");
    expect(stripInlineFontSizeFromHtml("")).toBe("");
  });
});
