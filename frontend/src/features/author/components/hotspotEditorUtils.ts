import type { HotspotItem } from "../../../types/lesson";
import { getHotspotKind } from "../../../utils/hotspots";

export type DragMode = "draw" | "move" | "resize" | null;

export type DraftRect = {
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
};

export type LiveRect = DraftRect & { id: string };

export type DragState = {
  mode: Exclude<DragMode, null>;
  startX: number;
  startY: number;
  origin: HotspotItem | DraftRect;
  hotspotId?: string;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function toPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return (value / total) * 100;
}

export function displayHotspot(hotspot: HotspotItem, liveRect: LiveRect | null): HotspotItem {
  if (liveRect?.id === hotspot.id) {
    return {
      ...hotspot,
      x_pct: liveRect.x_pct,
      y_pct: liveRect.y_pct,
      width_pct: liveRect.width_pct,
      height_pct: liveRect.height_pct,
    };
  }
  return hotspot;
}

export function zoneClassName(hotspot: HotspotItem, selected: boolean): string {
  const kind = getHotspotKind(hotspot);
  const base =
    kind === "pin"
      ? "hotspot-editor-pin"
      : `hotspot-editor-zone${kind === "zoom" ? " hotspot-editor-zone--zoom" : ""}`;
  return `${base}${selected ? " hotspot-editor-zone-active" : ""}`;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return Boolean(target.closest(".ProseMirror, [contenteditable='true']"));
}
