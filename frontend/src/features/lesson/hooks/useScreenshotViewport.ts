import { useCallback, useEffect, useRef, useState } from "react";

import type { HotspotItem } from "../../../types/lesson";
import {
  clampPan,
  clampZoom,
  MAX_ZOOM,
  MIN_ZOOM,
  panForZoomAtPoint,
  panToCenterHotspot,
  viewportForHotspotZoom,
  ZOOM_STEP,
} from "../../../utils/screenshotViewport";

type Pan = { x: number; y: number };

type ViewportState = {
  zoom: number;
  pan: Pan;
};

type PinchState = {
  distance: number;
  zoom: number;
  pan: Pan;
  focalX: number;
  focalY: number;
};

const INITIAL_VIEWPORT: ViewportState = { zoom: MIN_ZOOM, pan: { x: 0, y: 0 } };

type UseScreenshotViewportOptions = {
  resetKey?: string;
};

export function useScreenshotViewport({ resetKey }: UseScreenshotViewportOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportState>(INITIAL_VIEWPORT);
  const pinchStart = useRef<PinchState | null>(null);

  const { zoom, pan } = viewport;

  const getSize = useCallback(() => {
    const el = containerRef.current;
    if (!el) {
      return { width: 0, height: 0 };
    }
    return { width: el.clientWidth, height: el.clientHeight };
  }, []);

  const getFocalFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) {
        const { width, height } = getSize();
        return { x: width / 2, y: height / 2 };
      }
      const rect = el.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [getSize],
  );

  const applyZoomDelta = useCallback(
    (delta: number, focalX: number, focalY: number) => {
      setViewport((current) => {
        const nextZoom = clampZoom(current.zoom + delta);
        if (nextZoom === current.zoom) {
          return current;
        }
        const { width, height } = getSize();
        const nextPan = panForZoomAtPoint(
          current.pan.x,
          current.pan.y,
          current.zoom,
          nextZoom,
          focalX,
          focalY,
          width,
          height,
        );
        return {
          zoom: nextZoom,
          pan: { x: nextPan.panX, y: nextPan.panY },
        };
      });
    },
    [getSize],
  );

  const reset = useCallback(() => {
    setViewport(INITIAL_VIEWPORT);
  }, []);

  const panBy = useCallback(
    (deltaX: number, deltaY: number) => {
      setViewport((current) => {
        const { width, height } = getSize();
        const nextPan = clampPan(
          current.pan.x + deltaX,
          current.pan.y + deltaY,
          current.zoom,
          width,
          height,
        );
        return {
          zoom: current.zoom,
          pan: { x: nextPan.panX, y: nextPan.panY },
        };
      });
    },
    [getSize],
  );

  const focusHotspot = useCallback(
    (hotspot: Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct">) => {
      const { width, height } = getSize();
      if (width <= 0 || height <= 0) {
        return;
      }
      setViewport((current) => {
        const nextZoom = current.zoom <= MIN_ZOOM ? Math.min(MAX_ZOOM, MIN_ZOOM + ZOOM_STEP) : current.zoom;
        const nextPan = panToCenterHotspot(hotspot, nextZoom, width, height);
        return {
          zoom: nextZoom,
          pan: { x: nextPan.panX, y: nextPan.panY },
        };
      });
    },
    [getSize],
  );

  const focusHotspotZoom = useCallback(
    (hotspot: Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct">) => {
      const { width, height } = getSize();
      if (width <= 0 || height <= 0) {
        return;
      }
      const next = viewportForHotspotZoom(hotspot, width, height);
      setViewport({
        zoom: next.zoom,
        pan: { x: next.panX, y: next.panY },
      });
    },
    [getSize],
  );

  useEffect(() => {
    reset();
  }, [reset, resetKey]);

  const zoomIn = useCallback(() => {
    const { width, height } = getSize();
    applyZoomDelta(ZOOM_STEP, width / 2, height / 2);
  }, [applyZoomDelta, getSize]);

  const zoomOut = useCallback(() => {
    const { width, height } = getSize();
    applyZoomDelta(-ZOOM_STEP, width / 2, height / 2);
  }, [applyZoomDelta, getSize]);

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      const viewport = containerRef.current;
      if (!viewport || event.currentTarget !== viewport) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const focal = getFocalFromClient(event.clientX, event.clientY);
      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      applyZoomDelta(delta, focal.x, focal.y);
    },
    [applyZoomDelta, getFocalFromClient],
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length !== 2) {
        return;
      }
      const [a, b] = [event.touches[0], event.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const focal = getFocalFromClient((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
      pinchStart.current = { distance, zoom, pan: { ...pan }, focalX: focal.x, focalY: focal.y };
    },
    [getFocalFromClient, pan, zoom],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length !== 2 || !pinchStart.current) {
        return;
      }
      event.preventDefault();
      const [a, b] = [event.touches[0], event.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = distance / pinchStart.current.distance;
      const nextZoom = clampZoom(pinchStart.current.zoom * ratio);
      const { width, height } = getSize();
      const nextPan = panForZoomAtPoint(
        pinchStart.current.pan.x,
        pinchStart.current.pan.y,
        pinchStart.current.zoom,
        nextZoom,
        pinchStart.current.focalX,
        pinchStart.current.focalY,
        width,
        height,
      );
      setViewport({
        zoom: nextZoom,
        pan: { x: nextPan.panX, y: nextPan.panY },
      });
    },
    [getSize],
  );

  const handleTouchEnd = useCallback(() => {
    pinchStart.current = null;
  }, []);

  return {
    containerRef,
    frameRef,
    zoom,
    pan,
    canZoomIn: zoom < MAX_ZOOM,
    canZoomOut: zoom > MIN_ZOOM,
    zoomIn,
    zoomOut,
    reset,
    panBy,
    focusHotspot,
    focusHotspotZoom,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
