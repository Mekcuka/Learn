import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import HighlightIcon from "@mui/icons-material/Highlight";
import LinkIcon from "@mui/icons-material/Link";
import Paper from "@mui/material/Paper";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { BubbleMenu, type Editor, useEditorState } from "@tiptap/react";

type EditorBubbleMenuProps = {
  editor: Editor | null;
  onOpenLink: () => void;
};

export default function EditorBubbleMenu({ editor, onOpenLink }: EditorBubbleMenuProps) {
  const format = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) {
        return null;
      }
      return {
        bold: current.isActive("bold"),
        italic: current.isActive("italic"),
        underline: current.isActive("underline"),
        highlight: current.isActive("highlight"),
        link: current.isActive("link"),
      };
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: "top" }}
      className="editor-bubble-menu"
    >
      <Paper elevation={4} className="editor-bubble-menu-inner">
        <ToggleButtonGroup size="small">
          <Tooltip title="Жирный">
            <ToggleButton
              value="bold"
              selected={format?.bold ?? false}
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-label="Жирный"
            >
              <FormatBoldIcon fontSize="small" />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Курсив">
            <ToggleButton
              value="italic"
              selected={format?.italic ?? false}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              aria-label="Курсив"
            >
              <FormatItalicIcon fontSize="small" />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Подчёркнутый">
            <ToggleButton
              value="underline"
              selected={format?.underline ?? false}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              aria-label="Подчёркнутый"
            >
              <FormatUnderlinedIcon fontSize="small" />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Выделение">
            <ToggleButton
              value="highlight"
              selected={format?.highlight ?? false}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              aria-label="Выделение"
            >
              <HighlightIcon fontSize="small" />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Ссылка">
            <ToggleButton value="link" selected={format?.link ?? false} onClick={onOpenLink} aria-label="Ссылка">
              <LinkIcon fontSize="small" />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      </Paper>
    </BubbleMenu>
  );
}
