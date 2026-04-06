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
});
