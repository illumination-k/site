import { afterEach, describe, expect, it, vi } from "vitest";

import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import remarkDirectiveEmbedGenerator from ".";
import { GithubMetaTransformer } from "./github-meta";

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        full_name: "owner/repo",
        html_url: "https://github.com/owner/repo",
        description: "A test repository",
        stargazers_count: 1234,
        pushed_at: "2024-06-15T10:30:00Z",
      },
    }),
  },
}));

const remarkEmbed = remarkDirectiveEmbedGenerator([
  new GithubMetaTransformer(),
]);
const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkEmbed)
  .use(remarkRehype)
  .use(rehypeStringify);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("github-meta embed", () => {
  it("renders inline metadata", async () => {
    const vfile = await processor.process("::gh-meta[owner/repo]");
    const html = String(vfile.value);

    expect(html).toContain('class="gh-meta"');
    expect(html).toContain('class="gh-meta-repo-name"');
    expect(html).toContain("owner/repo");
    expect(html).toContain("1.2k");
    expect(html).toContain("2024-06-15");
  });

  it("works inside a list item", async () => {
    const vfile = await processor.process(
      "- ::gh-meta[owner/repo]\n- other item",
    );
    const html = String(vfile.value);

    expect(html).toContain("<li>");
    expect(html).toContain('class="gh-meta"');
  });

  it("works inline within text using textDirective", async () => {
    const vfile = await processor.process(
      "このライブラリは:gh-meta[owner/repo]を使っています。",
    );
    const html = String(vfile.value);

    expect(html).toContain("<p>");
    expect(html).toContain('class="gh-meta"');
    expect(html).toContain("owner/repo");
    expect(html).toContain("1.2k");
  });

  it("ignores invalid repo format", async () => {
    const vfile = await processor.process("::gh-meta[invalid]");
    const html = String(vfile.value);

    // Should not contain gh-meta class since format is invalid
    expect(html).not.toContain('class="gh-meta"');
  });
});
