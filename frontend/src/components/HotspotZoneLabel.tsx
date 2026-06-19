import { resolveZoneLabelPlacement, zoneLabelClassName } from "../utils/hotspots";

type HotspotZoneLabelProps = {
  label: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
};

/** Tooltip-style label for region/zoom hotspots with edge-aware placement. */
export default function HotspotZoneLabel({
  label,
  xPct,
  yPct,
  widthPct,
  heightPct,
}: HotspotZoneLabelProps) {
  const placement = resolveZoneLabelPlacement(xPct, yPct, widthPct, heightPct);
  return <span className={zoneLabelClassName(placement)}>{label}</span>;
}
