import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { useScreenshotViewport } from "../hooks/useScreenshotViewport";
import type { HotspotItem } from "../../../types/lesson";
import { getHotspotKind, hotspotPinFillProps, hotspotPulseAccentStyle, hotspotRectVisualStyle, pinHotspotAriaLabel } from "../../../utils/hotspots";
import { toggleHotspotSelection } from "../../../utils/screenshotViewport";
import { hotspotOverlayStyle } from "../../../utils/imageContentRect";
import PinHotspotMarker from "./PinHotspotMarker";
import HotspotZoneLabel from "./HotspotZoneLabel";
import ScreenshotHotspotOverlay from "./ScreenshotHotspotOverlay";
import ScreenshotToolbar, { type ScreenshotToolbarProps } from "../../author/components/ScreenshotToolbar";
import ZoomHotspotPopup from "./ZoomHotspotPopup";

type ScreenshotGuideProps = {
  imagePath: string;
  alt: string;
  hotspots: HotspotItem[];
  viewportResetKey?: string;
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string | null) => void;
  hideToolbar?: boolean;
  /** When false, skips fullscreen API wiring (student slide toolbar has no fullscreen). Default: true. */
  enableToolbarFullscreen?: boolean;
  onToolbarPropsChange?: (props: ScreenshotToolbarProps) => void;
};

