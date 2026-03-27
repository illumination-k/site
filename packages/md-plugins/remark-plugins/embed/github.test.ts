import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypePrism from "../../rehype-plugins/rehypePrism";

import { unified } from "unified";
import { describe, expect, it, vi } from "vitest";
import remarkDirectiveEmbedGenerator, { GithubTransformer } from ".";

import { parseGithubUrl } from "./github";

vi.mock("../../cache", () => ({
  getCacheKey: vi.fn().mockReturnValue("test-key"),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

const highlighterFileContent = `import { refractor } from "refractor/lib/core.js";
import bash from "refractor/lang/bash.js";
import diff from "refractor/lang/diff.js";
import json from "refractor/lang/json.js";
import markdown from "refractor/lang/markdown.js";
import python from "refractor/lang/python.js";
import r from "refractor/lang/r.js";
import rust from "refractor/lang/rust.js";
import toml from "refractor/lang/toml.js";
import yaml from "refractor/lang/yaml.js";
import ts from "refractor/lang/typescript.js";
import tsx from "refractor/lang/tsx.js";
refractor.register(ts);
refractor.register(tsx);
refractor.alias({ typescript: ["ts"] });`;

const readmeContent = "# site\n\nPersonal blog site";

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes("highlighter.ts")) {
        return Promise.resolve({ data: highlighterFileContent });
      }
      if (url.includes("README.md")) {
        return Promise.resolve({ data: readmeContent });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }),
  },
}));

describe("test parse github url", () => {
  it("test parse github main url without line", () => {
    const url = "https://github.com/illumination-k/site/blob/main/README.md";
    const parsed = parseGithubUrl(url);

    expect(parsed).toStrictEqual({
      user: "illumination-k",
      repository: "site",
      branch: "main",
      filePath: "README.md",
      fileExtension: "md",
      rawFileUrl:
        "https://raw.githubusercontent.com/illumination-k/site/main/README.md",
      startLine: -1,
      endLine: -1,
    });
  });

  it("test parse github url with line", () => {
    const url =
      "https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15";
    const parsed = parseGithubUrl(url);

    expect(parsed).toStrictEqual({
      user: "illumination-k",
      repository: "blog-remark",
      branch: "7855162f655858f2122911c66d6dd80ef327a055",
      filePath: "src/highlighter.ts",
      fileExtension: "ts",
      rawFileUrl:
        "https://raw.githubusercontent.com/illumination-k/blog-remark/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts",
      startLine: 11,
      endLine: 15,
    });
  });
});

const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkDirectiveEmbedGenerator([new GithubTransformer()]))
  .use(remarkRehype)
  .use(rehypePrism)
  .use(rehypeStringify);

describe("test github embed", () => {
  it("test no url text", async () => {
    const vfile = await processor.process("# h1");

    expect(vfile.value).toStrictEqual("<h1>h1</h1>");
  });

  it("test url only", async () => {
    const vfile = await processor.process(
      "::gh[https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15]",
    );

    expect(vfile.value).toStrictEqual(
      '<div class="github-embed"><a href="https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15" class="github-embed-title">illumination-k/blog-remark/src/highlighter.ts</a><pre class="language-ts"><code class="language-ts code-highlight"><span class="code-line line-number" line="11"><span class="token keyword">import</span> ts <span class="token keyword">from</span> <span class="token string">"refractor/lang/typescript.js"</span><span class="token punctuation">;</span>\n' +
        '</span><span class="code-line line-number" line="12"><span class="token keyword">import</span> tsx <span class="token keyword">from</span> <span class="token string">"refractor/lang/tsx.js"</span><span class="token punctuation">;</span>\n' +
        '</span><span class="code-line line-number" line="13">refractor<span class="token punctuation">.</span><span class="token function">register</span><span class="token punctuation">(</span>ts<span class="token punctuation">)</span><span class="token punctuation">;</span>\n' +
        '</span><span class="code-line line-number" line="14">refractor<span class="token punctuation">.</span><span class="token function">register</span><span class="token punctuation">(</span>tsx<span class="token punctuation">)</span><span class="token punctuation">;</span>\n' +
        '</span><span class="code-line line-number" line="15">refractor<span class="token punctuation">.</span><span class="token function">alias</span><span class="token punctuation">(</span><span class="token punctuation">{</span> typescript<span class="token operator">:</span> <span class="token punctuation">[</span><span class="token string">"ts"</span><span class="token punctuation">]</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n' +
        "</span></code></pre></div>",
    );
  });

  it("test usual markdown", async () => {
    const vfile = await processor.process(`# Refractor
## Import refractor and register lang

We should import refractor and register langs as following:

::gh[https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15]`);

    expect(vfile.value).toStrictEqual(
      "<h1>Refractor</h1>\n" +
        "<h2>Import refractor and register lang</h2>\n" +
        "<p>We should import refractor and register langs as following:</p>\n" +
        '<div class="github-embed"><a href="https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15" class="github-embed-title">illumination-k/blog-remark/src/highlighter.ts</a>' +
        '<pre class="language-ts"><code class="language-ts code-highlight"><span class="code-line line-number" line="11"><span class="token keyword">import</span> ts <span class="token keyword">from</span> <span class="token string">"refractor/lang/typescript.js"</span><span class="token punctuation">;</span>\n' +
        '</span><span class="code-line line-number" line="12"><span class="token keyword">import</span> tsx <span class="token keyword">from</span> <span class="token string">"refractor/lang/tsx.js"</span><span class="token punctuation">;</span>\n' +
        '</span><span class="code-line line-number" line="13">refractor<span class="token punctuation">.</span><span class="token function">register</span><span class="token punctuation">(</span>ts<span class="token punctuation">)</span><span class="token punctuation">;</span>\n' +
        '</span><span class="code-line line-number" line="14">refractor<span class="token punctuation">.</span><span class="token function">register</span><span class="token punctuation">(</span>tsx<span class="token punctuation">)</span><span class="token punctuation">;</span>\n' +
        '</span><span class="code-line line-number" line="15">refractor<span class="token punctuation">.</span><span class="token function">alias</span><span class="token punctuation">(</span><span class="token punctuation">{</span> typescript<span class="token operator">:</span> <span class="token punctuation">[</span><span class="token string">"ts"</span><span class="token punctuation">]</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n' +
        "</span></code></pre></div>",
    );
  });

  it("test multiple embed", async () => {
    const url1 = "https://github.com/illumination-k/site/blob/main/README.md";
    const url2 =
      "https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15";
    const vfile = await processor.process(`
      ::gh[${url1}]
      ::gh[${url2}]`);

    expect(
      vfile.value.toString().includes(url1) &&
        vfile.value.toString().includes(url2),
    ).toBeTruthy();
  });
});
