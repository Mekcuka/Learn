import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import HighlightIcon from "@mui/icons-material/Highlight";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import LinkIcon from "@mui/icons-material/Link";
import RedoIcon from "@mui/icons-material/Redo";
import TableChartIcon from "@mui/icons-material/TableChart";
import UndoIcon from "@mui/icons-material/Undo";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { useState } from "react";

import { FONT_SIZE_PRESETS, type FontSizeValue } from "./extensions/FontSize";
import type { EditorMode } from "./extensions/buildEditorExtensions";

export type ToolbarVariant = "full" | "minimal";

type TextSelectionRange = { from: number; to: number };

/** Keep ProseMirror text selection when interacting with toolbar controls. */
function preventToolbarFocusLoss(event: React.MouseEvent) {
  event.preventDefault();
}

function applyFontSize(editor: Editor, fontSize: FontSizeValue, savedSelection: TextSelectionRange | null) {
  let chain = editor.chain().focus();
  if (savedSelection) {
    chain = chain.setTextSelection(savedSelection);
  }
  chain.setFontSize(fontSize).run();
}

function unsetFontSize(editor: Editor, savedSelection: TextSelectionRange | null) {
  let chain = editor.chain().focus();
  if (savedSelection) {
    chain = chain.setTextSelection(savedSelection);
  }
  chain.unsetFontSize().run();
}

type RichTextToolbarProps = {
  editor: Editor | null;
  mode: EditorMode;
  enableImages: boolean;
  variant?: ToolbarVariant;
  sourceMode: boolean;
  onToggleSource: () => void;
  onOpenLink: () => void;
  onOpenFootnote: () => void;
  onOpenPopup: () => void;
  onOpenCallout: () => void;
  onOpenImage: () => void;
};

function useToolbarFormatState(editor: Editor | null) {
  return useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) {
        return null;
      }
      return {
        bold: current.isActive("bold"),
        italic: current.isActive("italic"),
        underline: current.isActive("underline"),
        strike: current.isActive("strike"),
        highlight: current.isActive("highlight"),
        bulletList: current.isActive("bulletList"),
        orderedList: current.isActive("orderedList"),
        blockquote: current.isActive("blockquote"),
        code: current.isActive("code"),
        codeBlock: current.isActive("codeBlock"),
        paragraph: current.isActive("paragraph"),
        heading2: current.isActive("heading", { level: 2 }),
        heading3: current.isActive("heading", { level: 3 }),
        heading4: current.isActive("heading", { level: 4 }),
        alignLeft: current.isActive({ textAlign: "left" }),
        alignCenter: current.isActive({ textAlign: "center" }),
        alignRight: current.isActive({ textAlign: "right" }),
        link: current.isActive("link"),
        fontSize: FONT_SIZE_PRESETS.find((preset) => current.isActive("textStyle", { fontSize: preset.value }))
          ?.value ?? null,
      };
    },
  });
}

function ToolbarToggle({
  action,
  active,
  title,
  children,
}: {
  action: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={title}>
      <ToggleButton
        size="small"
        value={title}
        selected={active}
        onMouseDown={preventToolbarFocusLoss}
        onClick={() => {
          action();
        }}
        aria-label={title}
        aria-pressed={active}
      >
        {children}
      </ToggleButton>
    </Tooltip>
  );
}

