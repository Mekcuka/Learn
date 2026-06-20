/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";

const { useEditorMock } = vi.hoisted(() => ({
  useEditorMock: vi.fn(() => ({ getHTML: () => "<p></p>", commands: { setContent: vi.fn() } })),
}));

vi.mock("@tiptap/react", async () => {
  const actual = await vi.importActual<typeof import("@tiptap/react")>("@tiptap/react");
  return {
    ...actual,
    useEditor: useEditorMock,
    EditorContent: () => null,
    useEditorState: vi.fn(() => 0),
  };
});

vi.mock("./RichTextToolbar", () => ({ default: () => null }));
vi.mock("./EditorBubbleMenu", () => ({ default: () => null }));
vi.mock("./SlashCommandList", () => ({ default: () => null }));
vi.mock("../../wiki/components/ContentHtml", () => ({ default: () => null }));
vi.mock("../../../components/mui/PromptModal", () => ({
  AlertModal: () => null,
  CalloutTypeModal: () => null,
  PromptModal: () => null,
}));
vi.mock("./ImageInsertModal", () => ({ default: () => null }));
vi.mock("./LinkInsertModal", () => ({ default: () => null }));

import { act } from "react";
import { createRoot } from "react-dom/client";

import AppTheme from "../../../components/mui/AppTheme";
import RichTextEditor from "./RichTextEditor";

describe("RichTextEditor", () => {
  it("disables transaction-driven rerenders for TipTap", async () => {
    useEditorMock.mockClear();

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <AppTheme>
          <RichTextEditor label="Тест" value="" onChange={vi.fn()} compact />
        </AppTheme>,
      );
    });

    expect(useEditorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shouldRerenderOnTransaction: false,
        immediatelyRender: true,
      }),
    );

    await act(async () => {
      root.unmount();
    });
  });
});