export default function ScreenshotGuide({
  imagePath,
  alt,
  hotspots,
  viewportResetKey,
  activeHotspotId,
  onHotspotSelect,
  hideToolbar = false,
  enableToolbarFullscreen = true,
  onToolbarPropsChange,
}: ScreenshotGuideProps) {
  const [showHotspots, setShowHotspots] = useState(true);
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const trackFullscreen = enableToolbarFullscreen && !hideToolbar;

  const viewport = useScreenshotViewport({ resetKey: viewportResetKey });

  const activeHotspot = hotspots.find((item) => item.id === activeHotspotId) ?? null;
  const displayHotspotId = activeHotspotId ?? hoveredHotspotId;
  const zoomModalHotspot =
    activeHotspot && getHotspotKind(activeHotspot) === "zoom" ? activeHotspot : null;

  const closeZoomModal = useCallback(() => {
    onHotspotSelect?.(null);
  }, [onHotspotSelect]);

  useEffect(() => {
    if (!trackFullscreen) {
      return;
    }
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [trackFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    if (!trackFullscreen) {
      return;
    }
    const node = shellRef.current;
    if (!node) {
      return;
    }
    if (document.fullscreenElement === node) {
      await document.exitFullscreen();
      return;
    }
    await node.requestFullscreen();
  }, [trackFullscreen]);

  const handleHotspotClick = useCallback(
    (hotspotId: string, _event: ReactMouseEvent<HTMLButtonElement>) => {
      const hotspot = hotspots.find((item) => item.id === hotspotId);
      if (!hotspot) {
        return;
      }
      const kind = getHotspotKind(hotspot);

      if (kind === "zoom") {
        const next = toggleHotspotSelection(activeHotspotId ?? null, hotspotId);
        onHotspotSelect?.(next);
        return;
      }

      const next = toggleHotspotSelection(activeHotspotId ?? null, hotspotId);
      onHotspotSelect?.(next);
    },
    [activeHotspotId, hotspots, onHotspotSelect],
  );

  const toggleShowHotspots = useCallback(() => {
    setShowHotspots((value) => !value);
  }, []);

  const toolbarProps = useMemo<ScreenshotToolbarProps>(
    () => ({
      zoom: viewport.zoom,
      canZoomIn: viewport.canZoomIn,
      canZoomOut: viewport.canZoomOut,
      showHotspots,
      isFullscreen,
      onZoomIn: viewport.zoomIn,
      onZoomOut: viewport.zoomOut,
      onReset: viewport.reset,
      onToggleHotspots: toggleShowHotspots,
      onToggleFullscreen: () => void toggleFullscreen(),
    }),
    [
      isFullscreen,
      showHotspots,
      toggleFullscreen,
      toggleShowHotspots,
      viewport.canZoomIn,
      viewport.canZoomOut,
      viewport.reset,
      viewport.zoom,
      viewport.zoomIn,
      viewport.zoomOut,
    ],
  );

  useEffect(() => {
    if (hideToolbar) {
      onToolbarPropsChange?.(toolbarProps);
    }
  }, [hideToolbar, onToolbarPropsChange, toolbarProps]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        if (zoomModalHotspot) {
          closeZoomModal();
          return;
        }
        onHotspotSelect?.(null);
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        viewport.zoomIn();
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        viewport.zoomOut();
      }
    },
    [closeZoomModal, onHotspotSelect, viewport, zoomModalHotspot],
  );

  const renderHotspot = (hotspot: HotspotItem) => {
    const kind = getHotspotKind(hotspot);
    const isActive = displayHotspotId === hotspot.id;

    if (kind === "pin") {
      const pinFill = hotspotPinFillProps(hotspot);
      return (
        <button
          key={hotspot.id}
          type="button"
          className={`hotspot-pin${isActive ? " hotspot-pin-active" : ""}${hotspot.pulse !== false ? " hotspot-pin-pulse" : ""}${pinFill.className ? ` ${pinFill.className}` : ""}`}
          style={{ ...hotspotOverlayStyle(hotspot, "pin"), ...hotspotPulseAccentStyle(hotspot), ...pinFill.style }}
          aria-label={pinHotspotAriaLabel(hotspot.label)}
          aria-pressed={activeHotspotId === hotspot.id}
          onClick={(event) => {
            event.stopPropagation();
            handleHotspotClick(hotspot.id, event);
          }}
          onMouseEnter={() => setHoveredHotspotId(hotspot.id)}
          onMouseLeave={() => setHoveredHotspotId(null)}
          onFocus={() => setHoveredHotspotId(hotspot.id)}
          onBlur={() => setHoveredHotspotId(null)}
        >
          <PinHotspotMarker
            label={hotspot.label}
            descriptionHtml={hotspot.description_html}
            calloutWidth={hotspot.callout_width}
            calloutSide={hotspot.callout_side}
            anchorXPct={hotspot.x_pct + hotspot.width_pct / 2}
            showCallout={isActive}
            animateCallout
          />
        </button>
      );
    }

    return (
      <button
        key={hotspot.id}
        type="button"
        className={`hotspot ${kind === "zoom" ? "hotspot--zoom" : ""} ${hotspot.pulse !== false ? "hotspot-pulse" : ""} ${
          isActive ? "hotspot-active" : ""
        }`}
        style={{
          ...hotspotOverlayStyle(hotspot, "zone"),
          ...hotspotRectVisualStyle(hotspot, isActive),
        }}
        aria-label={hotspot.label}
        aria-pressed={activeHotspotId === hotspot.id}
        onClick={(event) => {
          event.stopPropagation();
          handleHotspotClick(hotspot.id, event);
        }}
        onMouseEnter={() => setHoveredHotspotId(hotspot.id)}
        onMouseLeave={() => setHoveredHotspotId(null)}
        onFocus={() => setHoveredHotspotId(hotspot.id)}
        onBlur={() => setHoveredHotspotId(null)}
      >
        <HotspotZoneLabel
          label={hotspot.label}
          xPct={hotspot.x_pct}
          yPct={hotspot.y_pct}
          widthPct={hotspot.width_pct}
          heightPct={hotspot.height_pct}
        />
      </button>
    );
  };

  return (
    <div className="screenshot-guide" ref={shellRef}>
      {!hideToolbar && <ScreenshotToolbar {...toolbarProps} />}

      <div
        ref={viewport.frameRef}
        className="screenshot-frame"
        tabIndex={0}
        role="application"
        aria-label={`Скриншот: ${alt}`}
        aria-keyshortcuts="+ - Escape"
        onWheel={viewport.handleWheel}
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
            <ScreenshotHotspotOverlay
              containerRef={viewport.containerRef}
              imagePath={imagePath}
              imageAlt={alt}
              resetKey={viewportResetKey}
              lazy={false}
            >
              {showHotspots ? hotspots.map(renderHotspot) : null}
            </ScreenshotHotspotOverlay>
          </div>
          <ZoomHotspotPopup
            open={Boolean(zoomModalHotspot)}
            hotspot={zoomModalHotspot}
            imagePath={imagePath}
            imageAlt={alt}
            onClose={closeZoomModal}
          />
        </div>
      </div>

    </div>
  );
}
