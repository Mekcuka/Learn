/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppTheme from "./AppTheme";
import { AppToast } from "./AppToast";

describe("AppToast", () => {
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

  it("renders bottom-right snackbar with alert role", async () => {
    await act(async () => {
      root.render(
        <AppTheme>
          <AppToast open message="У hotspot обязательны id и label" onClose={vi.fn()} />
        </AppTheme>,
      );
    });

    const alert = document.body.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain("У hotspot обязательны id и label");
    expect(document.body.querySelector(".page-status-error")).toBeNull();

    const snackbar = document.body.querySelector(".MuiSnackbar-root");
    expect(snackbar).not.toBeNull();
  });
});
