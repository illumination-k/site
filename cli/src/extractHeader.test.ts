import type { Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import extractHeader, { headings } from "./extractHeader";

function parse(markdown: string): Root {
  return unified().use(remarkParse).parse(markdown) as Root;
}

describe("headings", () => {
  it("returns an empty list when the AST has no headings", () => {
    const ast = parse("Just a paragraph.\n\nAnother paragraph.\n");
    expect(headings(ast, 3)).toEqual([]);
  });

  it("collects headings up to the requested depth", () => {
    const ast = parse(
      "# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6\n",
    );

    expect(headings(ast, 3)).toEqual([
      { depth: 1, value: "H1" },
      { depth: 2, value: "H2" },
      { depth: 3, value: "H3" },
    ]);
  });

  it("filters out headings deeper than the limit", () => {
    const ast = parse("# Top\n\n## Sub\n\n### Deep\n");
    expect(headings(ast, 2)).toEqual([
      { depth: 1, value: "Top" },
      { depth: 2, value: "Sub" },
    ]);
  });

  it("treats depth=1 as 'only top-level headings'", () => {
    const ast = parse("# Only\n\n## Excluded\n\n### Also Excluded\n");
    expect(headings(ast, 1)).toEqual([{ depth: 1, value: "Only" }]);
  });

  it("includes all six heading levels when depth is 6", () => {
    const ast = parse(
      "# A\n\n## B\n\n### C\n\n#### D\n\n##### E\n\n###### F\n",
    );
    const result = headings(ast, 6);
    expect(result).toHaveLength(6);
    expect(result.map((h) => h.depth)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("preserves heading order from the source document", () => {
    const ast = parse("## First\n\n# Second\n\n## Third\n");
    expect(headings(ast, 3)).toEqual([
      { depth: 2, value: "First" },
      { depth: 1, value: "Second" },
      { depth: 2, value: "Third" },
    ]);
  });

  it("flattens inline markup inside headings to plain text", () => {
    const ast = parse("# Hello **bold** and `code`\n");
    expect(headings(ast, 3)).toEqual([
      { depth: 1, value: "Hello bold and code" },
    ]);
  });

  it("excludes image alt text from heading values", () => {
    const ast = parse("# Title ![alt text](img.png) suffix\n");
    expect(headings(ast, 3)).toEqual([{ depth: 1, value: "Title  suffix" }]);
  });
});

describe("extractHeader compiler", () => {
  function compile(markdown: string, depth?: number) {
    const processor = unified().use(remarkParse);
    // Assigning the compiler bypasses unified's type narrowing, but is the
    // documented escape hatch for plugins that produce non-tree output.
    // @ts-ignore - assigning compiler on the processor
    processor.compiler = extractHeader(
      depth !== undefined ? { depth } : undefined,
    );
    return processor.processSync(markdown);
  }

  it("attaches headings to file.data using the default depth (3)", () => {
    const file = compile("# A\n\n## B\n\n### C\n\n#### D\n");
    expect(file.data.headings).toEqual([
      { depth: 1, value: "A" },
      { depth: 2, value: "B" },
      { depth: 3, value: "C" },
    ]);
  });

  it("respects an explicit depth option", () => {
    const file = compile("# A\n\n## B\n\n### C\n", 2);
    expect(file.data.headings).toEqual([
      { depth: 1, value: "A" },
      { depth: 2, value: "B" },
    ]);
  });

  it("produces an empty string as the compiled output", () => {
    const file = compile("# A\n");
    expect(String(file)).toBe("");
  });

  it("sets headings to an empty array for documents without headings", () => {
    const file = compile("Just text, no headings.\n");
    expect(file.data.headings).toEqual([]);
  });
});
