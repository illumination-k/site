import codeTitle from "./codeTitle";

import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

const processor = unified()
  .use(remarkParse)
  .use(codeTitle)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("codeTitle", () => {
  it("wraps code block with title in a container", async () => {
    const vfile = await processor.process("```js title=test.js\na\n```");

    expect(vfile.value).toStrictEqual(
      '<div class="code-title-container"><p class="code-title">test.js</p><pre><code class="language-js">a\n' +
        "</code></pre></div>",
    );
  });

  it("ignores code block without meta", async () => {
    const vfile = await processor.process("```js\ncode\n```");
    expect(String(vfile.value)).toBe(
      '<pre><code class="language-js">code\n</code></pre>',
    );
  });

  it("ignores meta without title key", async () => {
    const vfile = await processor.process("```js highlight=1\ncode\n```");
    const html = String(vfile.value);
    expect(html).not.toContain("code-title-container");
    expect(html).toContain("<pre>");
  });

  it("extracts title from comma-separated meta values", async () => {
    const vfile = await processor.process(
      "```js highlight=1,title=main.js\ncode\n```",
    );
    const html = String(vfile.value);
    expect(html).toContain("code-title-container");
    expect(html).toContain("main.js");
  });

  it("ignores meta entry with no equals sign", async () => {
    const vfile = await processor.process("```js noeq,title=ok.ts\ncode\n```");
    const html = String(vfile.value);
    expect(html).toContain("ok.ts");
    expect(html).toContain("code-title-container");
  });

  it("ignores meta entry with multiple equals signs", async () => {
    const vfile = await processor.process(
      "```js key=val=extra,title=good.rs\ncode\n```",
    );
    const html = String(vfile.value);
    // key=val=extra has 3 parts when split by =, so it is skipped
    expect(html).toContain("good.rs");
  });

  it("uses last title when multiple title entries exist", async () => {
    const vfile = await processor.process(
      "```js title=first.js,title=second.js\ncode\n```",
    );
    const html = String(vfile.value);
    expect(html).toContain("second.js");
    expect(html).not.toContain("first.js");
  });

  it("handles multiple code blocks independently", async () => {
    const vfile = await processor.process(
      "```js title=a.js\nfoo\n```\n\n```py title=b.py\nbar\n```",
    );
    const html = String(vfile.value);
    expect(html).toContain("a.js");
    expect(html).toContain("b.py");
    const containerCount = (html.match(/code-title-container/g) || []).length;
    expect(containerCount).toBe(2);
  });

  it("handles empty title value", async () => {
    const vfile = await processor.process("```js title=\ncode\n```");
    const html = String(vfile.value);
    // title= produces empty string which is falsy, so no wrapping
    expect(html).not.toContain("code-title-container");
  });
});
