import type { CSSProperties } from "react";

import type { HotspotItem } from "../types/lesson";

/** Minimum hotspot dimension (%) to avoid division by zero in crop math. */
const MIN_PCT = 0.1;

/** Cap authored hotspot width/height below 100% so background-position denominators stay valid. */
const MAX_HOTSPOT_PCT = 99.9;

function clampHotspotPct(value: number): number {
  return Math.min(Math.max(value, MIN_PCT), MAX_HOTSPOT_PCT);
}

function clampViewPct(value: number): number {
  return Math.max(value, MIN_PCT);
}

export const DEFAULT_ZOOM_SCALE = 1;
export const MIN_ZOOM_SCALE = 0.5;
export const MAX_ZOOM_SCALE = 5;

/** Base popup width cap (px) at zoom_scale 1 — scaled up when zoom_scale > 1. */
export const ZOOM_HOTSPOT_POPUP_BASE_MAX_PX = 420;

export function clampZoomScale(value: number): number {
  return Math.min(MAX_ZOOM_SCALE, Math.max(MIN_ZOOM_SCALE, value));
}

export function getHotspotZoomScale(hotspot: Pick<HotspotItem, "zoom_scale">): number {
  if (hotspot.zoom_scale == null || !Number.isFinite(hotspot.zoom_scale)) {
    return DEFAULT_ZOOM_SCALE;
  }
  return clampZoomScale(hotspot.zoom_scale);
}

/**
 * Popup pixel scale vs zoom_scale 1. Values below 1 only widen the crop window;
 * the base popup size is kept. Above 1 the popup grows so the magnified hotspot fits.
 */
export function getHotspotPopupSizeScale(hotspot: Pick<HotspotItem, "zoom_scale">): number {
  return Math.max(1, getHotspotZoomScale(hotspot));
}

export function getHotspotPopupStyle(
  hotspot: Pick<HotspotItem, "zoom_scale">,
): CSSProperties {
  const scale = getHotspotPopupSizeScale(hotspot);
  return {
    "--zoom-hotspot-popup-scale": String(scale),
  } as CSSProperties;
}

export type HotspotCropOptions = {
  /** naturalWidth / naturalHeight — required for undistorted crop aspect. */
  imageAspectRatio?: number;
};

export type HotspotCropViewport = {
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
};

/**
 * Pixel aspect of the hotspot region on the source image.
 * Hotspot % coords are relative to image width/height independently.
 */
export function getHotspotRegionAspectRatio(
  hotspot: Pick<HotspotItem, "width_pct" | "height_pct">,
  imageAspectRatio = 1,
): number {
  const safeW = clampViewPct(hotspot.width_pct);
  const safeH = clampViewPct(hotspot.height_pct);
  return (safeW / safeH) * imageAspectRatio;
}

/**
 * Visible image window for the popup crop, centered on the hotspot.
 * zoom_scale 1 — hotspot fills the popup; > 1 — tighter crop (stronger zoom); < 1 — wider window (more context).
 */
export function getHotspotCropViewport(
  hotspot: Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct" | "zoom_scale">,
): HotspotCropViewport {
  const zoomScale = getHotspotZoomScale(hotspot);
  const safeW = clampHotspotPct(hotspot.width_pct);
  const safeH = clampHotspotPct(hotspot.height_pct);
  const viewW = safeW / zoomScale;
  const viewH = safeH / zoomScale;

  return {
    x_pct: hotspot.x_pct + (safeW - viewW) / 2,
    y_pct: hotspot.y_pct + (safeH - viewH) / 2,
    width_pct: viewW,
    height_pct: viewH,
  };
}

/** Background width ÷ container width for `background-size: X% auto`. */
export function getHotspotCropBackgroundWidthRatio(viewWidthPct: number): number {
  const safeW = clampViewPct(viewWidthPct);
  return 100 / safeW;
}

/** Background height ÷ container height for `background-size: X% auto`. */
export function getHotspotCropBackgroundHeightRatio(
  view: Pick<HotspotCropViewport, "width_pct" | "height_pct">,
): number {
  const safeW = clampViewPct(view.width_pct);
  const safeH = clampViewPct(view.height_pct);
  const bgWidthRatio = getHotspotCropBackgroundWidthRatio(safeW);
  return bgWidthRatio * (safeW / safeH);
}

