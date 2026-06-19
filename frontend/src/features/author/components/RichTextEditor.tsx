import { useEditor, EditorContent } from "@tiptap/react";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";

import { nextFootnoteNumber, sanitizeContentHtml } from "../../../utils/contentHtml";
import { AlertModal, CalloutTypeModal, PromptModal } from "../../../components/mui/PromptModal";
import ContentHtml from "../../../components/ContentHtml";
import EditorBubbleMenu from "./EditorBubbleMenu";
import ImageInsertModal, { type ImageInsertResult } from "./ImageInsertModal";
import LinkInsertModal, { type LinkInsertResult } from "./LinkInsertModal";
import RichTextToolbar, { type ToolbarVariant } from "./RichTextToolbar";
import SlashCommandList from "./SlashCommandList";
import { createEditorExtensions, type EditorMode } from "./createEditorExtensions";
import { CALLOUT_LABELS, type CalloutType } from "./extensions/Callout";
import type { SlashCommandState } from "./extensions/SlashCommands";

type ToolbarMode = "full" | "minimal" | "bubble";

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  rows?: number;
  /** @deprecated use editorMode="wiki" */
  enableImages?: boolean;
  editorMode?: EditorMode;
  showPreview?: boolean;
  /**
   * Компактный вид: минимальная панель (или только bubble-меню при toolbarMode="bubble").
   * Без счётчика символов — для вложенных полей (слайд, hotspot, квиз).
   */
  compact?: boolean;
  /** Режим панели форматирования; по умолчанию: compact → minimal, иначе full */
  toolbarMode?: ToolbarMode;
};

type EditorModal =
  | { kind: "footnote"; editContent?: string; editFrom?: number; editTo?: number }
  | { kind: "popup"; editContent?: string; editFrom?: number; editTo?: number }
  | { kind: "callout" }
  | { kind: "image" }
  | { kind: "link"; defaultHref?: string; defaultText?: string }
  | { kind: "alert"; title: string; message: string }
  | null;

