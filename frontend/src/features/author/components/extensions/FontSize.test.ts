/**
 * @vitest-environment jsdom
 */
import { Editor } from "@tiptap/core";
import { describe, expect, it, afterEach } from "vitest";

import { buildEditorExtensions } from "./buildEditorExtensions";

function createEditor(content = "<p>Hello world</p>") {
  return new Editor({
    extensions: buildEditorExtensions({ mode: "lesson", enableImages: false }),
    content,
  });
}

describe("FontSize extension", () => {
  const editors: Editor[] = [];

  afterEach(() => {
    editors.forEach((editor) => editor.destroy());
    editors.length = 0;
  });

  function trackEditor(content?: string) {
    const editor = createEditor(content);
    editors.push(editor);
    return editor;
  }

  it("applies font size to selected text", () => {
    const editor = trackEditor();
    editor.commands.selectAll();
    const applied = editor.chain().focus().setFontSize("18px").run();

    expect(applied).toBe(true);
    expect(editor.getHTML()).toContain("font-size: 18px");
    expect(editor.isActive("textStyle", { fontSize: "18px" })).toBe(true);
  });

  it("persists font size in HTML output", () => {
    const editor = trackEditor();
    editor.commands.selectAll();
    editor.chain().focus().setFontSize("24px").run();

    const html = editor.getHTML();
    expect(html).toMatch(/font-size:\s*24px/);

    const reloaded = trackEditor(html);
    expect(reloaded.isActive("textStyle", { fontSize: "24px" })).toBe(true);
  });

  it("unsets font size", () => {
    const editor = trackEditor('<p><span style="font-size: 18px">Hello</span></p>');
    editor.commands.selectAll();
    editor.chain().focus().unsetFontSize().run();

    expect(editor.getHTML()).not.toContain("font-size");
  });

  it("applies font size to next typed text when selection is empty", () => {
    const editor = trackEditor("<p></p>");
    editor.commands.focus("end");
    const applied = editor.chain().focus().setFontSize("24px").run();
    expect(applied).toBe(true);
    editor.commands.insertContent("Big text");
    expect(editor.getHTML()).toMatch(/font-size:\s*24px/);
  });

  it("applies font size to entire text block when selection is collapsed", () => {
    const editor = trackEditor("<p>Hello world</p>");
    editor.commands.focus("end");
    const applied = editor.chain().focus().setFontSize("18px").run();
    expect(applied).toBe(true);
    expect(editor.getHTML()).toMatch(/font-size:\s*18px/);
    expect(editor.getHTML()).toContain("Hello world");
  });

  it("exposes setFontSize command in lesson editor extensions", () => {
    const editor = trackEditor();
    expect(editor.can().setFontSize("18px")).toBe(true);
  });
});
