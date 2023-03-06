import { defineConfig } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";

/** @type {import('twind-core').defineConfig} */
export default defineConfig({
  /* @twind/with-next will use hashed class names in production by default
   * If you don't want this, uncomment the next line
   */
  // hash: false,
  presets: [presetAutoprefix(), presetTailwind()],
  ignorelist: [
    // md related
    "line-number",
    "contains-task-list",
    "task-list-item",
    "github-embed-title",
    "code-highlight",
    "code-line",
    "token",
    "keyword",
    "string",
    "punctuation",
    "function",
    "operator",
    /language-*/,
  ],
});