/**
 * CSS background-position percentages align a point on the image with the same
 * point on the container: offset = (container - image) * pos / 100.
 * Solve for pos so viewport origin (x_pct, y_pct) lands at the container origin.
 */
export function cropBackgroundPositionPct(
  coordPct: number,
  backgroundToContainerRatio: number,
): number {
  const ratio = backgroundToContainerRatio;
  if (Math.abs(ratio - 1) < 1e-9) {
    return 0;
  }
  return (coordPct * ratio) / (ratio - 1);
}

/** Map authored hotspot edge % coords to normalized container fractions [0–1]. */
function getHotspotCropBackgroundRatios(
  hotspot: Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct" | "zoom_scale">,
): { view: HotspotCropViewport; bgWidthRatio: number; bgHeightRatio: number; zoomScale: number } {
  const zoomScale = getHotspotZoomScale(hotspot);
  const view = getHotspotCropViewport(hotspot);
  const safeW = clampHotspotPct(hotspot.width_pct);
  const safeH = clampHotspotPct(hotspot.height_pct);

  if (zoomScale > 1) {
    const bgWidthRatio = getHotspotCropBackgroundWidthRatio(safeW);
    const bgHeightRatio = getHotspotCropBackgroundHeightRatio({
      width_pct: safeW,
      height_pct: safeH,
    });
    return { view, bgWidthRatio, bgHeightRatio, zoomScale };
  }

  const bgWidthRatio = getHotspotCropBackgroundWidthRatio(view.width_pct);
  const bgHeightRatio = getHotspotCropBackgroundHeightRatio(view);
  return { view, bgWidthRatio, bgHeightRatio, zoomScale };
}

function getHotspotCropAnchor(
  hotspot: Pick<HotspotItem, "x_pct" | "y_pct" | "zoom_scale">,
  view: HotspotCropViewport,
  zoomScale: number,
): Pick<HotspotCropViewport, "x_pct" | "y_pct"> {
  if (zoomScale > 1) {
    return { x_pct: hotspot.x_pct, y_pct: hotspot.y_pct };
  }
  return { x_pct: view.x_pct, y_pct: view.y_pct };
}

export function getHotspotEdgeContainerFractions(
  hotspot: Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct" | "zoom_scale">,
  _options: HotspotCropOptions = {},
): { left: number; top: number; right: number; bottom: number } {
  const { view, bgWidthRatio, bgHeightRatio, zoomScale } = getHotspotCropBackgroundRatios(hotspot);
  const safeW = clampHotspotPct(hotspot.width_pct);
  const safeH = clampHotspotPct(hotspot.height_pct);
  const anchor = getHotspotCropAnchor(hotspot, view, zoomScale);

  const posX = cropBackgroundPositionPct(anchor.x_pct, bgWidthRatio);
  const posY = cropBackgroundPositionPct(anchor.y_pct, bgHeightRatio);

  return {
    left: (posX / 100) * (1 - bgWidthRatio) + (hotspot.x_pct / 100) * bgWidthRatio,
    top: (posY / 100) * (1 - bgHeightRatio) + (hotspot.y_pct / 100) * bgHeightRatio,
    right:
      (posX / 100) * (1 - bgWidthRatio) + ((hotspot.x_pct + safeW) / 100) * bgWidthRatio,
    bottom:
      (posY / 100) * (1 - bgHeightRatio) + ((hotspot.y_pct + safeH) / 100) * bgHeightRatio,
  };
}

export function getHotspotCropBackgroundStyle(
  hotspot: Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct" | "zoom_scale">,
  options: HotspotCropOptions = {},
): CSSProperties {
  const imageAspectRatio = options.imageAspectRatio ?? 1;
  const { view, bgWidthRatio, bgHeightRatio, zoomScale } = getHotspotCropBackgroundRatios(hotspot);
  const uniformScalePct = bgWidthRatio * 100;
  const aspectSource = zoomScale > 1 ? hotspot : view;
  const anchor = getHotspotCropAnchor(hotspot, view, zoomScale);

  return {
    aspectRatio: getHotspotRegionAspectRatio(aspectSource, imageAspectRatio),
    backgroundSize: `${uniformScalePct}% auto`,
    backgroundPosition: `${cropBackgroundPositionPct(anchor.x_pct, bgWidthRatio)}% ${cropBackgroundPositionPct(anchor.y_pct, bgHeightRatio)}%`,
    backgroundRepeat: "no-repeat",
  };
}
