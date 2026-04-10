import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { REHYPE_PLUGINS, REMARK_LINT_PLUGINS, REMARK_PLUGINS } from "./index";

describe("plugin exports", () => {
  it("REMARK_PLUGINS is a non-empty array", () => {
    expect(Array.isArray(REMARK_PLUGINS)).toBe(true);
    expect(REMARK_PLUGINS.length).toBeGreaterThan(0);
  });

  it("REMARK_PLUGINS contains expected plugin count", () => {
    // remarkGfm, remarkMath, remarkDirective, attachIdToHeadings, codeTitle,
    // DetailsDirective, FigureDirective, remarkDirectiveEmbedGenerator, remarkMdx
    expect(REMARK_PLUGINS.length).toBe(9);
  });

  it("REHYPE_PLUGINS contains rehypeKatex, rehypeMermaid, rehypePrism", () => {
    expect(REHYPE_PLUGINS).toHaveProperty("rehypeKatex");
    expect(REHYPE_PLUGINS).toHaveProperty("rehypeMermaid");
    expect(REHYPE_PLUGINS).toHaveProperty("rehypePrism");
    expect(typeof REHYPE_PLUGINS.rehypeKatex).toBe("function");
    expect(typeof REHYPE_PLUGINS.rehypePrism).toBe("function");
  });

  it("REHYPE_PLUGINS has exactly 3 keys", () => {
    expect(Object.keys(REHYPE_PLUGINS)).toHaveLength(3);
  });

  it("REMARK_LINT_PLUGINS is a non-empty array", () => {
    expect(Array.isArray(REMARK_LINT_PLUGINS)).toBe(true);
    expect(REMARK_LINT_PLUGINS.length).toBeGreaterThan(0);
  });

  it("REMARK_LINT_PLUGINS contains exactly 1 plugin", () => {
    expect(REMARK_LINT_PLUGINS).toHaveLength(1);
  });

  it("all REMARK_PLUGINS entries are functions or arrays", () => {
    for (const plugin of REMARK_PLUGINS) {
      expect(
        typeof plugin === "function" || Array.isArray(plugin),
      ).toBeTruthy();
    }
  });

  it("REMARK_PLUGINS pipeline transforms ::youtube leaf directives", async () => {
    // Integration guard: the transformer list passed to
    // remarkDirectiveEmbedGenerator must include a YouTubeTransformer
    // (otherwise the ::youtube directive would fall through unhandled).
    const processor = unified()
      .use(remarkParse)
      // Apply every plugin EXCEPT remarkMdx (the last entry), which would
      // otherwise try to parse the input as MDX and break remark-stringify.
      .use(REMARK_PLUGINS.slice(0, -1))
      .use(remarkRehype)
      .use(rehypeStringify);

    const vfile = await processor.process("::youtube[dQw4w9WgXcQ]");
    const html = String(vfile.value);
    expect(html).toContain('src="https://www.youtube.com/embed/dQw4w9WgXcQ"');
    expect(html).toContain("<iframe");
  });

  it("REMARK_PLUGINS pipeline transforms ::gh-card leaf directives", async () => {
    // Integration guard: GithubCardTransformer must be in the transformer list.
    const processor = unified()
      .use(remarkParse)
      .use(REMARK_PLUGINS.slice(0, -1))
      .use(remarkRehype)
      .use(rehypeStringify);

    const vfile = await processor.process("::gh-card[user/repo]");
    const html = String(vfile.value);
    expect(html).toContain('class="gh-card"');
  });
});
