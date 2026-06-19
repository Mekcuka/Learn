import type { CSSProperties } from "react";

/** Rendered image bounds for `object-fit: contain` inside a container. */
export type ImageContentRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ViewportTransform = {
  panX: number;
  panY: number;
  zoom: number;
};

/** Compute the painted image area when an image uses object-fit: contain. */
export function getObjectFitContainRect(
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): ImageContentRect {
  if (containerWidth <= 0 || containerHeight <= 0 || naturalWidth <= 0 || naturalHeight <= 0) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }

  const scale = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;

  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
  };
}

/** Position hotspot overlay to match the object-fit: contain content rect. */
export function overlayStyleFromContentRect(rect: ImageContentRect): CSSProperties {
  return {
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

/** Map viewport-local coordinates to image-relative hotspot percentages. */
export function pointToImagePercent(
  localX: number,
  localY: number,
  contentRect: ImageContentRect,
): { x_pct: number; y_pct: number } {
  if (contentRect.width <= 0 || contentRect.height <= 0) {
    return { x_pct: 0, y_pct: 0 };
  }

  const x_pct = ((localX - contentRect.x) / contentRect.width) * 100;
  const y_pct = ((localY - contentRect.y) / contentRect.height) * 100;

  return { x_pct, y_pct };
}

/** Map client pointer coordinates to image-relative hotspot percentages. */
export function clientPointToImagePercent(
  clientX: number,
  clientY: number,
  containerRect: Pick<DOMRect, "left" | "top">,
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
  transform: ViewportTransform = { panX: 0, panY: 0, zoom: 1 },
): { x_pct: number; y_pct: number } {
  const localX = (clientX - containerRect.left - transform.panX) / transform.zoom;
  const localY = (clientY - containerRect.top - transform.panY) / transform.zoom;
  const contentRect = getObjectFitContainRect(containerWidth, containerHeight, naturalWidth, naturalHeight);
  return pointToImagePercent(localX, localY, contentRect);
}

/** Map client pixel delta to image-relative percentage delta. */
export function clientDeltaToImagePercent(
  deltaX: number,
  deltaY: number,
  contentRect: ImageContentRect,
  zoom = 1,
): { dx: number; dy: number } {
  if (contentRect.width <= 0 || contentRect.height <= 0 || zoom <= 0) {
    return { dx: 0, dy: 0 };
  }

  return {
    dx: (deltaX / zoom / contentRect.width) * 100,
    dy: (deltaY / zoom / contentRect.height) * 100,
  };
}

/** Hotspot CSS position within the image-fitted overlay (percent of image bounds). */
export function hotspotOverlayStyle(
  hotspot: Pick<{ x_pct: number; y_pct: number; width_pct: number; height_pct: number }, "x_pct" | "y_pct" | "width_pct" | "height_pct">,
  kind: "pin" | "zone",
): CSSProperties {
  if (kind === "pin") {
    return {
      left: `${hotspot.x_pct + hotspot.width_pct / 2}%`,
      top: `${hotspot.y_pct + hotspot.height_pct / 2}%`,
    };
  }

  return {
    left: `${hotspot.x_pct}%`,
    top: `${hotspot.y_pct}%`,
    width: `${hotspot.width_pct}%`,
    height: `${hotspot.height_pct}%`,
  };
}
