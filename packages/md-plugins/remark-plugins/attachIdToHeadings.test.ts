import attachIdToHeadings from "./attachIdToHeadings";

import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

describe("Test: attachIdToHeading", async () => {
  it("test simple", async () => {
    const vfile = await unified()
      .use(remarkParse)
      .use(attachIdToHeadings)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process("# h1\n## h2 ## h3");

    expect(vfile.value).toStrictEqual("<h1 id=\"0\">h1</h1>\n<h2 id=\"1\">h2 ## h3</h2>");
  });
});
