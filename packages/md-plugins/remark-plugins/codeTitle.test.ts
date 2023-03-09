import codeTitle from "./codeTitle";

import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

describe("Test: attachIdToHeading", async () => {
  it("test simple", async () => {
    const vfile = await unified()
      .use(remarkParse)
      .use(codeTitle)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process("```js title=test.js\na\n```");

    expect(vfile.value).toStrictEqual(
      "<div class=\"code-title-container\"><p class=\"code-title\">test.js</p><pre><code class=\"language-js\">a\n"
        + "</code></pre></div>",
    );
  });
});
