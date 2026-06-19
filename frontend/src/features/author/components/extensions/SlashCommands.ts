import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";

import type { EditorMode } from "./buildEditorExtensions";

export type SlashCommandItem = {
  title: string;
  command: string;
  description: string;
};

const LESSON_COMMANDS: SlashCommandItem[] = [
  { title: "Заголовок", command: "/заголовок", description: "Заголовок H2" },
  { title: "Ссылка", command: "/ссылка", description: "Вставить ссылку" },
  { title: "Сноска", command: "/сноска", description: "Сноска к слову" },
  { title: "Всплывающее окно", command: "/всплывающее", description: "Подсказка при наведении" },
  { title: "Выноска", command: "/выноска", description: "Блок-подсказка" },
  { title: "Таблица", command: "/таблица", description: "Таблица 3×3" },
  { title: "Цитата", command: "/цитата", description: "Цитата" },
  { title: "Код", command: "/код", description: "Блок кода" },
  { title: "Разделитель", command: "/разделитель", description: "Горизонтальная линия" },
  { title: "Скрытый блок", command: "/скрытый", description: "Сворачиваемый блок" },
  { title: "Чеклист", command: "/чеклист", description: "Список задач" },
];

const WIKI_EXTRA: SlashCommandItem[] = [
  { title: "Изображение", command: "/изображение", description: "Вставить картинку" },
  { title: "Оглавление", command: "/оглавление", description: "Маркер оглавления" },
];

export type SlashCommandState = {
  active: boolean;
  items: SlashCommandItem[];
  clientRect: (() => DOMRect | null) | null;
  command: ((item: SlashCommandItem) => void) | null;
};

export const slashCommandPluginKey = new PluginKey("slashCommand");

export type SlashCommandsOptions = {
  mode: EditorMode;
  enableImages: boolean;
  onStateChange?: (state: SlashCommandState) => void;
};

function getItems(mode: EditorMode, enableImages: boolean): SlashCommandItem[] {
  const items = [...LESSON_COMMANDS];
  if (mode === "wiki") {
    items.push(...WIKI_EXTRA.filter((item) => item.command !== "/изображение" || enableImages));
  }
  return items;
}

function emptyState(): SlashCommandState {
  return { active: false, items: [], clientRect: null, command: null };
}

export function executeSlashCommand(
  editor: import("@tiptap/core").Editor,
  item: SlashCommandItem,
): void {
  switch (item.command) {
    case "/заголовок":
      editor.chain().focus().toggleHeading({ level: 2 }).run();
      break;
    case "/ссылка":
      editor.commands.focus();
      window.dispatchEvent(new CustomEvent("learn-editor:open-link"));
      break;
    case "/сноска":
      editor.commands.focus();
      window.dispatchEvent(new CustomEvent("learn-editor:open-footnote"));
      break;
    case "/всплывающее":
      editor.commands.focus();
      window.dispatchEvent(new CustomEvent("learn-editor:open-popup"));
      break;
    case "/выноска":
      editor
        .chain()
        .focus()
        .insertContent({
          type: "callout",
          attrs: { calloutType: "info", label: "Информация" },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Текст выноски" }] }],
        })
        .run();
      break;
    case "/таблица":
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      break;
    case "/цитата":
      editor.chain().focus().toggleBlockquote().run();
      break;
    case "/код":
      editor.chain().focus().toggleCodeBlock().run();
      break;
    case "/разделитель":
      editor.chain().focus().setHorizontalRule().run();
      break;
    case "/скрытый":
      editor
        .chain()
        .focus()
        .insertContent({
          type: "details",
          content: [
            { type: "detailsSummary", content: [{ type: "text", text: "Заголовок блока" }] },
            {
              type: "detailsContent",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Скрытое содержимое" }] }],
            },
          ],
        })
        .run();
      break;
    case "/чеклист":
      editor
        .chain()
        .focus()
        .insertContent({
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Пункт" }] }],
            },
          ],
        })
        .run();
      break;
    case "/изображение":
      editor.commands.focus();
      window.dispatchEvent(new CustomEvent("learn-editor:open-image"));
      break;
    case "/оглавление":
      editor.chain().focus().insertWikiToc().run();
      break;
    default:
      break;
  }
}

export const SlashCommands = Extension.create<SlashCommandsOptions>({
  name: "slashCommands",

  addOptions() {
    return {
      mode: "lesson" as EditorMode,
      enableImages: false,
      onStateChange: undefined,
    };
  },

  addProseMirrorPlugins() {
    const { mode, enableImages, onStateChange } = this.options;

    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        pluginKey: slashCommandPluginKey,
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          return $from.parent.type.name !== "codeBlock";
        },
        items: ({ query }) => {
          const all = getItems(mode, enableImages);
          const q = query.toLowerCase();
          return all.filter(
            (item) =>
              item.command.slice(1).startsWith(q) ||
              item.title.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q),
          );
        },
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          executeSlashCommand(editor, props);
        },
        render: () => ({
          onStart: (props: SuggestionProps<SlashCommandItem>) => {
            onStateChange?.({
              active: true,
              items: props.items,
              clientRect: props.clientRect ?? null,
              command: props.command,
            });
          },
          onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
            onStateChange?.({
              active: true,
              items: props.items,
              clientRect: props.clientRect ?? null,
              command: props.command,
            });
          },
          onKeyDown: (props: SuggestionKeyDownProps) => {
            if (props.event.key === "Escape") {
              onStateChange?.(emptyState());
              return true;
            }
            return false;
          },
          onExit: () => {
            onStateChange?.(emptyState());
          },
        }),
      }),
    ];
  },
});
