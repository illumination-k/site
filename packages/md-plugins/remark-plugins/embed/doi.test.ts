import { describe, expect, it, vi } from "vitest";
import { DoiTransformer, doiRegExp } from "./doi";

import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import remarkDirectiveEmbedGenerator from ".";

vi.mock("../../cache", () => ({
  getCacheKey: vi.fn().mockReturnValue("test-key"),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../fetch", () => ({
  fetchWithRetry: vi.fn().mockResolvedValue({
    data: "Frank, H. S. (1970). The Structure of Ordinary Water. Science, 169(3946), 635–641. https://doi.org/10.1126/science.169.3946.635\n",
    status: 200,
  }),
}));

const remarkEmbed = remarkDirectiveEmbedGenerator([new DoiTransformer()]);
const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkEmbed)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("test doi", () => {
  it("test doi regexp", () => {
    expect(doiRegExp.test("10.1126/science.169.3946.635")).toBeTruthy();
  });

  it("test a doi line", async () => {
    const vile = await processor.process("::doi[10.1126/science.169.3946.635]");

    expect(vile.value).toStrictEqual(
      '<p class="doi">Frank, H. S. (1970). The Structure of Ordinary Water. Science, 169(3946), 635–641. https://doi.org/10.1126/science.169.3946.635\n' +
        "</p>",
    );
  });
});
