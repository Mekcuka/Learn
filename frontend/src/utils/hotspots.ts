import type { CSSProperties } from "react";

import type {
  CalloutSide,
  CalloutWidth,
  HotspotFillColor,
  HotspotItem,
  HotspotKind,
  ResolvedCalloutSide,
} from "../types/lesson";

export const PIN_SIZE_PCT = 2;

/** Horizontal anchor (% of image width) above which auto callout flips to the left. */
export const PIN_CALLOUT_FLIP_THRESHOLD_PCT = 72;

export const CALLOUT_SIDE_OPTIONS: ReadonlyArray<{ id: CalloutSide; label: string }> = [
  { id: "auto", label: "Авто" },
  { id: "right", label: "Справа" },
  { id: "left", label: "Слева" },
  { id: "top", label: "Сверху" },
  { id: "bottom", label: "Снизу" },
];

export const CALLOUT_WIDTH_OPTIONS: ReadonlyArray<{ id: CalloutWidth; label: string; maxWidth: string }> = [
  { id: "compact", label: "Компактная", maxWidth: "8rem" },
  { id: "normal", label: "Обычная", maxWidth: "11rem" },
  { id: "wide", label: "Широкая", maxWidth: "16rem" },
];

const CALLOUT_WIDTH_BY_ID = new Map(CALLOUT_WIDTH_OPTIONS.map((entry) => [entry.id, entry.maxWidth]));

export function resolveCalloutMaxWidth(calloutWidth?: CalloutWidth | null): string {
  if (calloutWidth && CALLOUT_WIDTH_BY_ID.has(calloutWidth)) {
    return CALLOUT_WIDTH_BY_ID.get(calloutWidth)!;
  }
  return CALLOUT_WIDTH_BY_ID.get("normal")!;
}

export function calloutWidthStyle(calloutWidth?: CalloutWidth | null): CSSProperties {
  return { "--hotspot-callout-max-width": resolveCalloutMaxWidth(calloutWidth) } as CSSProperties;
}

export function shouldFlipCallout(anchorXPct?: number): boolean {
  return anchorXPct != null && anchorXPct >= PIN_CALLOUT_FLIP_THRESHOLD_PCT;
}

export function resolveCalloutSide(
  calloutSide: CalloutSide | undefined | null,
  anchorXPct?: number,
): ResolvedCalloutSide {
  if (calloutSide && calloutSide !== "auto") {
    return calloutSide;
  }
  return shouldFlipCallout(anchorXPct) ? "left" : "right";
}

export const HOTSPOT_COLOR_PALETTE: ReadonlyArray<{
  id: HotspotFillColor;
  label: string;
  border: string;
  fill: string;
  fillActive: string;
  ring: string;
}> = [
  {
    id: "yellow",
    label: "Жёлтый",
    border: "#fbbf24",
    fill: "rgb(251 191 36 / 20%)",
    fillActive: "rgb(251 191 36 / 35%)",
    ring: "rgb(245 158 11 / 70%)",
  },
  {
    id: "blue",
    label: "Синий",
    border: "#38bdf8",
    fill: "rgb(56 189 248 / 18%)",
    fillActive: "rgb(56 189 248 / 30%)",
    ring: "rgb(14 165 233 / 70%)",
  },
  {
    id: "green",
    label: "Зелёный",
    border: "#22c55e",
    fill: "rgb(34 197 94 / 18%)",
    fillActive: "rgb(34 197 94 / 30%)",
    ring: "rgb(22 163 74 / 70%)",
  },
  {
    id: "red",
    label: "Красный",
    border: "#ef4444",
    fill: "rgb(239 68 68 / 18%)",
    fillActive: "rgb(239 68 68 / 30%)",
    ring: "rgb(220 38 38 / 70%)",
  },
  {
    id: "orange",
    label: "Оранжевый",
    border: "#f97316",
    fill: "rgb(249 115 22 / 18%)",
    fillActive: "rgb(249 115 22 / 30%)",
    ring: "rgb(234 88 12 / 70%)",
  },
  {
    id: "purple",
    label: "Фиолетовый",
    border: "#a855f7",
    fill: "rgb(168 85 247 / 18%)",
    fillActive: "rgb(168 85 247 / 30%)",
    ring: "rgb(124 58 237 / 70%)",
  },
  {
    id: "pink",
    label: "Розовый",
    border: "#ec4899",
    fill: "rgb(236 72 153 / 18%)",
    fillActive: "rgb(236 72 153 / 30%)",
    ring: "rgb(219 39 119 / 70%)",
  },
  {
    id: "cyan",
    label: "Бирюзовый",
    border: "#06b6d4",
    fill: "rgb(6 182 212 / 18%)",
    fillActive: "rgb(6 182 212 / 30%)",
    ring: "rgb(8 145 178 / 70%)",
  },
  {
    id: "gray",
    label: "Серый",
    border: "#64748b",
    fill: "rgb(100 116 139 / 18%)",
    fillActive: "rgb(100 116 139 / 30%)",
    ring: "rgb(71 85 105 / 70%)",
  },
  {
    id: "lime",
    label: "Лаймовый",
    border: "#84cc16",
    fill: "rgb(132 204 22 / 18%)",
    fillActive: "rgb(132 204 22 / 30%)",
    ring: "rgb(101 163 13 / 70%)",
  },
];

