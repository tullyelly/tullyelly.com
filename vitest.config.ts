// @ts-nocheck
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";
import path from "node:path";

const reactPlugin = react as unknown as () => PluginOption;

export default defineConfig({
  plugins: [reactPlugin()],
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@components": path.resolve(__dirname, "./components"),
      "@ui": path.resolve(__dirname, "./components/ui"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
    include: ["vitest/**/*.test.{ts,tsx}"],
  },
});
