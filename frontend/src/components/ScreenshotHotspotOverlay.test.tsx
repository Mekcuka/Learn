/**
 * @vitest-environment jsdom
 */
import { act, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ScreenshotHotspotOverlay from "./ScreenshotHotspotOverlay";
import {
  computeImageContentRect,
  imageMatchesSrc,
  useImageContentRect,
} from "../hooks/useImageContentRect";

function mockElementSize(element: HTMLElement, width: number, height: number) {
  Object.defineProperty(element, "clientWidth", { configurable: true, value: width });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: height });
}

function ContentRectProbe({
  containerRef,
  imageRef,
  imageSrc,
}: {
  containerRef: RefObject<HTMLDivElement>;
  imageRef: RefObject<HTMLImageElement>;
  imageSrc?: string;
}) {
  const rect = useImageContentRect(containerRef, imageRef, { imageSrc });
  return <div data-testid="rect-state">{rect ? "ready" : "pending"}</div>;
}

describe("imageMatchesSrc", () => {
  it("rejects stale complete state when src attribute changed", () => {
    const image = document.createElement("img");
    image.setAttribute("src", "/content/new-slide.png");
    Object.defineProperty(image, "currentSrc", {
      configurable: true,
      value: "http://localhost/content/old-slide.png",
    });

    expect(imageMatchesSrc(image, "/content/new-slide.png")).toBe(false);
    expect(imageMatchesSrc(image, "/content/old-slide.png")).toBe(false);
  });
});

describe("computeImageContentRect", () => {
  it("returns null when container has zero height (flex layout not settled)", () => {
    const container = document.createElement("div");
    const image = document.createElement("img");
    mockElementSize(container, 800, 0);
    Object.defineProperty(image, "naturalWidth", { configurable: true, value: 1600 });
    Object.defineProperty(image, "naturalHeight", { configurable: true, value: 900 });
    image.setAttribute("src", "/content/slide.png");
    Object.defineProperty(image, "currentSrc", {
      configurable: true,
      value: "http://localhost/content/slide.png",
    });

    expect(computeImageContentRect(container, image, "/content/slide.png")).toBeNull();
  });

  it("accepts loaded image when currentSrc matches expected path suffix", () => {
    const container = document.createElement("div");
    const image = document.createElement("img");
    mockElementSize(container, 800, 450);
    Object.defineProperty(image, "naturalWidth", { configurable: true, value: 1600 });
    Object.defineProperty(image, "naturalHeight", { configurable: true, value: 900 });
    image.setAttribute("src", "/content/slide.png");
    Object.defineProperty(image, "currentSrc", {
      configurable: true,
      value: "http://localhost/content/slide.png",
    });

    expect(computeImageContentRect(container, image, "/content/slide.png")).toEqual({
      x: 0,
      y: 0,
      width: 800,
      height: 450,
    });
  });
});

