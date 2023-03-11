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
  rules: [
    ["sidebar-card", "px-4 bg-white rounded-lg py-3"],
    ["icon-", ({ $$ }) => `h-${$$} w-${$$}`],
  ],
  ignorelist: [
    // adsense
    /adsbygoogle*/,
    // next-font
    /^__className_*/,
    // md related
    // gfm
    "contains-task-list",
    "task-list-item",

    // embed
    "github-embed-title",
    "github-embed",
    "gh-card",
    "youtube-embed",
    /^code-title*/,

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
    "literal-property",
    "property",
    "boolean",
    "comment",
    "constant",
    "string-property",
    "parameter",
    "variable",
    "class-name",
    "key",
    "builtin",
    /^language-*/,

    // katex
    /^math*/,
    /^katex*/,
    /^vlist-*/,
    /^reset-*/,
    /^size*/,
    /^col-align-*/,
    /^op-*/,
    /\*-op$/,
    "base",
    "strut",
    "pstrut",
    "sizing",
    "mop",
    "mord",
    "mtight",
    "msupsub",
    "amsrm",
    "newline",
    "frac-line",
    "mfrac",
    "nulldelimiter",
    "delimcenter",
    "minner",
    "number",
    "macro",
    "function-definition",
    "mclose",
    "mpunct",
    "mopen",
    "mrel",
    "mtable",
    "mspace",
    "mbin",
  ],
});
