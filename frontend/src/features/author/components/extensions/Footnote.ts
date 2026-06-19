import { Mark, mergeAttributes } from "@tiptap/core";

export const Footnote = Mark.create({
  name: "footnote",
  inclusive: false,

  addAttributes() {
    return {
      fnNum: {
        default: 1,
        parseHTML: (element) => Number(element.getAttribute("data-fn-num") ?? "1"),
        renderHTML: (attributes) => ({
          "data-fn-num": String(attributes.fnNum),
        }),
      },
      content: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-footnote") ?? "",
        renderHTML: (attributes) => ({
          "data-footnote": attributes.content,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "sup.learn-footnote-ref" }];
  },

  renderHTML({ mark, HTMLAttributes }) {
    const num = mark.attrs.fnNum ?? 1;
    return [
      "sup",
      mergeAttributes(HTMLAttributes, {
        class: "learn-footnote-ref",
        "data-fn-num": String(num),
        "data-footnote": mark.attrs.content ?? "",
      }),
      String(num),
    ];
  },
});
