/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";

import { scrollIntoOverflowParent } from "./scrollContainer";

describe("scrollIntoOverflowParent", () => {
  it("scrolls only inside the overflow parent, not the document", () => {
    const container = document.createElement("div");
    container.style.height = "100px";
    container.style.overflowY = "auto";

    const list = document.createElement("ul");
    list.style.height = "400px";

    const item = document.createElement("li");
    item.style.height = "40px";
    item.textContent = "hint";

    list.appendChild(item);
    container.appendChild(list);
    document.body.appendChild(container);

    Object.defineProperty(container, "scrollHeight", { value: 400, configurable: true });
    Object.defineProperty(container, "clientHeight", { value: 100, configurable: true });
    container.scrollTop = 0;

    container.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: 100,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    item.getBoundingClientRect = () =>
      ({
        top: 200,
        bottom: 240,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
        x: 0,
        y: 200,
        toJSON: () => ({}),
      }) as DOMRect;

    const documentScrollSpy = vi.spyOn(window, "scrollTo");

    scrollIntoOverflowParent(item);

    expect(container.scrollTop).toBe(140);
    expect(documentScrollSpy).not.toHaveBeenCalled();

    container.remove();
    documentScrollSpy.mockRestore();
  });
});
