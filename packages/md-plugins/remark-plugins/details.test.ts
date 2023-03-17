import details from "./details";

import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkDirective from "remark-directive";
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
    const vfile = await prosessor
      .process(`:::details[test]
Some details
:::
`);

    expect(vfile.value).toStrictEqual(
      "<details><summary>test</summary><p>Some details</p></details>",
    );
  });

  it("test title with whitespace", async () => {
    const vfile = await prosessor
      .process(`:::details[test a]
Some details
:::
`);

    expect(vfile.value).toStrictEqual(
      "<details><summary>test a</summary><p>Some details</p></details>",
    );
  });

  it("test no title", async () => {
    const vfile = await prosessor
      .process(`:::details
Some details
:::
`);

    expect(vfile.value).toStrictEqual(
      "<details><summary>Details</summary><p>Some details</p></details>",
    );
  });
});
