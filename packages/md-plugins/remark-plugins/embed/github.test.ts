import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypePrism from "../../rehype-plugins/rehypePrism";

import { unified } from "unified";
import { describe, expect, it } from "vitest";
import remarkDirectiveEmbedGenerator, { GithubTransformer } from ".";

const embedGithub = remarkDirectiveEmbedGenerator([new GithubTransformer()]);

const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkDirectiveEmbedGenerator([new GithubTransformer()]))
  .use(remarkRehype)
  .use(rehypePrism)
  .use(rehypeStringify);

describe("test github embed", () => {
  it("test no url text", async () => {
    const vfile = await processor
      .process("# h1");

    expect(vfile.value).toStrictEqual("<h1>h1</h1>");
  });

  it("test url only", async () => {
    const vfile = await processor
      .process(
        "::gh[https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15]",
        // "::hr{.red}"
      );

    expect(vfile.value).toStrictEqual(
      "<div class=\"github-embed\"><a href=\"https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15\" class=\"github-embed-title\">illumination-k/blog-remark/src/highlighter.ts</a><pre class=\"language-ts\"><code class=\"language-ts code-highlight\"><span class=\"code-line line-number\" line=\"11\"><span class=\"token keyword\">import</span> ts <span class=\"token keyword\">from</span> <span class=\"token string\">\"refractor/lang/typescript.js\"</span><span class=\"token punctuation\">;</span>\n"
        + "</span><span class=\"code-line line-number\" line=\"12\"><span class=\"token keyword\">import</span> tsx <span class=\"token keyword\">from</span> <span class=\"token string\">\"refractor/lang/tsx.js\"</span><span class=\"token punctuation\">;</span>\n"
        + "</span><span class=\"code-line line-number\" line=\"13\">refractor<span class=\"token punctuation\">.</span><span class=\"token function\">register</span><span class=\"token punctuation\">(</span>ts<span class=\"token punctuation\">)</span><span class=\"token punctuation\">;</span>\n"
        + "</span><span class=\"code-line line-number\" line=\"14\">refractor<span class=\"token punctuation\">.</span><span class=\"token function\">register</span><span class=\"token punctuation\">(</span>tsx<span class=\"token punctuation\">)</span><span class=\"token punctuation\">;</span>\n"
        + "</span><span class=\"code-line line-number\" line=\"15\">refractor<span class=\"token punctuation\">.</span><span class=\"token function\">alias</span><span class=\"token punctuation\">(</span><span class=\"token punctuation\">{</span> typescript<span class=\"token operator\">:</span> <span class=\"token punctuation\">[</span><span class=\"token string\">\"ts\"</span><span class=\"token punctuation\">]</span> <span class=\"token punctuation\">}</span><span class=\"token punctuation\">)</span><span class=\"token punctuation\">;</span>\n"
        + "</span></code></pre></div>",
    );
  });

  it("test usual markdown", async () => {
    const vfile = await processor
      .process(`# Refractor
## Import refractor and register lang

We should import refractor and register langs as following:

::gh[https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15]`);

    expect(vfile.value).toStrictEqual(
      "<h1>Refractor</h1>\n"
        + "<h2>Import refractor and register lang</h2>\n"
        + "<p>We should import refractor and register langs as following:</p>\n"
        + "<div class=\"github-embed\"><a href=\"https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15\" class=\"github-embed-title\">illumination-k/blog-remark/src/highlighter.ts</a>"
        + "<pre class=\"language-ts\"><code class=\"language-ts code-highlight\"><span class=\"code-line line-number\" line=\"11\"><span class=\"token keyword\">import</span> ts <span class=\"token keyword\">from</span> <span class=\"token string\">\"refractor/lang/typescript.js\"</span><span class=\"token punctuation\">;</span>\n"
        + "</span><span class=\"code-line line-number\" line=\"12\"><span class=\"token keyword\">import</span> tsx <span class=\"token keyword\">from</span> <span class=\"token string\">\"refractor/lang/tsx.js\"</span><span class=\"token punctuation\">;</span>\n"
        + "</span><span class=\"code-line line-number\" line=\"13\">refractor<span class=\"token punctuation\">.</span><span class=\"token function\">register</span><span class=\"token punctuation\">(</span>ts<span class=\"token punctuation\">)</span><span class=\"token punctuation\">;</span>\n"
        + "</span><span class=\"code-line line-number\" line=\"14\">refractor<span class=\"token punctuation\">.</span><span class=\"token function\">register</span><span class=\"token punctuation\">(</span>tsx<span class=\"token punctuation\">)</span><span class=\"token punctuation\">;</span>\n"
        + "</span><span class=\"code-line line-number\" line=\"15\">refractor<span class=\"token punctuation\">.</span><span class=\"token function\">alias</span><span class=\"token punctuation\">(</span><span class=\"token punctuation\">{</span> typescript<span class=\"token operator\">:</span> <span class=\"token punctuation\">[</span><span class=\"token string\">\"ts\"</span><span class=\"token punctuation\">]</span> <span class=\"token punctuation\">}</span><span class=\"token punctuation\">)</span><span class=\"token punctuation\">;</span>\n"
        + "</span></code></pre></div>",
    );
  });
});