describe("useImageContentRect / ScreenshotHotspotOverlay", () => {
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 0) as unknown as number,
    );
    vi.stubGlobal(
      "cancelAnimationFrame",
      (id: number) => window.clearTimeout(id),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanups.splice(0).forEach((fn) => fn());
  });

  function mountProbe(
    host: HTMLDivElement,
    image: HTMLImageElement,
    imageSrc?: string,
  ) {
    const containerRef = { current: host };
    const imageRef = { current: image };
    const probeHost = document.createElement("div");
    document.body.appendChild(probeHost);
    const probeRoot: Root = createRoot(probeHost);

    act(() => {
      probeRoot.render(
        <ContentRectProbe containerRef={containerRef} imageRef={imageRef} imageSrc={imageSrc} />,
      );
    });

    cleanups.push(() => {
      act(() => {
        probeRoot.unmount();
      });
      probeHost.remove();
    });

    return probeHost;
  }

  function rectState(probeHost: ParentNode) {
    return probeHost.querySelector('[data-testid="rect-state"]')?.textContent;
  }

  it("updates content rect after image load event", async () => {
    const host = document.createElement("div");
    mockElementSize(host, 800, 450);
    document.body.appendChild(host);
    cleanups.push(() => host.remove());

    const image = document.createElement("img");
    image.setAttribute("src", "/content/slide.png");
    host.appendChild(image);

    const probeHost = mountProbe(host, image, "/content/slide.png");
    expect(rectState(probeHost)).toBe("pending");

    Object.defineProperty(image, "naturalWidth", { configurable: true, get: () => 1600 });
    Object.defineProperty(image, "naturalHeight", { configurable: true, get: () => 900 });
    Object.defineProperty(image, "currentSrc", {
      configurable: true,
      get: () => "http://localhost/content/slide.png",
    });

    await act(async () => {
      image.dispatchEvent(new Event("load"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(rectState(probeHost)).toBe("ready");
  });

  it("measures content rect when image is already complete on mount", () => {
    const host = document.createElement("div");
    mockElementSize(host, 800, 450);
    document.body.appendChild(host);
    cleanups.push(() => host.remove());

    const image = document.createElement("img");
    image.setAttribute("src", "/content/slide.png");
    host.appendChild(image);
    Object.defineProperty(image, "complete", { configurable: true, value: true });
    Object.defineProperty(image, "naturalWidth", { configurable: true, value: 1600 });
    Object.defineProperty(image, "naturalHeight", { configurable: true, value: 900 });
    Object.defineProperty(image, "currentSrc", {
      configurable: true,
      value: "http://localhost/content/slide.png",
    });

    const probeHost = mountProbe(host, image, "/content/slide.png");
    expect(rectState(probeHost)).toBe("ready");
  });

  it("retries measurement when container height is zero until layout settles", async () => {
    const host = document.createElement("div");
    mockElementSize(host, 800, 0);
    document.body.appendChild(host);
    cleanups.push(() => host.remove());

    const image = document.createElement("img");
    image.setAttribute("src", "/content/slide.png");
    host.appendChild(image);
    Object.defineProperty(image, "complete", { configurable: true, value: true });
    Object.defineProperty(image, "naturalWidth", { configurable: true, value: 1600 });
    Object.defineProperty(image, "naturalHeight", { configurable: true, value: 900 });
    Object.defineProperty(image, "currentSrc", {
      configurable: true,
      value: "http://localhost/content/slide.png",
    });

    const probeHost = mountProbe(host, image, "/content/slide.png");
    expect(rectState(probeHost)).toBe("pending");

    mockElementSize(host, 800, 450);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(rectState(probeHost)).toBe("ready");
  });

  it("renders hotspot overlay children after async image load", async () => {
    const shell = document.createElement("div");
    mockElementSize(shell, 800, 450);
    document.body.appendChild(shell);
    cleanups.push(() => shell.remove());

    const containerRef = { current: shell };
    const rootHost = document.createElement("div");
    document.body.appendChild(rootHost);
    const root = createRoot(rootHost);
    cleanups.push(() => {
      act(() => {
        root.unmount();
      });
      rootHost.remove();
    });

    act(() => {
      root.render(
        <ScreenshotHotspotOverlay
          containerRef={containerRef}
          imagePath="/content/slide.png"
          imageAlt="Слайд"
          lazy={false}
        >
          <button type="button" className="hotspot" data-testid="hotspot-btn">
            Метка
          </button>
        </ScreenshotHotspotOverlay>,
      );
    });

    expect(rootHost.querySelector('[data-testid="hotspot-btn"]')).toBeNull();

    const image = rootHost.querySelector("img");
    expect(image).not.toBeNull();
    Object.defineProperty(image!, "naturalWidth", { configurable: true, get: () => 1600 });
    Object.defineProperty(image!, "naturalHeight", { configurable: true, get: () => 900 });
    Object.defineProperty(image!, "currentSrc", {
      configurable: true,
      get: () => "http://localhost/content/slide.png",
    });

    await act(async () => {
      image!.dispatchEvent(new Event("load"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(rootHost.querySelector('[data-testid="hotspot-btn"]')).not.toBeNull();
    const overlay = rootHost.querySelector(".screenshot-overlay") as HTMLElement | null;
    expect(overlay).not.toBeNull();
    expect(overlay?.style.width).toBe("800px");
    expect(overlay?.style.height).toBe("450px");
  });
});
