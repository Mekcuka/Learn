import { useCallback, useEffect, useRef, useState } from "react";

import { useScreenshotViewport } from "../hooks/useScreenshotViewport";
import type { HotspotItem } from "../api/learnApi";
import { toggleHotspotSelection } from "../utils/screenshotViewport";
import SafeHtml from "./SafeHtml";
import ScreenshotToolbar from "./ScreenshotToolbar";

const ZOOM_HINT_KEY = "learn:screenshot-zoom-hint";

type ScreenshotGuideProps = {
  imagePath: string;
  alt: string;
  hotspots: HotspotItem[];
  viewportResetKey?: string;
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string | null) => void;
};

export default function ScreenshotGuide({
  imagePath,
  alt,
  hotspots,
  viewportResetKey,
  activeHotspotId,
  onHotspotSelect,
}: ScreenshotGuideProps) {
  const [showHotspots, setShowHotspots] = useState(true);
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showZoomHint, setShowZoomHint] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const viewport = useScreenshotViewport({ resetKey: viewportResetKey });

  const activeHotspot = hotspots.find((item) => item.id === activeHotspotId) ?? null;
  const displayHotspotId = activeHotspotId ?? hoveredHotspotId;

  useEffect(() => {
    setShowZoomHint(sessionStorage.getItem(ZOOM_HINT_KEY) !== "1");
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const dismissZoomHint = useCallback(() => {
    sessionStorage.setItem(ZOOM_HINT_KEY, "1");
    setShowZoomHint(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    dismissZoomHint();
    viewport.zoomIn();
  }, [dismissZoomHint, viewport]);

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        dismissZoomHint();
      }
      viewport.handleWheel(event);
    },
    [dismissZoomHint, viewport],
  );

  const toggleFullscreen = useCallback(async () => {
    const node = shellRef.current;
    if (!node) {
      return;
    }
    if (document.fullscreenElement === node) {
      await document.exitFullscreen();
      return;
    }
    await node.requestFullscreen();
  }, []);

  const handleHotspotClick = useCallback(
    (hotspotId: string) => {
      onHotspotSelect?.(toggleHotspotSelection(activeHotspotId ?? null, hotspotId));
    },
    [activeHotspotId, onHotspotSelect],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        onHotspotSelect?.(null);
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        handleZoomIn();
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        viewport.zoomOut();
      }
    },
    [handleZoomIn, onHotspotSelect, viewport],
  );

  return (
    <div className="screenshot-guide" ref={shellRef}>
      <ScreenshotToolbar
        zoom={viewport.zoom}
        canZoomIn={viewport.canZoomIn}
        canZoomOut={viewport.canZoomOut}
        showHotspots={showHotspots}
        isFullscreen={isFullscreen}
        onZoomIn={handleZoomIn}
        onZoomOut={viewport.zoomOut}
        onReset={viewport.reset}
        onToggleHotspots={() => setShowHotspots((value) => !value)}
        onToggleFullscreen={() => void toggleFullscreen()}
      />

      {showZoomHint && (
        <p className="screenshot-zoom-hint" role="note">
          Удерживайте Ctrl и крутите колёсико для масштаба. На телефоне — жест «щипок».
          <button type="button" className="screenshot-zoom-hint-dismiss" onClick={dismissZoomHint}>
            Понятно
          </button>
        </p>
      )}

      <div
        ref={viewport.frameRef}
        className={`screenshot-frame ${viewport.canPan ? "screenshot-frame-pannable" : ""} ${
          viewport.isDragging ? "screenshot-frame-dragging" : ""
        }`}
        tabIndex={0}
        role="application"
        aria-label={`Скриншот: ${alt}`}
        aria-keyshortcuts="+ - Escape"
        onWheel={handleWheel}
        onPointerDown={viewport.handlePointerDown}
        onPointerMove={viewport.handlePointerMove}
        onPointerUp={viewport.handlePointerUp}
        onPointerCancel={viewport.handlePointerUp}
        onTouchStart={viewport.handleTouchStart}
        onTouchMove={viewport.handleTouchMove}
        onTouchEnd={viewport.handleTouchEnd}
        onKeyDown={handleKeyDown}
      >
        <div ref={viewport.containerRef} className="screenshot-viewport-clip">
          <div
            className="screenshot-viewport"
            style={{
              transform: `translate(${viewport.pan.x}px, ${viewport.pan.y}px) scale(${viewport.zoom})`,
            }}
          >
            <img src={imagePath} alt={alt} loading="lazy" className="screenshot-image" draggable={false} />
            {showHotspots && (
              <div className="screenshot-overlay">
                {hotspots.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    type="button"
                    className={`hotspot ${hotspot.pulse !== false ? "hotspot-pulse" : ""} ${
                      displayHotspotId === hotspot.id ? "hotspot-active" : ""
                    }`}
                    style={{
                      left: `${hotspot.x_pct}%`,
                      top: `${hotspot.y_pct}%`,
                      width: `${hotspot.width_pct}%`,
                      height: `${hotspot.height_pct}%`,
                    }}
                    aria-label={hotspot.label}
                    aria-pressed={activeHotspotId === hotspot.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleHotspotClick(hotspot.id);
                    }}
                    onMouseEnter={() => setHoveredHotspotId(hotspot.id)}
                    onMouseLeave={() => setHoveredHotspotId(null)}
                    onFocus={() => setHoveredHotspotId(hotspot.id)}
                    onBlur={() => setHoveredHotspotId(null)}
                  >
                    <span className="hotspot-label">{hotspot.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeHotspot && (
        <div className="hotspot-callout" role="status">
          <strong>{activeHotspot.label}</strong>
          {activeHotspot.description_html?.trim() ? (
            <SafeHtml html={activeHotspot.description_html} className="hotspot-callout-body" tag="div" />
          ) : (
            <p className="hotspot-callout-body">Нажмите ещё раз, чтобы снять выделение.</p>
          )}
        </div>
      )}
    </div>
  );
}
