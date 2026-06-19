/**

 * @vitest-environment jsdom

 */

import { act } from "react";

import { createRoot, type Root } from "react-dom/client";

import { afterEach, beforeEach, describe, expect, it } from "vitest";



import PinHotspotMarker, {

  buildPinConnectorPath,

  buildPinConnectorPathVertical,

  FLIP_THRESHOLD_PCT,

  shouldFlipCallout,

} from "./PinHotspotMarker";



describe("PinHotspotMarker", () => {

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



  it("renders callout with description html, connector and dot", () => {

    act(() => {

      root.render(

        <PinHotspotMarker

          label="Метка"

          descriptionHtml="<p>Нажмите на кнопку</p>"

          anchorXPct={30}

        />,

      );

    });



    expect(container.querySelector(".hotspot-pin-callout-html")?.textContent).toBe("Нажмите на кнопку");

    expect(container.querySelector(".hotspot-pin-callout-text")).toBeNull();

    expect(container.querySelector(".hotspot-pin-connector")).not.toBeNull();

    expect(container.querySelector(".hotspot-pin-dot")).not.toBeNull();

    expect(container.querySelector(".hotspot-pin-callout--side-left")).toBeNull();

  });



  it("falls back to label text when description is empty", () => {

    act(() => {

      root.render(<PinHotspotMarker label="Метка" anchorXPct={30} />);

    });



    expect(container.querySelector(".hotspot-pin-callout-text")?.textContent).toBe("Метка");

    expect(container.querySelector(".hotspot-pin-callout-html")).toBeNull();

  });



  it("renders dot only when description and label are empty", () => {

    act(() => {

      root.render(<PinHotspotMarker label="   " descriptionHtml="  " anchorXPct={30} />);

    });



    expect(container.querySelector(".hotspot-pin-callout-box")).toBeNull();

    expect(container.querySelector(".hotspot-pin-callout")).toBeNull();

    expect(container.querySelector(".hotspot-pin-dot")).not.toBeNull();

  });



  it("auto-flips callout to the left near the right edge", () => {

    act(() => {

      root.render(<PinHotspotMarker label="Справа" anchorXPct={FLIP_THRESHOLD_PCT} />);

    });



    expect(container.querySelector(".hotspot-pin-callout--side-left")).not.toBeNull();

  });



  it("does not auto-flip callout on the left side", () => {

    act(() => {

      root.render(<PinHotspotMarker label="Слева" anchorXPct={FLIP_THRESHOLD_PCT - 1} />);

    });



    expect(container.querySelector(".hotspot-pin-callout--side-left")).toBeNull();

  });



  it("respects explicit callout_side override over auto-flip", () => {

    act(() => {

      root.render(

        <PinHotspotMarker label="Справа" anchorXPct={FLIP_THRESHOLD_PCT} calloutSide="right" />,

      );

    });



    expect(container.querySelector(".hotspot-pin-callout--side-left")).toBeNull();

  });



  it("renders top callout with vertical connector", () => {

    act(() => {

      root.render(<PinHotspotMarker label="Сверху" calloutSide="top" anchorXPct={50} />);

    });



    expect(container.querySelector(".hotspot-pin-callout--side-top")).not.toBeNull();

    expect(container.querySelector(".hotspot-pin-connector--side-top")).not.toBeNull();

  });



  it("renders bottom callout with vertical connector", () => {

    act(() => {

      root.render(<PinHotspotMarker label="Снизу" calloutSide="bottom" anchorXPct={50} />);

    });



    expect(container.querySelector(".hotspot-pin-callout--side-bottom")).not.toBeNull();

    expect(container.querySelector(".hotspot-pin-connector--side-bottom")).not.toBeNull();

  });



  it("hides callout when showCallout is false", () => {

    act(() => {

      root.render(

        <PinHotspotMarker

          label="Метка"

          descriptionHtml="<p>Нажмите на кнопку</p>"

          anchorXPct={30}

          showCallout={false}

        />,

      );

    });



    expect(container.querySelector(".hotspot-pin-callout")).toBeNull();

    expect(container.querySelector(".hotspot-pin-dot")).not.toBeNull();

  });



  it("renders static callout without animation class when animateCallout is false", () => {

    act(() => {

      root.render(

        <PinHotspotMarker

          label="Метка"

          descriptionHtml="<p>Текст</p>"

          anchorXPct={30}

          animateCallout={false}

        />,

      );

    });



    expect(container.querySelector(".hotspot-pin-callout--static")).not.toBeNull();

  });



  it("uses orthogonal connector path starting at dot center", () => {

    act(() => {

      root.render(<PinHotspotMarker label="Метка" anchorXPct={30} />);

    });



    const path = container.querySelector(".hotspot-pin-connector path");

    expect(path?.getAttribute("d")).toBe(buildPinConnectorPath());

    expect(path?.getAttribute("d")).not.toContain("C ");

  });



  it("mirrors connector in left side mode", () => {

    act(() => {

      root.render(<PinHotspotMarker label="Справа" anchorXPct={FLIP_THRESHOLD_PCT} />);

    });



    expect(container.querySelector(".hotspot-pin-connector--side-left")).not.toBeNull();

  });



  it("wraps long callout text in a readable box width", () => {

    act(() => {

      root.render(

        <PinHotspotMarker

          label="Метка"

          descriptionHtml="<p>Нажмите на кнопку входа в систему</p>"

          calloutWidth="wide"

          anchorXPct={30}

        />,

      );

    });



    const box = container.querySelector<HTMLElement>(".hotspot-pin-callout-box");

    expect(box).not.toBeNull();

    expect(box?.style.getPropertyValue("--hotspot-callout-max-width")).toBe("16rem");

    expect(box?.textContent).toBe("Нажмите на кнопку входа в систему");

  });

});



describe("buildPinConnectorPath", () => {

  it("returns a horizontal line when start and end Y match", () => {

    expect(buildPinConnectorPath(54, 30, 15)).toBe("M 0 15 H 54");

  });



  it("returns an orthogonal path with arc corners when Y differs", () => {

    const path = buildPinConnectorPath(54, 30, 22);

    expect(path).toMatch(/^M 0 15 H /);

    expect(path).toContain("A 5 5");

    expect(path).toContain("V 17");

    expect(path).toContain("H 54");

    expect(path).not.toContain("C ");

  });

});



describe("buildPinConnectorPathVertical", () => {

  it("returns a vertical line when start and end X match (up)", () => {

    expect(buildPinConnectorPathVertical(30, 54, 15, 12, 5, "up")).toBe("M 15 54 V 0");

  });



  it("returns an orthogonal path with arc corners when X differs (down)", () => {

    const path = buildPinConnectorPathVertical(30, 54, 22, 12, 5, "down");

    expect(path).toMatch(/^M 15 0 V /);

    expect(path).toContain("A 5 5");

    expect(path).toContain("H 17");

    expect(path).toContain("V 54");

    expect(path).not.toContain("C ");

  });

});



describe("shouldFlipCallout", () => {

  it("returns false when anchorXPct is undefined", () => {

    expect(shouldFlipCallout(undefined)).toBe(false);

  });

});


