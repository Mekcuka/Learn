import { Node, mergeAttributes } from "@tiptap/core";

export type CalloutType = "info" | "warning" | "tip";

const CALLOUT_LABELS: Record<CalloutType, string> = {
  info: "Информация",
  warning: "Внимание",
  tip: "Подсказка",
};

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      calloutType: {
        default: "info" as CalloutType,
        parseHTML: (element) => element.getAttribute("data-callout-type") ?? "info",
        renderHTML: (attributes) => ({
          "data-callout-type": attributes.calloutType,
        }),
      },
      label: {
        default: CALLOUT_LABELS.info,
        parseHTML: (element) =>
          element.querySelector(".learn-callout-label")?.textContent ?? CALLOUT_LABELS.info,
      },
    };
  },

  parseHTML() {
    return [{ tag: "aside.learn-callout" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const calloutType = (node.attrs.calloutType as CalloutType) ?? "info";
    const label = node.attrs.label || CALLOUT_LABELS[calloutType];

    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        class: `learn-callout learn-callout--${calloutType}`,
        "data-callout-type": calloutType,
      }),
      ["strong", { class: "learn-callout-label" }, label],
      ["div", { class: "learn-callout-body" }, 0],
    ];
  },
});

export { CALLOUT_LABELS };
