import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }
          if (id.includes("@tiptap") || id.includes("prosemirror")) {
            return "vendor-tiptap";
          }
          if (id.includes("@mui") || id.includes("@emotion")) {
            return "vendor-mui";
          }
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("react-router") ||
            id.includes("scheduler/")
          ) {
            return "vendor-react";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      "/health": "http://localhost:8000",
    },
  },
});
