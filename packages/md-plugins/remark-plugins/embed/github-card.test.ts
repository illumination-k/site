import { describe, expect, it } from "vitest";

import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import remarkDirectiveEmbedGenerator from ".";
import GithubCardTransformer from "./github-card";

const remarkEmbed = remarkDirectiveEmbedGenerator([new GithubCardTransformer()]);
const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkEmbed)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("github-card embed", () => {
  it("test oneline", async () => {
    const vfile = await processor.process(`::gh-card[illumination-k/blog]`);

    expect(vfile.value).toStrictEqual(
      "<a href=\"https://github.com/illumination-k/blog\"><img src=\"https://gh-card.dev/repos/illumination-k/blog.svg?fullname=\" alt=\"illumination-k/blog\"></a>",
    );
  });
});
