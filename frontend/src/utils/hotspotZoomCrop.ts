import type { CSSProperties } from "react";

import type { HotspotItem } from "../types/lesson";

/** Minimum hotspot dimension (%) to avoid division by zero in crop math. */
const MIN_PCT = 0.1;

/** Cap width/height below 100% so background-position % denominators stay negative. */
const MAX_PCT = 99.9;

export type HotspotCropOptions = {
  /** naturalWidth / naturalHeight — required for undistorted crop aspect. */
  imageAspectRatio?: number;
};

/**
 * Pixel aspect of the hotspot region on the source image.
 * Hotspot % coords are relative to image width/height independently.
 */
export function getHotspotRegionAspectRatio(
  hotspot: Pick<HotspotItem, "width_pct" | "height_pct">,
  imageAspectRatio = 1,
): number {
  const safeW = Math.min(Math.max(hotspot.width_pct, MIN_PCT), MAX_PCT);
  const safeH = Math.min(Math.max(hotspot.height_pct, MIN_PCT), MAX_PCT);
  return (safeW / safeH) * imageAspectRatio;
}

/**
 * CSS background-position percentages align a point on the image with the same
 * point on the container: offset = (container - image) * pos / 100.
 * Solve for pos so hotspot origin (x_pct, y_pct) lands at the container origin.
 */
function cropBackgroundPositionPct(coordPct: number, spanPct: number): number {
  const safeSpan = Math.min(Math.max(spanPct, MIN_PCT), MAX_PCT);
  const scale = 100 / safeSpan;
  return (100 * coordPct * scale) / (100 * scale - 100);
}

export function getHotspotCropBackgroundStyle(
  hotspot: Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct">,
  options: HotspotCropOptions = {},
): CSSProperties {
  const { x_pct, y_pct, width_pct, height_pct } = hotspot;
  const imageAspectRatio = options.imageAspectRatio ?? 1;
  const safeW = Math.min(Math.max(width_pct, MIN_PCT), MAX_PCT);
  const safeH = Math.min(Math.max(height_pct, MIN_PCT), MAX_PCT);
  const uniformScalePct = (100 / safeW) * 100;

  return {
    aspectRatio: getHotspotRegionAspectRatio(hotspot, imageAspectRatio),
    backgroundSize: `${uniformScalePct}% auto`,
    backgroundPosition: `${cropBackgroundPositionPct(x_pct, safeW)}% ${cropBackgroundPositionPct(y_pct, safeH)}%`,
    backgroundRepeat: "no-repeat",
  };
}
