import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    exclude: ["e2e/**", "node_modules/**"],
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
    },
  },
  resolve: {
    alias: [
      {
        find: /^@\/(.+)/,
        replacement: "/src/$1",
      },
    ],
  },
});
