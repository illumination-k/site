import details from "./details";

import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

const prosessor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(details)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("Test: attachIdToHeading", async () => {
  it("test simple", async () => {
    const vfile = await prosessor.process(`:::details[test]
Some details
:::
`);

    expect(vfile.value).toStrictEqual(
      "<details><summary>test</summary><p>Some details</p></details>",
    );
  });

  it("test title with whitespace", async () => {
    const vfile = await prosessor.process(`:::details[test a]
Some details
:::
`);

    expect(vfile.value).toStrictEqual(
      "<details><summary>test a</summary><p>Some details</p></details>",
    );
  });

  it("test no title", async () => {
    const vfile = await prosessor.process(`:::details
Some details
:::
`);

    expect(vfile.value).toStrictEqual(
      "<details><summary>Details</summary><p>Some details</p></details>",
    );
  });

  it("does not transform non-details container directives", async () => {
    // Ensures the early return `if (node.name !== "details") return;` branch
    // is effective: a :::note directive must stay as the default <div>.
    const vfile = await prosessor.process(`:::note[heads up]
Some other directive
:::
`);

    const html = String(vfile.value);
    expect(html).not.toContain("<details>");
    expect(html).not.toContain("<summary>");
  });

  it("does not transform :details leaf or text directives", async () => {
    // Ensures `visit(ast, "containerDirective", ...)` filter holds: non-container
    // directives with name 'details' must not become <details> elements.
    const vfile = await prosessor.process(
      ":details[inline]\n\n::details[leaf]\n",
    );
    const html = String(vfile.value);
    expect(html).not.toContain("<details>");
    expect(html).not.toContain("<summary>");
  });

  it("renders summary text as literal content (not an empty node)", async () => {
    // Guards against the inner `type: "text"` in the summary child being
    // mutated to an empty string — the summary text must render.
    const vfile = await prosessor.process(`:::details[タイトル]
本文
:::
`);
    const html = String(vfile.value);
    expect(html).toContain("<summary>タイトル</summary>");
    expect(html).toMatch(/>タイトル</);
  });
});
