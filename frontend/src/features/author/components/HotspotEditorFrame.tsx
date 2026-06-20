import { memo, type MouseEvent as ReactMouseEvent, type RefObject } from "react";

import PinHotspotMarker from "../../lesson/components/PinHotspotMarker";
import HotspotZoneLabel from "../../lesson/components/HotspotZoneLabel";
import ScreenshotHotspotOverlay from "../../lesson/components/ScreenshotHotspotOverlay";
import ZoomHotspotPopup from "../../lesson/components/ZoomHotspotPopup";
import type { HotspotItem } from "../../../types/lesson";
import {
  getHotspotKind,
  hotspotPinFillProps,
  hotspotPulseAccentStyle,
  hotspotRectVisualStyle,
  stripInlineFontSizeFromHtml,
} from "../../../utils/hotspots";
import { hotspotOverlayStyle } from "../../../utils/imageContentRect";
import { displayHotspot, zoneClassName, type DraftRect, type LiveRect } from "./hotspotEditorUtils";

export type HotspotEditorFrameProps = {
  imagePath: string;
  hotspots: HotspotItem[];
  selectedId: string | null;
  liveRect: LiveRect | null;
  draft: DraftRect | null;
  frameRef: RefObject<HTMLDivElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  viewportTransform: string;
  spacePanActive: boolean;
  onFrameMouseDown: (event: ReactMouseEvent) => void;
  onHotspotMouseDown: (event: ReactMouseEvent, hotspot: HotspotItem) => void;
  onResizeMouseDown: (event: ReactMouseEvent, hotspot: HotspotItem) => void;
  onWheel: (event: React.WheelEvent) => void;
};

const HotspotEditorFrame = memo(function HotspotEditorFrame({
  imagePath,
  hotspots,
  selectedId,
  liveRect,
  draft,
  frameRef,
  containerRef,
  viewportTransform,
  spacePanActive,
  onFrameMouseDown,
  onHotspotMouseDown,
  onResizeMouseDown,
  onWheel,
}: HotspotEditorFrameProps) {
  const previewZoomHotspot = (() => {
    if (!selectedId) {
      return null;
    }
    const hotspot = hotspots.find((item) => item.id === selectedId);
    if (!hotspot || getHotspotKind(hotspot) !== "zoom") {
      return null;
    }
    return displayHotspot(hotspot, liveRect);
  })();

  return (
    <div
      ref={frameRef}
      className={`hotspot-editor-frame screenshot-frame${spacePanActive ? " hotspot-editor-frame--pan" : ""}`}
      onMouseDown={onFrameMouseDown}
    >
      <div ref={containerRef} className="screenshot-viewport-clip" onWheel={onWheel}>
        <div className="screenshot-viewport" style={{ transform: viewportTransform }}>
          <ScreenshotHotspotOverlay containerRef={containerRef} imagePath={imagePath} lazy={false}>
            {hotspots.map((hotspot) => {
              const display = displayHotspot(hotspot, liveRect);
              const kind = getHotspotKind(hotspot);
              const selected = selectedId === hotspot.id;
              const pinFill = kind === "pin" ? hotspotPinFillProps(display) : null;
              const pulseClass =
                display.pulse !== false ? (kind === "pin" ? " hotspot-pin-pulse" : " hotspot-pulse") : "";
              return (
                <div
                  key={hotspot.id}
                  className={`${zoneClassName(hotspot, selected)}${pinFill?.className ? ` ${pinFill.className}` : ""}${pulseClass}`}
                  style={{
                    ...hotspotOverlayStyle(display, kind === "pin" ? "pin" : "zone"),
                    ...hotspotPulseAccentStyle(display),
                    ...(kind !== "pin" ? hotspotRectVisualStyle(display, selected) : pinFill?.style),
                  }}
                  onMouseDown={(event) => onHotspotMouseDown(event, hotspot)}
                >
                  {kind === "pin" ? (
                    <PinHotspotMarker
                      label={hotspot.label}
                      descriptionHtml={stripInlineFontSizeFromHtml(hotspot.description_html ?? "")}
                      calloutWidth={hotspot.callout_width}
                      calloutSide={hotspot.callout_side}
                      anchorXPct={display.x_pct + display.width_pct / 2}
                      showCallout={selected}
                      animateCallout={false}
                    />
                  ) : (
                    <HotspotZoneLabel
                      label={hotspot.label}
                      xPct={display.x_pct}
                      yPct={display.y_pct}
                      widthPct={display.width_pct}
                      heightPct={display.height_pct}
                    />
                  )}
                  {kind !== "pin" ? (
                    <button
                      type="button"
                      className="hotspot-editor-handle"
                      aria-label="Изменить размер"
                      onMouseDown={(event) => onResizeMouseDown(event, hotspot)}
                    />
                  ) : null}
                </div>
              );
            })}
            {draft ? (
              <div
                className="hotspot-editor-zone hotspot-editor-draft"
                style={hotspotOverlayStyle(draft, "zone")}
              />
            ) : null}
          </ScreenshotHotspotOverlay>
        </div>
        {previewZoomHotspot ? (
          <ZoomHotspotPopup
            open
            hotspot={previewZoomHotspot}
            imagePath={imagePath}
            imageAlt=""
            onClose={() => undefined}
            interactive={false}
            animate={false}
          />
        ) : null}
      </div>
    </div>
  );
});

export default HotspotEditorFrame;
