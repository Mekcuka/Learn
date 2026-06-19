import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";

export const LearnImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") ?? "",
        renderHTML: (attributes) => {
          if (!attributes.caption) {
            return {};
          }
          return { "data-caption": attributes.caption };
        },
      },
      width: {
        default: "100",
        parseHTML: (element) => element.getAttribute("data-width") ?? "100",
        renderHTML: (attributes) => ({
          "data-width": String(attributes.width ?? "100"),
          style: `width: ${attributes.width ?? "100"}%`,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const width = HTMLAttributes["data-width"] ?? "100";
    const caption = HTMLAttributes["data-caption"] ?? "";
    const imgAttrs = mergeAttributes(HTMLAttributes, {
      style: `width: ${width}%`,
    });
    delete imgAttrs["data-caption"];
    delete imgAttrs["data-width"];

    if (caption) {
      return [
        "figure",
        { class: "learn-image-figure" },
        ["img", imgAttrs],
        ["figcaption", { class: "learn-image-caption" }, caption],
      ];
    }

    return ["img", imgAttrs];
  },

  parseHTML() {
    return [
      {
        tag: "figure.learn-image-figure",
        getAttrs: (element) => {
          const img = (element as HTMLElement).querySelector("img");
          const figcaption = (element as HTMLElement).querySelector("figcaption");
          if (!img) {
            return false;
          }
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt"),
            caption: figcaption?.textContent ?? "",
            width: img.getAttribute("data-width") ?? img.style.width?.replace("%", "") ?? "100",
          };
        },
      },
      {
        tag: "img[src]",
        getAttrs: (element) => {
          if ((element as HTMLElement).closest("figure.learn-image-figure")) {
            return false;
          }
          return null;
        },
      },
    ];
  },
});
