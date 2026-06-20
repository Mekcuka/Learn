/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import AppTheme from "../../../components/mui/AppTheme";
import ScreenshotToolbar from "./ScreenshotToolbar";

const noop = () => undefined;

const baseProps = {
  zoom: 1,
  canZoomIn: true,
  canZoomOut: false,
  showHotspots: true,
  isFullscreen: false,
  onZoomIn: noop,
  onZoomOut: noop,
  onReset: noop,
  onToggleHotspots: noop,
  onToggleFullscreen: noop,
};

describe("ScreenshotToolbar", () => {
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

  function renderToolbar(
    props: Partial<typeof baseProps> & {
      showZoomControls?: boolean;
      showFullscreen?: boolean;
    } = {},
  ) {
    act(() => {
      root.render(
        <AppTheme>
          <ScreenshotToolbar {...baseProps} {...props} />
        </AppTheme>,
      );
    });
  }

  it("renders zoom and fullscreen controls by default (author editor)", () => {
    renderToolbar();

    expect(container.querySelector('button[aria-label="Уменьшить"]')).not.toBeNull();
    expect(container.textContent).toContain("100%");
    expect(container.textContent).toContain("Сброс");
    expect(container.textContent).toContain("На весь экран");
    expect(container.textContent).toContain("Метки");
  });

  it("hides zoom and fullscreen when disabled (student lesson view)", () => {
    renderToolbar({ showZoomControls: false, showFullscreen: false });

    expect(container.querySelector('button[aria-label="Уменьшить"]')).toBeNull();
    expect(container.textContent).not.toContain("Сброс");
    expect(container.textContent).not.toContain("На весь экран");
    expect(container.textContent).toContain("Метки");
  });
});
