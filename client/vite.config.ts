import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@goggles/shared": path.resolve(__dirname, "../shared/dist/index.js"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5174",
    },
  },
  optimizeDeps: {
    exclude: ["@goggles/shared"],
    include: [
      "@uiw/react-codemirror",
      "@codemirror/state",
      "@codemirror/view",
      "@codemirror/language",
      "@codemirror/legacy-modes/mode/stex",
    ],
  },
});
