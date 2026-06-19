import type { Extensions } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import Details from "@tiptap/extension-details";
import DetailsContent from "@tiptap/extension-details-content";
import DetailsSummary from "@tiptap/extension-details-summary";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

import { Callout } from "./Callout";
import { FontSize } from "./FontSize";
import { Footnote } from "./Footnote";
import { LearnImage } from "./LearnImage";
import { Popup } from "./Popup";
import { WikiToc } from "./WikiToc";
import { SlashCommands } from "./SlashCommands";

export type EditorMode = "lesson" | "wiki";

export type BuildEditorExtensionsOptions = {
  mode: EditorMode;
  enableImages: boolean;
  placeholder?: string;
};

export function buildEditorExtensions({
  mode,
  enableImages,
  placeholder = "Начните писать…",
}: BuildEditorExtensionsOptions): Extensions {
  const extensions: Extensions = [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
    }),
    Underline,
    TextStyle,
    FontSize,
    Highlight.configure({ multicolor: false }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Subscript,
    Superscript,
    Typography,
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Details.configure({ persist: true }),
    DetailsSummary,
    DetailsContent,
    TaskList,
    TaskItem.configure({ nested: true }),
    Callout,
    Footnote,
    Popup,
    Placeholder.configure({ placeholder }),
    CharacterCount,
    SlashCommands.configure({ mode, enableImages }),
  ];

  if (enableImages) {
    extensions.push(
      LearnImage.configure({
        inline: false,
        allowBase64: false,
      }),
    );
  }

  if (mode === "wiki") {
    extensions.push(WikiToc);
  }

  return extensions;
}
