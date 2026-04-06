import { afterEach, describe, expect, it, vi } from "vitest";

import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import remarkDirectiveEmbedGenerator from ".";
import { GithubMetaTransformer } from "./github-meta";

vi.mock("../../cache", () => ({
  getCacheKey: vi.fn().mockReturnValue("test-key"),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

const mockFetchWithRetry = vi.fn();
vi.mock("../../fetch", () => ({
  fetchWithRetry: (...args: unknown[]) => mockFetchWithRetry(...args),
}));

function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkDirectiveEmbedGenerator([new GithubMetaTransformer()]))
    .use(remarkRehype)
    .use(rehypeStringify);
}

function mockRepo(overrides: Record<string, unknown> = {}) {
  mockFetchWithRetry.mockResolvedValue({
    data: {
      full_name: "owner/repo",
      html_url: "https://github.com/owner/repo",
      description: "A test repository",
      stargazers_count: 1234,
      pushed_at: "2024-06-15T10:30:00Z",
      ...overrides,
    },
    status: 200,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("github-meta embed", () => {
  it("renders inline metadata with star count and date", async () => {
    mockRepo();
    const vfile = await createProcessor().process("::gh-meta[owner/repo]");
    const html = String(vfile.value);

    expect(html).toContain('class="gh-meta"');
    expect(html).toContain('class="gh-meta-repo-name"');
    expect(html).toContain("owner/repo");
    expect(html).toContain("1.2k");
    expect(html).toContain("2024-06-15");
  });

  it("works inside a list item", async () => {
    mockRepo();
    const vfile = await createProcessor().process(
      "- ::gh-meta[owner/repo]\n- other item",
    );
    const html = String(vfile.value);

    expect(html).toContain("<li>");
    expect(html).toContain('class="gh-meta"');
  });

  it("works inline within text using textDirective", async () => {
    mockRepo();
    const vfile = await createProcessor().process(
      "このライブラリは:gh-meta[owner/repo]を使っています。",
    );
    const html = String(vfile.value);

    expect(html).toContain("<p>");
    expect(html).toContain('class="gh-meta"');
    expect(html).toContain("owner/repo");
    expect(html).toContain("1.2k");
  });

  it("ignores invalid repo format (no slash)", async () => {
    const vfile = await createProcessor().process("::gh-meta[invalid]");
    const html = String(vfile.value);
    expect(html).not.toContain('class="gh-meta"');
  });

  it("ignores repo with multiple slashes", async () => {
    const vfile = await createProcessor().process("::gh-meta[a/b/c]");
    const html = String(vfile.value);
    expect(html).not.toContain('class="gh-meta"');
  });

  it("formats stars below 1000 as plain number", async () => {
    mockRepo({ stargazers_count: 42 });
    const vfile = await createProcessor().process("::gh-meta[owner/repo]");
    const html = String(vfile.value);
    expect(html).toContain("42");
    expect(html).not.toContain("k");
  });

  it("formats stars at exactly 1000 as 1.0k", async () => {
    mockRepo({ stargazers_count: 1000 });
    const vfile = await createProcessor().process("::gh-meta[owner/repo]");
    const html = String(vfile.value);
    expect(html).toContain("1.0k");
  });

  it("formats stars above 1000 with one decimal", async () => {
    mockRepo({ stargazers_count: 15600 });
    const vfile = await createProcessor().process("::gh-meta[owner/repo]");
    const html = String(vfile.value);
    expect(html).toContain("15.6k");
  });

  it("formats zero stars", async () => {
    mockRepo({ stargazers_count: 0 });
    const vfile = await createProcessor().process("::gh-meta[owner/repo]");
    const html = String(vfile.value);
    expect(html).toContain("0");
  });

  it("gracefully handles fetch error", async () => {
    mockFetchWithRetry.mockRejectedValue(new Error("network error"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const vfile = await createProcessor().process("::gh-meta[owner/repo]");
    const html = String(vfile.value);

    expect(html).not.toContain('class="gh-meta"');
    expect(warnSpy).toHaveBeenCalled();
  });

  it("includes link to repo URL", async () => {
    mockRepo();
    const vfile = await createProcessor().process("::gh-meta[owner/repo]");
    const html = String(vfile.value);
    expect(html).toContain('href="https://github.com/owner/repo"');
  });

  it("renders date with zero-padded month and day", async () => {
    mockRepo({ pushed_at: "2023-01-05T00:00:00Z" });
    const vfile = await createProcessor().process("::gh-meta[owner/repo]");
    const html = String(vfile.value);
    expect(html).toContain("2023-01-05");
  });

  it("contains updated label", async () => {
    mockRepo();
    const vfile = await createProcessor().process("::gh-meta[owner/repo]");
    const html = String(vfile.value);
    expect(html).toContain("updated:");
    expect(html).toContain('class="gh-meta-updated"');
    expect(html).toContain('class="gh-meta-stars"');
  });
});
