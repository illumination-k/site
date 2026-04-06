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

const jsonContent = { key: "value", nested: { a: 1 } };

vi.mock("../../fetch", () => ({
  fetchWithRetry: vi.fn().mockImplementation((url: string) => {
    if (url.includes("highlighter.ts")) {
      return Promise.resolve({ data: highlighterFileContent, status: 200 });
    }
    if (url.includes("README.md")) {
      return Promise.resolve({ data: readmeContent, status: 200 });
    }
    if (url.includes("data.json")) {
      return Promise.resolve({ data: jsonContent, status: 200 });
    }
    if (url.includes("fail-file")) {
      return Promise.reject(new Error("Not Found"));
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  }),
}));

describe("parseGithubUrl", () => {
  it("parses URL without line numbers", () => {
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

  it("parses URL with line range", () => {
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

  it("parses URL with single line number", () => {
    const url =
      "https://github.com/user/repo/blob/main/src/index.ts#L5";
    const parsed = parseGithubUrl(url);

    expect(parsed.startLine).toBe(5);
    expect(parsed.endLine).toBe(5);
  });

  it("parses deeply nested file path", () => {
    const url =
      "https://github.com/user/repo/blob/dev/src/a/b/c/deep.rs";
    const parsed = parseGithubUrl(url);

    expect(parsed.filePath).toBe("src/a/b/c/deep.rs");
    expect(parsed.fileExtension).toBe("rs");
    expect(parsed.branch).toBe("dev");
  });

  it("defaults to txt extension for files without extension", () => {
    const url =
      "https://github.com/user/repo/blob/main/Makefile";
    const parsed = parseGithubUrl(url);

    expect(parsed.fileExtension).toBe("txt");
    expect(parsed.filePath).toBe("Makefile");
  });
});

const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkDirectiveEmbedGenerator([new GithubTransformer()]))
  .use(remarkRehype)
  .use(rehypePrism)
  .use(rehypeStringify);

describe("github embed", () => {
  it("does not transform non-github content", async () => {
    const vfile = await processor.process("# h1");
    expect(vfile.value).toStrictEqual("<h1>h1</h1>");
  });

  it("embeds code with line highlighting", async () => {
    const vfile = await processor.process(
      "::gh[https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15]",
    );

    const html = String(vfile.value);
    expect(html).toContain('class="github-embed"');
    expect(html).toContain('class="github-embed-title"');
    expect(html).toContain("illumination-k/blog-remark/src/highlighter.ts");
    expect(html).toContain('line="11"');
    expect(html).toContain('line="15"');
  });

  it("embeds full file without line range", async () => {
    const vfile = await processor.process(
      "::gh[https://github.com/illumination-k/site/blob/main/README.md]",
    );
    const html = String(vfile.value);
    expect(html).toContain('class="github-embed"');
    expect(html).toContain("illumination-k/site/README.md");
    expect(html).toContain("site");
  });

  it("renders alongside regular markdown", async () => {
    const vfile = await processor.process(`# Refractor
## Import refractor and register lang

We should import refractor and register langs as following:

::gh[https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15]`);

    const html = String(vfile.value);
    expect(html).toContain("<h1>Refractor</h1>");
    expect(html).toContain("<h2>");
    expect(html).toContain('class="github-embed"');
  });

  it("handles multiple embeds", async () => {
    const url1 = "https://github.com/illumination-k/site/blob/main/README.md";
    const url2 =
      "https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15";
    const vfile = await processor.process(`::gh[${url1}]\n\n::gh[${url2}]`);

    const html = String(vfile.value);
    expect(html).toContain(url1);
    expect(html).toContain(url2);
    const embedCount = (html.match(/github-embed/g) || []).length;
    expect(embedCount).toBeGreaterThanOrEqual(4); // 2 containers + 2 titles
  });

  it("also accepts ::github directive name", async () => {
    const processorGithub = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkDirectiveEmbedGenerator([new GithubTransformer()]))
      .use(remarkRehype)
      .use(rehypeStringify);

    const vfile = await processorGithub.process(
      "::github[https://github.com/illumination-k/site/blob/main/README.md]",
    );
    const html = String(vfile.value);
    expect(html).toContain('class="github-embed"');
  });

  it("handles JSON response by stringifying", async () => {
    const vfile = await processor.process(
      "::gh[https://github.com/user/repo/blob/main/data.json]",
    );
    const html = String(vfile.value);
    expect(html).toContain('class="github-embed"');
    // JSON gets stringified
    expect(html).toContain("key");
    expect(html).toContain("value");
  });

  it("gracefully handles fetch failure", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const vfile = await processor.process(
      "::gh[https://github.com/user/repo/blob/main/fail-file.ts]",
    );
    const html = String(vfile.value);
    // Should not render embed on failure
    expect(html).not.toContain('class="github-embed"');
    expect(warnSpy).toHaveBeenCalled();
  });

  it("rejects non-github URLs", async () => {
    const vfile = await processor.process(
      "::gh[https://gitlab.com/user/repo/blob/main/file.ts]",
    );
    const html = String(vfile.value);
    expect(html).not.toContain('class="github-embed"');
  });

  it("rejects non-leafDirective", async () => {
    // textDirective (:gh[...]) should not trigger
    const vfile = await processor.process(
      "some text :gh[https://github.com/user/repo/blob/main/file.ts] more",
    );
    const html = String(vfile.value);
    expect(html).not.toContain('class="github-embed"');
  });
});
