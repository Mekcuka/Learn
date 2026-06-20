/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useScreenshotViewport } from "./useScreenshotViewport";

function WheelProbe() {
  const viewport = useScreenshotViewport();
  return createElement("div", {
    ref: viewport.containerRef,
    "data-testid": "viewport",
    onWheel: viewport.handleWheel,
  });
}

function WheelProbeWithOuterFrame() {
  const viewport = useScreenshotViewport();
  return createElement(
    "div",
    {
      "data-testid": "frame",
      onWheel: viewport.handleWheel,
    },
    createElement("div", {
      ref: viewport.containerRef,
      "data-testid": "viewport",
      onWheel: viewport.handleWheel,
    }),
  );
}

describe("useScreenshotViewport handleWheel", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(createElement(WheelProbe));
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("does not preventDefault on normal wheel (page scroll)", () => {
    const target = container.querySelector<HTMLDivElement>("[data-testid='viewport']");
    expect(target).not.toBeNull();

    const event = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, "preventDefault");

    act(() => {
      target!.dispatchEvent(event);
    });

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("preventsDefault on Ctrl+wheel for zoom", () => {
    const target = container.querySelector<HTMLDivElement>("[data-testid='viewport']");
    expect(target).not.toBeNull();

    const event = new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true, ctrlKey: true });
    const preventDefault = vi.spyOn(event, "preventDefault");
    const stopPropagation = vi.spyOn(event, "stopPropagation");

    act(() => {
      target!.dispatchEvent(event);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it("does not preventDefault on Ctrl+wheel when handler is on a non-viewport ancestor", () => {
    act(() => {
      root.render(createElement(WheelProbeWithOuterFrame));
    });

    const frame = container.querySelector<HTMLDivElement>("[data-testid='frame']");
    expect(frame).not.toBeNull();

    const event = new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true, ctrlKey: true });
    const preventDefault = vi.spyOn(event, "preventDefault");

    act(() => {
      frame!.dispatchEvent(event);
    });

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
