/**

 * @vitest-environment jsdom

 */

import { act, type ComponentProps } from "react";

import { createRoot, type Root } from "react-dom/client";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";



import type { HotspotItem } from "../types/lesson";

import ZoomHotspotPopup from "./ZoomHotspotPopup";



const hotspot: HotspotItem = {

  id: "zoom-1",

  label: "Поле email",

  kind: "zoom",

  x_pct: 10,

  y_pct: 20,

  width_pct: 30,

  height_pct: 15,

  description_html: "<p>Подсказка к увеличению</p>",

};



function renderPopup(

  root: Root,

  props: Partial<ComponentProps<typeof ZoomHotspotPopup>> = {},

) {

  act(() => {

    root.render(

      <div className="screenshot-viewport-clip" style={{ position: "relative", width: 640, height: 360 }}>

        <ZoomHotspotPopup

          open

          hotspot={hotspot}

          imagePath="/screenshot.png"

          imageAlt="Экран входа"

          onClose={vi.fn()}

          {...props}

        />

      </div>,

    );

  });

}



describe("ZoomHotspotPopup", () => {

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



  it("renders centered crop preview with close controls in interactive mode", () => {

    const onClose = vi.fn();

    renderPopup(root, { onClose });



    const overlay = container.querySelector(".zoom-hotspot-overlay--interactive");

    expect(overlay).not.toBeNull();

    expect(container.querySelector(".zoom-hotspot-crop")).not.toBeNull();

    expect(container.textContent).not.toContain("Подсказка к увеличению");



    const closeButtons = container.querySelectorAll<HTMLButtonElement>('[aria-label="Закрыть"]');

    expect(closeButtons.length).toBe(2);



    act(() => {

      closeButtons[1]?.click();

    });



    expect(onClose).toHaveBeenCalledOnce();

  });



  it("renders preview overlay without close button in editor mode", () => {

    renderPopup(root, { interactive: false, animate: false });



    expect(container.querySelector(".zoom-hotspot-overlay--preview")).not.toBeNull();

    expect(container.querySelector(".zoom-hotspot-close")).toBeNull();

    expect(container.querySelector(".zoom-hotspot-backdrop")).toBeNull();

    expect(container.querySelector(".zoom-hotspot-popup--static")).not.toBeNull();

  });

});


