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
    // gfm
    "contains-task-list",
    "task-list-item",

    // embed
    "github-embed-title",
    "github-embed",
    "gh-card",
    // prisma
    "line-number",
    "code-highlight",
    "code-line",
    "token",
    "keyword",
    "string",
    "punctuation",
    "function",
    "operator",
    /language-*/,

    // katex
    /math*/,
    /katex*/,
    /vlist-*/,
    "base",
    "strut",
    "pstrut",
    "sizing",
    /reset-*/,
    /size*/,
    "mop",
    "mord",
    "mtight",
    "op-symbol",
    "small-op",
    "msupsub",
  ],
});
