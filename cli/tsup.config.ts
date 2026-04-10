import { defineConfig } from "tsup";

export default defineConfig({
  entry: { main: "src/index.ts" },
  format: ["esm"],
  target: "es2022",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  external: [
    "sharp",
    "playwright",
    "playwright-core",
    "chromium-bidi",
    "mermaid-isomorphic",
  ],
  noExternal: ["common", "md-plugins", "ipynb2md"],
});
