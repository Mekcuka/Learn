import { Extension } from "@tiptap/core";

export const FONT_SIZE_PRESETS = [
  { label: "Мелкий", value: "12px" },
  { label: "Обычный", value: "14px" },
  { label: "Средний", value: "16px" },
  { label: "Крупный", value: "18px" },
  { label: "Заголовок", value: "24px" },
] as const;

export type FontSizeValue = (typeof FONT_SIZE_PRESETS)[number]["value"];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: FontSizeValue | string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, "") || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain, state }) => {
          const { empty, $from } = state.selection;
          if (empty) {
            const block = $from.parent;
            if (block.isTextblock && block.content.size > 0) {
              return chain()
                .setTextSelection({ from: $from.start(), to: $from.end() })
                .setMark("textStyle", { fontSize })
                .run();
            }
          }
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});