/** @deprecated Use HOTSPOT_COLOR_PALETTE */
export const HOTSPOT_FILL_PALETTE = HOTSPOT_COLOR_PALETTE;

const HOTSPOT_COLOR_IDS = new Set(HOTSPOT_COLOR_PALETTE.map((entry) => entry.id));

export function clampPercent(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function toPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return (value / total) * 100;
}

export function getHotspotKind(hotspot: Pick<HotspotItem, "kind">): HotspotKind {
  return hotspot.kind ?? "region";
}

export function isPinHotspot(hotspot: Pick<HotspotItem, "kind">): boolean {
  return getHotspotKind(hotspot) === "pin";
}

export function hasPinLabel(label: string | undefined): boolean {
  return Boolean(label?.trim());
}

export type PinCalloutContent =
  | { mode: "html"; html: string }
  | { mode: "label"; text: string };

/** Pin callout shows description_html; label is fallback when description is empty. */
export function resolvePinCalloutContent(
  descriptionHtml: string | undefined,
  label: string | undefined,
): PinCalloutContent | null {
  const html = descriptionHtml?.trim();
  if (html) {
    return { mode: "html", html };
  }
  const text = label?.trim();
  if (text) {
    return { mode: "label", text };
  }
  return null;
}

export function hasPinCalloutContent(
  descriptionHtml: string | undefined,
  label: string | undefined,
): boolean {
  return resolvePinCalloutContent(descriptionHtml, label) !== null;
}

export function pinHotspotAriaLabel(label: string | undefined): string {
  return hasPinLabel(label) ? label!.trim() : "Метка";
}

export function isZoomHotspot(hotspot: Pick<HotspotItem, "kind">): boolean {
  return getHotspotKind(hotspot) === "zoom";
}

export function isRectHotspot(hotspot: Pick<HotspotItem, "kind">): boolean {
  const kind = getHotspotKind(hotspot);
  return kind === "region" || kind === "zoom";
}

export function hotspotKindLabel(kind: HotspotKind): string {
  switch (kind) {
    case "zoom":
      return "Увеличение";
    case "pin":
      return "Метка";
    default:
      return "Зона";
  }
}

export function defaultHotspotLabel(kind: HotspotKind): string {
  switch (kind) {
    case "zoom":
      return "Увеличение";
    case "pin":
      return "Метка";
    default:
      return "Новая зона";
  }
}

export function pinRectAtPoint(x_pct: number, y_pct: number): Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct"> {
  const half = PIN_SIZE_PCT / 2;
  return {
    x_pct: clampPercent(x_pct - half, 0, 100 - PIN_SIZE_PCT),
    y_pct: clampPercent(y_pct - half, 0, 100 - PIN_SIZE_PCT),
    width_pct: PIN_SIZE_PCT,
    height_pct: PIN_SIZE_PCT,
  };
}

export function defaultHotspotFillColor(kind: HotspotKind): HotspotFillColor {
  if (kind === "zoom" || kind === "pin") {
    return "blue";
  }
  return "yellow";
}

export function getHotspotFillEnabled(hotspot: Pick<HotspotItem, "fill_enabled">): boolean {
  return hotspot.fill_enabled !== false;
}

export function getHotspotFillColor(hotspot: Pick<HotspotItem, "fill_color" | "kind">): HotspotFillColor {
  if (hotspot.fill_color && HOTSPOT_COLOR_IDS.has(hotspot.fill_color)) {
    return hotspot.fill_color;
  }
  return defaultHotspotFillColor(getHotspotKind(hotspot));
}

export function getHotspotBorderColor(
  hotspot: Pick<HotspotItem, "border_color" | "fill_color" | "kind">,
): HotspotFillColor {
  if (hotspot.border_color && HOTSPOT_COLOR_IDS.has(hotspot.border_color)) {
    return hotspot.border_color;
  }
  return getHotspotFillColor(hotspot);
}