export default function RichTextEditor({
  label,
  value,
  onChange,
  rows = 4,
  enableImages = false,
  editorMode,
  showPreview = false,
  compact = false,
  toolbarMode,
}: RichTextEditorProps) {
  const mode: EditorMode = editorMode ?? (enableImages ? "wiki" : "lesson");
  const imagesEnabled = mode === "wiki" || enableImages;
  const resolvedToolbarMode: ToolbarMode = toolbarMode ?? (compact ? "minimal" : "full");
  const showStaticToolbar = resolvedToolbarMode !== "bubble";
  const toolbarVariant: ToolbarVariant = resolvedToolbarMode === "full" ? "full" : "minimal";

  const [modal, setModal] = useState<EditorModal>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(value);
  const [slashState, setSlashState] = useState<SlashCommandState>({
    active: false,
    items: [],
    clientRect: null,
    command: null,
  });

  const extensions = useMemo(
    () => createEditorExtensions(mode, imagesEnabled, setSlashState),
    [mode, imagesEnabled],
  );

  const editor = useEditor({
    extensions,
    content: value || "<p></p>",
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-text-content",
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement | null;
        const footnoteEl = target?.closest("sup.learn-footnote-ref");
        if (footnoteEl) {
          const note = footnoteEl.getAttribute("data-footnote") ?? "";
          const { state } = view;
          const $pos = state.doc.resolve(pos);
          const marks = $pos.marks();
          const footnoteMark = marks.find((mark) => mark.type.name === "footnote");
          if (footnoteMark) {
            const from = $pos.start() + ($pos.parentOffset > 0 ? $pos.parentOffset - 1 : 0);
            setModal({
              kind: "footnote",
              editContent: note,
              editFrom: from,
              editTo: from + 1,
            });
            return true;
          }
        }

        const popupEl = target?.closest("span.learn-popup");
        if (popupEl) {
          const popupText = popupEl.getAttribute("data-popup") ?? "";
          setModal({
            kind: "popup",
            editContent: popupText,
          });
          return true;
        }

        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    const current = editor.getHTML();
    if (value !== current && !sourceMode) {
      editor.commands.setContent(value || "<p></p>", false);
    }
  }, [editor, value, sourceMode]);

  useEffect(() => {
    function onOpenImage() {
      setModal({ kind: "image" });
    }
    function onOpenFootnote() {
      setModal({ kind: "footnote" });
    }
    function onOpenPopup() {
      setModal({ kind: "popup" });
    }
    function onOpenLink() {
      const previousUrl = editor?.getAttributes("link").href as string | undefined;
      const { from, to } = editor?.state.selection ?? { from: 0, to: 0 };
      const selectedText = editor?.state.doc.textBetween(from, to, " ") ?? "";
      setModal({
        kind: "link",
        defaultHref: previousUrl ?? "",
        defaultText: selectedText,
      });
    }
    window.addEventListener("learn-editor:open-image", onOpenImage);
    window.addEventListener("learn-editor:open-footnote", onOpenFootnote);
    window.addEventListener("learn-editor:open-popup", onOpenPopup);
    window.addEventListener("learn-editor:open-link", onOpenLink);
    return () => {
      window.removeEventListener("learn-editor:open-image", onOpenImage);
      window.removeEventListener("learn-editor:open-footnote", onOpenFootnote);
      window.removeEventListener("learn-editor:open-popup", onOpenPopup);
      window.removeEventListener("learn-editor:open-link", onOpenLink);
    };
  }, [editor]);

  const insertFootnote = useCallback(
    (note: string) => {
      if (!editor) {
        return;
      }
      if (modal?.kind === "footnote" && modal.editContent !== undefined) {
        editor.chain().focus().extendMarkRange("footnote").updateAttributes("footnote", { content: note }).run();
        setModal(null);
        return;
      }
      const fnNum = nextFootnoteNumber(editor.getHTML());
      const { empty } = editor.state.selection;
      if (empty) {
        setModal({
          kind: "alert",
          title: "Сноска",
          message: "Поставьте курсор в конец слова или выделите фрагмент для сноски.",
        });
        return;
      }
      editor.chain().focus().setMark("footnote", { fnNum, content: note }).run();
      setModal(null);
    },
    [editor, modal],
  );

  const insertPopup = useCallback(
    (popupText: string) => {
      if (!editor) {
        return;
      }
      if (modal?.kind === "popup" && modal.editContent !== undefined) {
        editor.chain().focus().extendMarkRange("popup").updateAttributes("popup", { content: popupText }).run();
        setModal(null);
        return;
      }
      const { empty } = editor.state.selection;
      if (empty) {
        setModal({
          kind: "alert",
          title: "Всплывающее окно",
          message: "Выделите фразу, к которой нужно добавить всплывающее окно.",
        });
        return;
      }
      editor.chain().focus().setMark("popup", { content: popupText }).run();
      setModal(null);
    },
    [editor, modal],
  );

  const insertCallout = useCallback(
    (calloutType: CalloutType) => {
      if (!editor) {
        return;
      }
      const labelText = CALLOUT_LABELS[calloutType];
      editor
        .chain()
        .focus()
        .insertContent({
          type: "callout",
          attrs: { calloutType, label: labelText },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Текст выноски" }] }],
        })
        .run();
      setModal(null);
    },
    [editor],
  );

  const insertImage = useCallback(
    ({ src, alt, caption, width }: ImageInsertResult) => {
      if (!editor) {
        return;
      }
      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: { src, alt, caption: caption ?? "", width: width ?? "100" },
        })
        .run();
      setModal(null);
    },
    [editor],
  );

  const insertLink = useCallback(
    ({ href, text }: LinkInsertResult) => {
      if (!editor) {
        return;
      }
      const chain = editor.chain().focus();
      if (text) {
        chain.insertContent(`<a href="${href}">${text}</a>`).run();
      } else if (editor.state.selection.empty) {
        chain.insertContent(`<a href="${href}">${href}</a>`).run();
      } else {
        chain.setLink({ href }).run();
      }
      setModal(null);
    },
    [editor],
  );

  function toggleSourceMode() {
    if (!sourceMode) {
      setSourceHtml(editor?.getHTML() ?? value);
      setSourceMode(true);
      return;
    }
    const cleaned = sanitizeContentHtml(sourceHtml);
    onChange(cleaned);
    editor?.commands.setContent(cleaned || "<p></p>", false);
    setSourceMode(false);
  }

  const charCount = editor?.storage.characterCount?.characters?.() ?? 0;
  const slashRect = slashState.clientRect?.();

  return (
    <div className="field rich-text-field">
      <Typography variant="body2" color="text.secondary" component="span" className="rich-text-field-label">
        {label}
      </Typography>
      <div
        className={[
          "rich-text-editor",
          compact ? "rich-text-editor-compact" : "",
          resolvedToolbarMode === "bubble" ? "rich-text-editor-bubble-only" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ minHeight: `${rows * 1.5}rem` }}
      >
        {showStaticToolbar && (
          <RichTextToolbar
            editor={editor}
            mode={mode}
            enableImages={imagesEnabled}
            variant={toolbarVariant}
            sourceMode={sourceMode}
            onToggleSource={toggleSourceMode}
            onOpenLink={() => {
              const previousUrl = editor?.getAttributes("link").href as string | undefined;
              const { from, to } = editor?.state.selection ?? { from: 0, to: 0 };
              const selectedText = editor?.state.doc.textBetween(from, to, " ") ?? "";
              setModal({
                kind: "link",
                defaultHref: previousUrl ?? "",
                defaultText: selectedText,
              });
            }}
            onOpenFootnote={() => setModal({ kind: "footnote" })}
            onOpenPopup={() => setModal({ kind: "popup" })}
            onOpenCallout={() => setModal({ kind: "callout" })}
            onOpenImage={() => setModal({ kind: "image" })}
          />
        )}

        {sourceMode ? (
          <TextField
            multiline
            minRows={rows}
            value={sourceHtml}
            onChange={(event) => setSourceHtml(event.target.value)}
            fullWidth
            className="rich-text-source"
            placeholder="HTML-код статьи"
          />
        ) : (
          <>
            <EditorBubbleMenu
              editor={editor}
              onOpenLink={() => {
                const previousUrl = editor?.getAttributes("link").href as string | undefined;
                setModal({ kind: "link", defaultHref: previousUrl ?? "" });
              }}
            />
            <EditorContent editor={editor} />
            {slashState.active && slashRect && (
              <div
                className="slash-command-anchor"
                style={{
                  position: "fixed",
                  top: slashRect.bottom + 4,
                  left: slashRect.left,
                  zIndex: 1300,
                }}
              >
                <SlashCommandList
                  items={slashState.items}
                  command={(item) => slashState.command?.(item)}
                />
              </div>
            )}
          </>
        )}

        {!sourceMode && !compact && (
          <Typography variant="caption" color="text.secondary" className="rich-text-char-count">
            {charCount} симв. · введите / для команд
          </Typography>
        )}
      </div>

      {showPreview && value.trim() && (
        <div className="rich-text-preview">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Предпросмотр
          </Typography>
          <ContentHtml html={value} className="rich-text-preview-body" />
        </div>
      )}

      <PromptModal
        isOpen={modal?.kind === "footnote"}
        title={modal?.kind === "footnote" && modal.editContent !== undefined ? "Изменить сноску" : "Текст сноски"}
        fieldLabel="Сноска"
        defaultValue={modal?.kind === "footnote" ? modal.editContent : ""}
        placeholder="Введите текст сноски"
        submitLabel={modal?.kind === "footnote" && modal.editContent !== undefined ? "Сохранить" : "Добавить сноску"}
        onSubmit={insertFootnote}
        onCancel={() => setModal(null)}
      />
      <PromptModal
        isOpen={modal?.kind === "popup"}
        title={
          modal?.kind === "popup" && modal.editContent !== undefined ? "Изменить всплывающее окно" : "Всплывающее окно"
        }
        fieldLabel="Текст"
        defaultValue={modal?.kind === "popup" ? modal.editContent : ""}
        placeholder="Текст при наведении или клике"
        submitLabel={modal?.kind === "popup" && modal.editContent !== undefined ? "Сохранить" : "Добавить"}
        onSubmit={insertPopup}
        onCancel={() => setModal(null)}
      />
      <CalloutTypeModal
        isOpen={modal?.kind === "callout"}
        onSubmit={insertCallout}
        onCancel={() => setModal(null)}
      />
      <ImageInsertModal
        isOpen={modal?.kind === "image"}
        onSubmit={insertImage}
        onCancel={() => setModal(null)}
      />
      <LinkInsertModal
        isOpen={modal?.kind === "link"}
        defaultHref={modal?.kind === "link" ? modal.defaultHref : ""}
        defaultText={modal?.kind === "link" ? modal.defaultText : ""}
        onSubmit={insertLink}
        onCancel={() => setModal(null)}
      />
      <AlertModal
        isOpen={modal?.kind === "alert"}
        title={modal?.kind === "alert" ? modal.title : ""}
        message={modal?.kind === "alert" ? modal.message : ""}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
