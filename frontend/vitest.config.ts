import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const tippyMock = path.resolve(root, "src/test/mocks/tippy.ts");

export default defineConfig({
  resolve: {
    alias: {
      "tippy.js": tippyMock,
      "tippy.js/dist/tippy.esm.js": tippyMock,
    },
  },
  test: {
    exclude: ["**/node_modules/**", "**/e2e/**"],
    server: {
      deps: {
        inline: ["@tiptap/extension-bubble-menu", "tippy.js", "@tiptap/react"],
      },
    },
  },
});
