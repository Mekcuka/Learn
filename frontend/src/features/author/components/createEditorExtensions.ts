import { buildEditorExtensions, type EditorMode } from "./extensions/buildEditorExtensions";
import { SlashCommands, type SlashCommandState } from "./extensions/SlashCommands";

export type { EditorMode };

export function createEditorExtensions(
  mode: EditorMode,
  enableImages: boolean,
  onSlashStateChange: (state: SlashCommandState) => void,
) {
  const extensions = buildEditorExtensions({ mode, enableImages }).filter((ext) => ext.name !== "slashCommands");
  extensions.push(
    SlashCommands.configure({
      mode,
      enableImages,
      onStateChange: onSlashStateChange,
    }),
  );
  return extensions;
}
