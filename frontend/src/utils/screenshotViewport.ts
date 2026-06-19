import type { HotspotItem } from "../types/lesson";

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.25;

export function clampZoom(zoom: number): number {
  const stepped = Math.round(zoom / ZOOM_STEP) * ZOOM_STEP;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, stepped));
}

export function clampPan(
  panX: number,
  panY: number,
  zoom: number,
  containerWidth: number,
  containerHeight: number,
): { panX: number; panY: number } {
  if (zoom <= 1 || containerWidth <= 0 || containerHeight <= 0) {
    return { panX: 0, panY: 0 };
  }

  const maxPanX = ((zoom - 1) * containerWidth) / 2;
  const maxPanY = ((zoom - 1) * containerHeight) / 2;
  return {
    panX: Math.min(maxPanX, Math.max(-maxPanX, panX)),
    panY: Math.min(maxPanY, Math.max(-maxPanY, panY)),
  };
}

export function panForZoomAtPoint(
  panX: number,
  panY: number,
  currentZoom: number,
  nextZoom: number,
  focalX: number,
  focalY: number,
  containerWidth: number,
  containerHeight: number,
): { panX: number; panY: number } {
  if (nextZoom <= MIN_ZOOM) {
    return { panX: 0, panY: 0 };
  }

  if (currentZoom === nextZoom) {
    return clampPan(panX, panY, nextZoom, containerWidth, containerHeight);
  }

  const ratio = nextZoom / currentZoom;
  const rawPanX = focalX - (focalX - panX) * ratio;
  const rawPanY = focalY - (focalY - panY) * ratio;
  return clampPan(rawPanX, rawPanY, nextZoom, containerWidth, containerHeight);
}

export function panToCenterHotspot(
  hotspot: Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct">,
  zoom: number,
  containerWidth: number,
  containerHeight: number,
): { panX: number; panY: number } {
  const centerX = ((hotspot.x_pct + hotspot.width_pct / 2) / 100) * containerWidth;
  const centerY = ((hotspot.y_pct + hotspot.height_pct / 2) / 100) * containerHeight;
  const rawPanX = containerWidth / 2 - centerX * zoom;
  const rawPanY = containerHeight / 2 - centerY * zoom;
  return clampPan(rawPanX, rawPanY, zoom, containerWidth, containerHeight);
}

/** Zoom level that fits the hotspot rect in the viewport (with padding). */
export function computeZoomToFitHotspot(
  hotspot: Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct">,
  containerWidth: number,
  containerHeight: number,
  padding = 0.88,
): number {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return MIN_ZOOM;
  }
  const rectW = (hotspot.width_pct / 100) * containerWidth;
  const rectH = (hotspot.height_pct / 100) * containerHeight;
  if (rectW <= 0 || rectH <= 0) {
    return MAX_ZOOM;
  }
  const zoomW = (containerWidth * padding) / rectW;
  const zoomH = (containerHeight * padding) / rectH;
  return clampZoom(Math.min(zoomW, zoomH));
}

export function viewportForHotspotZoom(
  hotspot: Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct">,
  containerWidth: number,
  containerHeight: number,
): { zoom: number; panX: number; panY: number } {
  const zoom = computeZoomToFitHotspot(hotspot, containerWidth, containerHeight);
  const pan = panToCenterHotspot(hotspot, zoom, containerWidth, containerHeight);
  return { zoom, panX: pan.panX, panY: pan.panY };
}

export function toggleHotspotSelection(currentId: string | null, hotspotId: string): string | null {
  return currentId === hotspotId ? null : hotspotId;
}
