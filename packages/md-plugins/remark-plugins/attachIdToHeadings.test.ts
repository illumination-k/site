import attachIdToHeadings from "./attachIdToHeadings";

import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

function createProcessor(depth?: number) {
  return unified()
    .use(remarkParse)
    .use(attachIdToHeadings, depth !== undefined ? { depth } : undefined)
    .use(remarkRehype)
    .use(rehypeStringify);
}

describe("attachIdToHeadings", () => {
  it("assigns sequential IDs to h1 and h2", async () => {
    const vfile = await createProcessor().process("# h1\n## h2 ## h3");
    expect(vfile.value).toStrictEqual(
      '<h1 id="0">h1</h1>\n<h2 id="1">h2 ## h3</h2>',
    );
  });

  it("assigns IDs up to default depth 3", async () => {
    const vfile = await createProcessor().process(
      "# h1\n## h2\n### h3\n#### h4",
    );
    const html = String(vfile.value);
    expect(html).toContain('<h1 id="0">');
    expect(html).toContain('<h2 id="1">');
    expect(html).toContain('<h3 id="2">');
    // h4 should NOT have an id (depth 4 > default 3)
    expect(html).toContain("<h4>");
    expect(html).not.toContain('<h4 id=');
  });

  it("respects custom depth=1 (only h1)", async () => {
    const vfile = await createProcessor(1).process("# h1\n## h2\n### h3");
    const html = String(vfile.value);
    expect(html).toContain('<h1 id="0">');
    expect(html).not.toContain('<h2 id=');
    expect(html).not.toContain('<h3 id=');
  });

  it("respects custom depth=6 (all headings)", async () => {
    const vfile = await createProcessor(6).process(
      "# h1\n## h2\n### h3\n#### h4\n##### h5\n###### h6",
    );
    const html = String(vfile.value);
    expect(html).toContain('<h1 id="0">');
    expect(html).toContain('<h2 id="1">');
    expect(html).toContain('<h3 id="2">');
    expect(html).toContain('<h4 id="3">');
    expect(html).toContain('<h5 id="4">');
    expect(html).toContain('<h6 id="5">');
  });

  it("respects custom depth=2", async () => {
    const vfile = await createProcessor(2).process("# h1\n## h2\n### h3");
    const html = String(vfile.value);
    expect(html).toContain('<h1 id="0">');
    expect(html).toContain('<h2 id="1">');
    expect(html).not.toContain('<h3 id=');
  });

  it("assigns incremental IDs across multiple headings", async () => {
    const vfile = await createProcessor().process(
      "## a\n## b\n## c\n## d",
    );
    const html = String(vfile.value);
    expect(html).toContain('<h2 id="0">a</h2>');
    expect(html).toContain('<h2 id="1">b</h2>');
    expect(html).toContain('<h2 id="2">c</h2>');
    expect(html).toContain('<h2 id="3">d</h2>');
  });

  it("preserves heading content", async () => {
    const vfile = await createProcessor().process(
      "## Hello World\n## Another **bold** heading",
    );
    const html = String(vfile.value);
    expect(html).toContain("Hello World");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("handles document with no headings", async () => {
    const vfile = await createProcessor().process("Just a paragraph.");
    const html = String(vfile.value);
    expect(html).toBe("<p>Just a paragraph.</p>");
  });
});
