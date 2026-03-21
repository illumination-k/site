import { defineConfig } from "tsup";

export default defineConfig({
  entry: { main: "index.ts" },
  format: ["cjs"],
  target: "es2022",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  external: ["sharp"],
  noExternal: ["common", "md-plugins", "ipynb2md"],
});