export function getHotspotColorPaletteEntry(colorId: HotspotFillColor) {
  return HOTSPOT_COLOR_PALETTE.find((entry) => entry.id === colorId) ?? HOTSPOT_COLOR_PALETTE[0];
}

/** @deprecated Use getHotspotColorPaletteEntry */
export function getHotspotFillPaletteEntry(colorId: HotspotFillColor) {
  return getHotspotColorPaletteEntry(colorId);
}

/** Border accent for pulse ring animation (matches getHotspotBorderColor). */
export function hotspotPulseAccentStyle(
  hotspot: Pick<HotspotItem, "border_color" | "fill_color" | "kind">,
): CSSProperties {
  const accentEntry = getHotspotColorPaletteEntry(getHotspotBorderColor(hotspot));
  return { "--hotspot-pulse-accent": accentEntry.border } as CSSProperties;
}

/** Pin fill: accent on dot, connector and callout via CSS vars on the parent (.hotspot-pin-filled). */
export function hotspotPinFillProps(
  hotspot: Pick<HotspotItem, "fill_enabled" | "fill_color" | "border_color" | "kind">,
): { className: string; style: CSSProperties } {
  const hasExplicitBorder = Boolean(hotspot.border_color && HOTSPOT_COLOR_IDS.has(hotspot.border_color));
  if (!getHotspotFillEnabled(hotspot) && !hasExplicitBorder) {
    return { className: "", style: {} };
  }

  const accentEntry = getHotspotColorPaletteEntry(getHotspotBorderColor(hotspot));
  const accentStyle = hotspotPulseAccentStyle(hotspot);
  return {
    className: "hotspot-pin-filled",
    style: { ...accentStyle, "--hotspot-pin-accent": accentEntry.border } as CSSProperties,
  };
}

export function hotspotRectVisualStyle(hotspot: HotspotItem, active = false): CSSProperties {
  const kind = getHotspotKind(hotspot);
  if (kind === "pin") {
    return {};
  }

  const borderEntry = getHotspotColorPaletteEntry(getHotspotBorderColor(hotspot));
  const fillEntry = getHotspotColorPaletteEntry(getHotspotFillColor(hotspot));
  const fillEnabled = getHotspotFillEnabled(hotspot);
  const style: CSSProperties = {
    ...hotspotPulseAccentStyle(hotspot),
    borderColor: borderEntry.border,
    background: fillEnabled ? (active ? fillEntry.fillActive : fillEntry.fill) : "transparent",
  };

  if (active) {
    style.boxShadow = `0 0 0 2px #fff, 0 0 0 4px ${borderEntry.ring}`;
  }

  return style;
}

export function isHotspotInBounds(hotspot: {
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
}) {
  return hotspot.x_pct + hotspot.width_pct <= 100.01 && hotspot.y_pct + hotspot.height_pct <= 100.01;
}

/** Horizontal anchor (% of image width) below which zone labels align to the hotspot's left edge. */
export const ZONE_LABEL_EDGE_THRESHOLD_PCT = 12;

/** Top edge (% of image height) above which zone labels render below the hotspot. */
export const ZONE_LABEL_TOP_THRESHOLD_PCT = 8;

export type ZoneLabelPlacement =
  | "center"
  | "start"
  | "end"
  | "below-center"
  | "below-start"
  | "below-end";

/** Keeps zone/zoom hotspot labels inside `.screenshot-viewport-clip` (overflow hidden). */
export function resolveZoneLabelPlacement(
  xPct: number,
  yPct: number,
  widthPct: number,
  _heightPct: number,
): ZoneLabelPlacement {
  const centerX = xPct + widthPct / 2;
  const nearLeft = centerX < ZONE_LABEL_EDGE_THRESHOLD_PCT;
  const nearRight = centerX > 100 - ZONE_LABEL_EDGE_THRESHOLD_PCT;
  const nearTop = yPct < ZONE_LABEL_TOP_THRESHOLD_PCT;

  if (nearTop) {
    if (nearLeft) {
      return "below-start";
    }
    if (nearRight) {
      return "below-end";
    }
    return "below-center";
  }
  if (nearLeft) {
    return "start";
  }
  if (nearRight) {
    return "end";
  }
  return "center";
}

export function zoneLabelClassName(placement: ZoneLabelPlacement): string {
  return `hotspot-label hotspot-label--${placement}`;
}
