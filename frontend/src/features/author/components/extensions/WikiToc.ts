import { Node, mergeAttributes } from "@tiptap/core";

export const WikiToc = Node.create({
  name: "wikiToc",
  group: "block",
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: 'div[data-wiki-toc="auto"]' }];
  },

  renderHTML() {
    return [
      "div",
      mergeAttributes({
        class: "wiki-toc-placeholder",
        "data-wiki-toc": "auto",
      }),
      "Оглавление (автоматически при просмотре)",
    ];
  },

  addCommands() {
    return {
      insertWikiToc:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    wikiToc: {
      insertWikiToc: () => ReturnType;
    };
  }
}