export default function RichTextToolbar({
  editor,
  mode,
  enableImages,
  variant = "full",
  sourceMode,
  onToggleSource,
  onOpenLink,
  onOpenFootnote,
  onOpenPopup,
  onOpenCallout,
  onOpenImage,
}: RichTextToolbarProps) {
  const [headingAnchor, setHeadingAnchor] = useState<null | HTMLElement>(null);
  const [fontSizeAnchor, setFontSizeAnchor] = useState<null | HTMLElement>(null);
  const [savedTextSelection, setSavedTextSelection] = useState<TextSelectionRange | null>(null);
  const [tableAnchor, setTableAnchor] = useState<null | HTMLElement>(null);
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
  const format = useToolbarFormatState(editor);

  if (!editor || sourceMode) {
    return (
      <div className="rich-text-toolbar" role="toolbar" aria-label="Форматирование">
        <Button size="small" variant={sourceMode ? "contained" : "outlined"} onClick={onToggleSource}>
          {sourceMode ? "Визуальный редактор" : "Исходный код"}
        </Button>
      </div>
    );
  }

  const headingLevel = format?.heading4 ? 4 : format?.heading3 ? 3 : format?.heading2 ? 2 : 0;
  const activeFontSize = format?.fontSize ?? null;

  if (variant === "minimal") {
    return (
      <div className="rich-text-toolbar rich-text-toolbar-minimal" role="toolbar" aria-label="Форматирование">
        <ToggleButtonGroup size="small" exclusive>
          <ToolbarToggle
            title="Жирный"
            active={format?.bold ?? false}
            action={() => editor.chain().focus().toggleBold().run()}
          >
            <FormatBoldIcon fontSize="small" />
          </ToolbarToggle>
          <ToolbarToggle
            title="Курсив"
            active={format?.italic ?? false}
            action={() => editor.chain().focus().toggleItalic().run()}
          >
            <FormatItalicIcon fontSize="small" />
          </ToolbarToggle>
          <ToolbarToggle
            title="Подчёркнутый"
            active={format?.underline ?? false}
            action={() => editor.chain().focus().toggleUnderline().run()}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </ToolbarToggle>
          <ToolbarToggle
            title="Зачёркнутый"
            active={format?.strike ?? false}
            action={() => editor.chain().focus().toggleStrike().run()}
          >
            <FormatStrikethroughIcon fontSize="small" />
          </ToolbarToggle>
        </ToggleButtonGroup>

        <Tooltip title="Вставить или изменить ссылку">
          <Button
            size="small"
            variant="outlined"
            startIcon={<LinkIcon fontSize="small" />}
            onClick={onOpenLink}
            aria-label="Ссылка"
          >
            Ссылка
          </Button>
        </Tooltip>

        <Tooltip title="Списки, цитаты, сноски и другие элементы">
          <Button
            size="small"
            variant="outlined"
            onClick={(event) => setMoreAnchor(event.currentTarget)}
            aria-haspopup="true"
            aria-label="Дополнительное форматирование"
          >
            Ещё
          </Button>
        </Tooltip>
        <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
          <MenuItem
            onClick={() => {
              editor.chain().focus().toggleBulletList().run();
              setMoreAnchor(null);
            }}
          >
            Маркированный список
          </MenuItem>
          <MenuItem
            onClick={() => {
              editor.chain().focus().toggleOrderedList().run();
              setMoreAnchor(null);
            }}
          >
            Нумерованный список
          </MenuItem>
          <MenuItem
            onClick={() => {
              editor.chain().focus().toggleBlockquote().run();
              setMoreAnchor(null);
            }}
          >
            Цитата
          </MenuItem>
          <MenuItem
            onClick={() => {
              editor.chain().focus().toggleHighlight().run();
              setMoreAnchor(null);
            }}
          >
            Выделение
          </MenuItem>
          <MenuItem
            onClick={() => {
              editor.chain().focus().toggleCode().run();
              setMoreAnchor(null);
            }}
          >
            Код
          </MenuItem>
          <MenuItem onClick={onOpenFootnote}>Сноска</MenuItem>
          <MenuItem onClick={onOpenCallout}>Выноска</MenuItem>
          <MenuItem onClick={onOpenPopup}>Всплывающее окно</MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              editor.chain().focus().undo().run();
              setMoreAnchor(null);
            }}
          >
            Отменить
          </MenuItem>
          <MenuItem
            onClick={() => {
              editor.chain().focus().redo().run();
              setMoreAnchor(null);
            }}
          >
            Повторить
          </MenuItem>
          <MenuItem
            onClick={() => {
              onToggleSource();
              setMoreAnchor(null);
            }}
          >
            Исходный код
          </MenuItem>
        </Menu>
      </div>
    );
  }

  return (
    <div className="rich-text-toolbar" role="toolbar" aria-label="Форматирование">
      <ToggleButtonGroup size="small" exclusive>
        <ToolbarToggle
          title="Жирный"
          active={format?.bold ?? false}
          action={() => editor.chain().focus().toggleBold().run()}
        >
          <FormatBoldIcon fontSize="small" />
        </ToolbarToggle>
        <ToolbarToggle
          title="Курсив"
          active={format?.italic ?? false}
          action={() => editor.chain().focus().toggleItalic().run()}
        >
          <FormatItalicIcon fontSize="small" />
        </ToolbarToggle>
        <ToolbarToggle
          title="Подчёркнутый"
          active={format?.underline ?? false}
          action={() => editor.chain().focus().toggleUnderline().run()}
        >
          <FormatUnderlinedIcon fontSize="small" />
        </ToolbarToggle>
        <ToolbarToggle
          title="Зачёркнутый"
          active={format?.strike ?? false}
          action={() => editor.chain().focus().toggleStrike().run()}
        >
          <FormatStrikethroughIcon fontSize="small" />
        </ToolbarToggle>
        <ToolbarToggle
          title="Выделение"
          active={format?.highlight ?? false}
          action={() => editor.chain().focus().toggleHighlight().run()}
        >
          <HighlightIcon fontSize="small" />
        </ToolbarToggle>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" />

      <Tooltip title={headingLevel ? `Заголовок H${headingLevel}` : "Заголовок"}>
        <Button
          size="small"
          variant={headingLevel ? "contained" : "outlined"}
          onClick={(event) => setHeadingAnchor(event.currentTarget)}
          aria-haspopup="true"
        >
          {headingLevel ? `H${headingLevel}` : "Заголовок"}
        </Button>
      </Tooltip>
      <Menu anchorEl={headingAnchor} open={Boolean(headingAnchor)} onClose={() => setHeadingAnchor(null)}>
        <MenuItem
          selected={format?.paragraph ?? false}
          onClick={() => {
            editor.chain().focus().setParagraph().run();
            setHeadingAnchor(null);
          }}
        >
          Обычный текст
        </MenuItem>
        {([2, 3, 4] as const).map((level) => (
          <MenuItem
            key={level}
            selected={level === 2 ? (format?.heading2 ?? false) : level === 3 ? (format?.heading3 ?? false) : (format?.heading4 ?? false)}
            onClick={() => {
              editor.chain().focus().toggleHeading({ level }).run();
              setHeadingAnchor(null);
            }}
          >
            Заголовок H{level}
          </MenuItem>
        ))}
      </Menu>

      <Tooltip title={activeFontSize ? `Размер шрифта ${activeFontSize}` : "Размер шрифта"}>
        <Button
          size="small"
          variant={activeFontSize ? "contained" : "outlined"}
          onMouseDown={preventToolbarFocusLoss}
          onClick={(event) => {
            const { from, to } = editor.state.selection;
            setSavedTextSelection({ from, to });
            setFontSizeAnchor(event.currentTarget);
          }}
          aria-haspopup="true"
        >
          {activeFontSize ?? "Размер"}
        </Button>
      </Tooltip>
      <Menu
        anchorEl={fontSizeAnchor}
        open={Boolean(fontSizeAnchor)}
        onClose={() => {
          setFontSizeAnchor(null);
          setSavedTextSelection(null);
        }}
      >
        <MenuItem
          selected={!activeFontSize}
          onMouseDown={preventToolbarFocusLoss}
          onClick={() => {
            unsetFontSize(editor, savedTextSelection);
            setFontSizeAnchor(null);
            setSavedTextSelection(null);
          }}
        >
          По умолчанию
        </MenuItem>
        {FONT_SIZE_PRESETS.map((preset) => (
          <MenuItem
            key={preset.value}
            selected={activeFontSize === preset.value}
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => {
              applyFontSize(editor, preset.value, savedTextSelection);
              setFontSizeAnchor(null);
              setSavedTextSelection(null);
            }}
          >
            {preset.label} ({preset.value})
          </MenuItem>
        ))}
      </Menu>

      <ToggleButtonGroup size="small" exclusive>
        <ToolbarToggle
          title="Маркированный список"
          active={format?.bulletList ?? false}
          action={() => editor.chain().focus().toggleBulletList().run()}
        >
          <FormatListBulletedIcon fontSize="small" />
        </ToolbarToggle>
        <ToolbarToggle
          title="Нумерованный список"
          active={format?.orderedList ?? false}
          action={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <FormatListNumberedIcon fontSize="small" />
        </ToolbarToggle>
        <ToolbarToggle
          title="Цитата"
          active={format?.blockquote ?? false}
          action={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <FormatQuoteIcon fontSize="small" />
        </ToolbarToggle>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" />

      <ToggleButtonGroup size="small" exclusive>
        <ToolbarToggle
          title="Код"
          active={format?.code ?? false}
          action={() => editor.chain().focus().toggleCode().run()}
        >
          {"</>"}
        </ToolbarToggle>
        <ToolbarToggle
          title="Блок кода"
          active={format?.codeBlock ?? false}
          action={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          {"{ }"}
        </ToolbarToggle>
        <ToolbarToggle
          title="Разделитель"
          active={false}
          action={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <HorizontalRuleIcon fontSize="small" />
        </ToolbarToggle>
      </ToggleButtonGroup>

      <ToggleButtonGroup size="small" exclusive>
        <ToolbarToggle
          title="По левому краю"
          active={format?.alignLeft ?? false}
          action={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <FormatAlignLeftIcon fontSize="small" />
        </ToolbarToggle>
        <ToolbarToggle
          title="По центру"
          active={format?.alignCenter ?? false}
          action={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <FormatAlignCenterIcon fontSize="small" />
        </ToolbarToggle>
        <ToolbarToggle
          title="По правому краю"
          active={format?.alignRight ?? false}
          action={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <FormatAlignRightIcon fontSize="small" />
        </ToolbarToggle>
      </ToggleButtonGroup>

      <Divider flexItem orientation="vertical" />

      <Tooltip title="Вставить или изменить ссылку">
        <Button size="small" variant="outlined" startIcon={<LinkIcon fontSize="small" />} onClick={onOpenLink}>
          Ссылка
        </Button>
      </Tooltip>

      <Tooltip title="Таблица: вставка и редактирование">
        <Button
          size="small"
          variant="outlined"
          startIcon={<TableChartIcon fontSize="small" />}
          onClick={(event) => setTableAnchor(event.currentTarget)}
        >
          Таблица
        </Button>
      </Tooltip>
      <Menu anchorEl={tableAnchor} open={Boolean(tableAnchor)} onClose={() => setTableAnchor(null)}>
        <MenuItem
          onClick={() => {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            setTableAnchor(null);
          }}
        >
          Вставить таблицу
        </MenuItem>
        <MenuItem
          disabled={!editor.can().addRowAfter()}
          onClick={() => {
            editor.chain().focus().addRowAfter().run();
            setTableAnchor(null);
          }}
        >
          Добавить строку
        </MenuItem>
        <MenuItem
          disabled={!editor.can().addColumnAfter()}
          onClick={() => {
            editor.chain().focus().addColumnAfter().run();
            setTableAnchor(null);
          }}
        >
          Добавить столбец
        </MenuItem>
        <MenuItem
          disabled={!editor.can().deleteRow()}
          onClick={() => {
            editor.chain().focus().deleteRow().run();
            setTableAnchor(null);
          }}
        >
          Удалить строку
        </MenuItem>
        <MenuItem
          disabled={!editor.can().deleteColumn()}
          onClick={() => {
            editor.chain().focus().deleteColumn().run();
            setTableAnchor(null);
          }}
        >
          Удалить столбец
        </MenuItem>
        <MenuItem
          disabled={!editor.can().deleteTable()}
          onClick={() => {
            editor.chain().focus().deleteTable().run();
            setTableAnchor(null);
          }}
        >
          Удалить таблицу
        </MenuItem>
      </Menu>

      <Tooltip title="Дополнительные элементы: сноска, выноска, чеклист…">
        <Button
          size="small"
          variant="outlined"
          onClick={(event) => setMoreAnchor(event.currentTarget)}
        >
          Ещё
        </Button>
      </Tooltip>
      <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleSubscript().run();
            setMoreAnchor(null);
          }}
        >
          Подстрочный
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleSuperscript().run();
            setMoreAnchor(null);
          }}
        >
          Надстрочный
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor
              .chain()
              .focus()
              .insertContent({
                type: "details",
                content: [
                  { type: "detailsSummary", content: [{ type: "text", text: "Заголовок" }] },
                  {
                    type: "detailsContent",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Содержимое" }] }],
                  },
                ],
              })
              .run();
            setMoreAnchor(null);
          }}
        >
          Скрываемый блок
        </MenuItem>
        <MenuItem
          onClick={() => {
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
            setMoreAnchor(null);
          }}
        >
          Чеклист
        </MenuItem>
        {mode === "wiki" && (
          <MenuItem
            onClick={() => {
              editor.chain().focus().insertWikiToc().run();
              setMoreAnchor(null);
            }}
          >
            Оглавление
          </MenuItem>
        )}
        <MenuItem onClick={onOpenFootnote}>Сноска</MenuItem>
        <MenuItem onClick={onOpenCallout}>Выноска</MenuItem>
        <MenuItem onClick={onOpenPopup}>Всплывающее окно</MenuItem>
        {enableImages && (
          <MenuItem
            onClick={() => {
              onOpenImage();
              setMoreAnchor(null);
            }}
          >
            Изображение
          </MenuItem>
        )}
      </Menu>

      <Divider flexItem orientation="vertical" />

      <Tooltip title="Отменить последнее действие">
        <Button
          size="small"
          variant="outlined"
          onClick={() => editor.chain().focus().undo().run()}
          aria-label="Отменить"
        >
          <UndoIcon fontSize="small" />
        </Button>
      </Tooltip>
      <Tooltip title="Повторить отменённое действие">
        <Button
          size="small"
          variant="outlined"
          onClick={() => editor.chain().focus().redo().run()}
          aria-label="Повторить"
        >
          <RedoIcon fontSize="small" />
        </Button>
      </Tooltip>

      <Tooltip title="Редактировать HTML-код напрямую">
        <Button size="small" variant="outlined" onClick={onToggleSource}>
          Исходный код
        </Button>
      </Tooltip>
    </div>
  );
}
