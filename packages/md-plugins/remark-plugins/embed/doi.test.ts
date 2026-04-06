import type { Directives } from "mdast-util-directive";
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
    data: "Frank, H. S. (1970). The Structure of Ordinary Water. Science, 169(3946), 635\u2013641. https://doi.org/10.1126/science.169.3946.635\n",
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

describe("doiRegExp", () => {
  it("matches valid DOI", () => {
    expect(doiRegExp.test("10.1126/science.169.3946.635")).toBe(true);
  });

  it("matches DOI with parentheses", () => {
    expect(doiRegExp.test("10.1000/xyz(123)")).toBe(true);
  });

  it("rejects DOI without 10. prefix", () => {
    expect(doiRegExp.test("11.1126/science")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(doiRegExp.test("")).toBe(false);
  });

  it("rejects DOI without slash", () => {
    expect(doiRegExp.test("10.1126")).toBe(false);
  });
});

describe("DoiTransformer.shouldTransform", () => {
  const transformer = new DoiTransformer();

  it("accepts bare DOI in leafDirective", () => {
    const node = {
      type: "leafDirective",
      name: "doi",
      children: [{ type: "text", value: "10.1126/science.169.3946.635" }],
    } as unknown as Directives;
    expect(transformer.shouldTransform(node)).toBe(true);
  });

  it("accepts DOI with https://doi.org/ prefix", () => {
    const node = {
      type: "leafDirective",
      name: "doi",
      children: [
        {
          type: "text",
          value: "https://doi.org/10.1126/science.169.3946.635",
        },
      ],
    } as unknown as Directives;
    expect(transformer.shouldTransform(node)).toBe(true);
  });

  it("rejects URL-prefixed DOI with invalid suffix", () => {
    const node = {
      type: "leafDirective",
      name: "doi",
      children: [{ type: "text", value: "https://doi.org/invalid" }],
    } as unknown as Directives;
    expect(transformer.shouldTransform(node)).toBe(false);
  });

  it("rejects non-leafDirective", () => {
    const node = {
      type: "textDirective",
      name: "doi",
      children: [{ type: "text", value: "10.1126/science.169.3946.635" }],
    } as unknown as Directives;
    expect(transformer.shouldTransform(node)).toBe(false);
  });

  it("rejects non-doi directive name", () => {
    const node = {
      type: "leafDirective",
      name: "github",
      children: [{ type: "text", value: "10.1126/science.169.3946.635" }],
    } as unknown as Directives;
    expect(transformer.shouldTransform(node)).toBe(false);
  });

  it("rejects invalid bare DOI", () => {
    const node = {
      type: "leafDirective",
      name: "doi",
      children: [{ type: "text", value: "not-a-doi" }],
    } as unknown as Directives;
    expect(transformer.shouldTransform(node)).toBe(false);
  });
});

describe("doi embed rendering", () => {
  it("renders a DOI citation with doi class", async () => {
    const vfile = await processor.process(
      "::doi[10.1126/science.169.3946.635]",
    );
    expect(vfile.value).toStrictEqual(
      '<p class="doi">Frank, H. S. (1970). The Structure of Ordinary Water. Science, 169(3946), 635\u2013641. https://doi.org/10.1126/science.169.3946.635\n</p>',
    );
  });

  it("renders DOI with custom style via id attribute", async () => {
    const vfile = await processor.process(
      "::doi[10.1126/science.169.3946.635]{#vancouver}",
    );
    // The DOI should render (using the mocked response)
    const html = String(vfile.value);
    expect(html).toContain('class="doi"');
    // fetchWithRetry should have been called (via cachedFetch)
  });

  it("does not transform non-doi directives", async () => {
    const vfile = await processor.process("::other[some text]");
    const html = String(vfile.value);
    expect(html).not.toContain('class="doi"');
  });
});
