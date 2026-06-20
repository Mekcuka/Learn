/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppTheme from "../../../components/mui/AppTheme";
import AuthorSlideEditors, { type AuthorSlideEditorsHandle } from "./AuthorSlideEditors";

const { RichTextEditorMock } = vi.hoisted(() => ({
  RichTextEditorMock: vi.fn(
    ({ label, onChange }: { label: string; value: string; onChange: (html: string) => void }) => (
      <button type="button" aria-label={label} onClick={() => onChange(`<p>${label}-updated</p>`)}>
        {label}
      </button>
    ),
  ),
}));

vi.mock("./RichTextEditor", () => ({ default: RichTextEditorMock }));

describe("AuthorSlideEditors", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("keeps drafts local while typing", async () => {
    const onInstructionChange = vi.fn();
    const onSlidePatch = vi.fn();

    await act(async () => {
      root.render(
        <AppTheme>
          <AuthorSlideEditors
            slideId="slide-1"
            instructionHtml=""
            captionHtml=""
            expectedResultHtml=""
            busy={false}
            onInstructionChange={onInstructionChange}
            onSlidePatch={onSlidePatch}
            onUploadClick={vi.fn()}
            onDuplicate={vi.fn()}
            onDelete={vi.fn()}
          />
        </AppTheme>,
      );
    });

    expect(RichTextEditorMock).toHaveBeenCalledTimes(3);

    const captionButton = container.querySelector('button[aria-label="Подсказка"]') as HTMLButtonElement;
    expect(captionButton).not.toBeNull();

    await act(async () => {
      captionButton.click();
    });

    expect(RichTextEditorMock).toHaveBeenCalledTimes(3);
    expect(onSlidePatch).not.toHaveBeenCalled();
    expect(onInstructionChange).not.toHaveBeenCalled();
  });

  it("flush applies pending drafts immediately", async () => {
    const onInstructionChange = vi.fn();
    const onSlidePatch = vi.fn();
    const ref = { current: null as AuthorSlideEditorsHandle | null };

    await act(async () => {
      root.render(
        <AppTheme>
          <AuthorSlideEditors
            ref={(handle) => {
              ref.current = handle;
            }}
            slideId="slide-1"
            instructionHtml=""
            captionHtml=""
            expectedResultHtml=""
            busy={false}
            onInstructionChange={onInstructionChange}
            onSlidePatch={onSlidePatch}
            onUploadClick={vi.fn()}
            onDuplicate={vi.fn()}
            onDelete={vi.fn()}
          />
        </AppTheme>,
      );
    });

    const instructionButton = container.querySelector('button[aria-label="Инструкция"]') as HTMLButtonElement;

    await act(async () => {
      instructionButton.click();
    });

    expect(onInstructionChange).not.toHaveBeenCalled();

    let draft: ReturnType<AuthorSlideEditorsHandle["flush"]> | undefined;
    await act(async () => {
      draft = ref.current?.flush();
    });

    expect(draft).toEqual({
      instruction_html: "<p>Инструкция-updated</p>",
      caption_html: "",
      expected_result_html: "",
    });
    expect(onInstructionChange).toHaveBeenCalledWith("<p>Инструкция-updated</p>");
    expect(onSlidePatch).toHaveBeenCalledWith("slide-1", {
      caption_html: "",
      expected_result_html: "",
    });
  });
});
