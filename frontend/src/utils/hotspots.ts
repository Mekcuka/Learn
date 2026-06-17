export function clampPercent(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function toPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return (value / total) * 100;
}

export function isHotspotInBounds(hotspot: {
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
}) {
  return hotspot.x_pct + hotspot.width_pct <= 100.01 && hotspot.y_pct + hotspot.height_pct <= 100.01;
}
