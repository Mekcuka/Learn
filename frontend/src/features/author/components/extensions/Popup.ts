import { Mark, mergeAttributes } from "@tiptap/core";

export const Popup = Mark.create({
  name: "popup",
  inclusive: false,

  addAttributes() {
    return {
      content: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-popup") ?? "",
        renderHTML: (attributes) => ({
          "data-popup": attributes.content,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.learn-popup" }];
  },

  renderHTML({ mark, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: "learn-popup",
        "data-popup": mark.attrs.content ?? "",
        tabindex: "0",
        role: "button",
        "aria-haspopup": "dialog",
      }),
      0,
    ];
  },
});
