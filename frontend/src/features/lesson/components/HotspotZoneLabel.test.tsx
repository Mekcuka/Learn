/**
 * @vitest-environment jsdom
 */
import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import HotspotZoneLabel from "./HotspotZoneLabel";
import { ZONE_LABEL_EDGE_THRESHOLD_PCT, ZONE_LABEL_TOP_THRESHOLD_PCT } from "../../../utils/hotspots";

describe("HotspotZoneLabel", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function renderLabel(props: ComponentProps<typeof HotspotZoneLabel>) {
    act(() => {
      root.render(<HotspotZoneLabel {...props} />);
    });
  }

  it("aligns label to hotspot start when zone is near the left edge", () => {
    renderLabel({ label: "Новая зона", xPct: 0.85, yPct: 20, widthPct: 8, heightPct: 6 });
    expect(container.querySelector(".hotspot-label--start")).not.toBeNull();
  });

  it("aligns label to hotspot end when zone is near the right edge", () => {
    renderLabel({
      label: "Зона",
      xPct: 100 - ZONE_LABEL_EDGE_THRESHOLD_PCT,
      yPct: 20,
      widthPct: 10,
      heightPct: 6,
    });
    expect(container.querySelector(".hotspot-label--end")).not.toBeNull();
  });

  it("places label below the hotspot when zone is near the top edge", () => {
    renderLabel({
      label: "Зона",
      xPct: 40,
      yPct: ZONE_LABEL_TOP_THRESHOLD_PCT - 1,
      widthPct: 10,
      heightPct: 6,
    });
    expect(container.querySelector(".hotspot-label--below-center")).not.toBeNull();
  });

  it("uses centered placement for zones away from edges", () => {
    renderLabel({ label: "Зона", xPct: 40, yPct: 30, widthPct: 12, heightPct: 8 });
    expect(container.querySelector(".hotspot-label--center")).not.toBeNull();
  });
});
