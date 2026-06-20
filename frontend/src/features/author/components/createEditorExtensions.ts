import { buildEditorExtensions, type EditorMode } from "./extensions/buildEditorExtensions";
import { SlashCommands, type SlashCommandState } from "./extensions/SlashCommands";

export type { EditorMode };

export type CreateEditorExtensionsOptions = {
  /** Меньше расширений для вложенных полей (слайд, hotspot) — быстрее ввод. */
  lightweight?: boolean;
};

export function createEditorExtensions(
  mode: EditorMode,
  enableImages: boolean,
  onSlashStateChange: (state: SlashCommandState) => void,
  options: CreateEditorExtensionsOptions = {},
) {
  const extensions = buildEditorExtensions({ mode, enableImages, lightweight: options.lightweight }).filter(
    (ext) => ext.name !== "slashCommands",
  );
  extensions.push(
    SlashCommands.configure({
      mode,
      enableImages,
      onStateChange: onSlashStateChange,
    }),
  );
  return extensions;
}
