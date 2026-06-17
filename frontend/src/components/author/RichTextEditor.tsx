import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  rows?: number;
};

export default function RichTextEditor({ label, value, onChange, rows = 4 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-text-content",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "<p></p>", false);
    }
  }, [editor, value]);

  return (
    <label className="field">
      <span>{label}</span>
      <div className="rich-text-editor" style={{ minHeight: `${rows * 1.5}rem` }}>
        <div className="rich-text-toolbar">
          <button
            type="button"
            className="secondary"
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            Ж
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            •
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
    </label>
  );
}
