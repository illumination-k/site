import path from "node:path";
import type { Link, Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { describe, expect, it, vi } from "vitest";

import resolveInternalLinks, { type PostMetaMap } from "./resolveInternalLinks";
import { logger } from "./logger";

function collectLinks(ast: Root): Link[] {
  const links: Link[] = [];
  visit(ast, "link", (node: Link) => {
    links.push(node);
  });
  return links;
}

// Resolve paths for targets that would be matched by relative links from currentPostPath
const postMetaMap: PostMetaMap = new Map([
  [
    path.resolve("/posts/techblog/biology/seq_summary.md"),
    { uuid: "dbb49f31-2bca-4a97-857e-a1d7a95b645d", category: "techblog" },
  ],
  [
    path.resolve("/posts/techblog/algorithm/bitsearch.md"),
    { uuid: "e0b5ed90-0b5e-406b-9b13-d7bb0185a74f", category: "techblog" },
  ],
  [
    path.resolve("/posts/paperStream/some-paper.md"),
    { uuid: "aaa-bbb-ccc", category: "paperstream" },
  ],
  // Entries to ensure guards are tested: these would falsely match if guards are removed
  [
    path.resolve("/posts/techblog/frontend/http:/example.com/readme.md"),
    { uuid: "should-not-match-http", category: "bad" },
  ],
  [
    path.resolve("/posts/techblog/frontend/mailto:user@example.md"),
    { uuid: "should-not-match-mailto", category: "bad" },
  ],
  [
    path.resolve("/posts/techblog/frontend/photo.png"),
    { uuid: "should-not-match-png", category: "bad" },
  ],
]);

const currentPostPath = "/posts/techblog/frontend/pagefind.md";

function processMarkdown(md: string): Root {
  const plugin = resolveInternalLinks({
    postPath: currentPostPath,
    postMetaMap,
  });
  const processor = unified().use(remarkParse);
  const ast = processor.parse(md);
  plugin(ast as Root);
  return ast as Root;
}

describe("resolveInternalLinks", () => {
  it("resolves a relative .md link to internal URL", () => {
    const ast = processMarkdown("[seq summary](../biology/seq_summary.md)");
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe(
      "/techblog/post/dbb49f31-2bca-4a97-857e-a1d7a95b645d",
    );
  });

  it("resolves a link with fragment", () => {
    const ast = processMarkdown(
      "[heading](../biology/seq_summary.md#overview)",
    );
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe(
      "/techblog/post/dbb49f31-2bca-4a97-857e-a1d7a95b645d#overview",
    );
  });

  it("resolves links to different categories", () => {
    const ast = processMarkdown("[paper](../../paperStream/some-paper.md)");
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("/paperstream/post/aaa-bbb-ccc");
  });

  it("does not modify external links", () => {
    const ast = processMarkdown("[google](https://google.com)");
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("https://google.com");
  });

  it("does not modify anchor-only links", () => {
    const ast = processMarkdown("[section](#heading)");
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("#heading");
  });

  it("does not modify non-.md links", () => {
    const ast = processMarkdown("[image](./photo.png)");
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("./photo.png");
  });

  it("keeps original URL when target not found", () => {
    const ast = processMarkdown("[missing](./nonexistent.md)");
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("./nonexistent.md");
  });

  it("resolves multiple links in one document", () => {
    const md = [
      "[a](../biology/seq_summary.md)",
      "[b](../algorithm/bitsearch.md)",
      "[c](https://example.com)",
    ].join("\n\n");
    const ast = processMarkdown(md);
    const links = collectLinks(ast);
    expect(links).toHaveLength(3);
    expect(links[0].url).toBe(
      "/techblog/post/dbb49f31-2bca-4a97-857e-a1d7a95b645d",
    );
    expect(links[1].url).toBe(
      "/techblog/post/e0b5ed90-0b5e-406b-9b13-d7bb0185a74f",
    );
    expect(links[2].url).toBe("https://example.com");
  });

  it("does not modify external URL ending in .md", () => {
    const ast = processMarkdown("[ext](http://example.com/readme.md)");
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("http://example.com/readme.md");
    expect(links[0].url).not.toContain("/bad/post/");
  });

  it("does not modify https URL ending in .md", () => {
    const ast = processMarkdown("[ext](https://github.com/repo/file.md)");
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("https://github.com/repo/file.md");
  });

  it("does not modify mailto link ending in .md", () => {
    const ast = processMarkdown("[mail](mailto:user@example.md)");
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("mailto:user@example.md");
    expect(links[0].url).not.toContain("/bad/post/");
  });

  it("does not modify anchor-only link with .md-like content", () => {
    const ast = processMarkdown("[section](#file.md)");
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("#file.md");
  });


  it("does not resolve non-.md links even if path exists in map", () => {
    const ast = processMarkdown("[img](./photo.png)");
    const links = collectLinks(ast);
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("./photo.png");
    expect(links[0].url).not.toContain("/bad/post/");
  });

  it("logs a warning when target post is not found", () => {
    const warnSpy = vi.spyOn(logger, "warn");
    processMarkdown("[missing](./nonexistent.md)");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "./nonexistent.md",
        postPath: currentPostPath,
      }),
      "Internal link target not found",
    );
    warnSpy.mockRestore();
  });

  it("does not log a warning for valid links", () => {
    const warnSpy = vi.spyOn(logger, "warn");
    processMarkdown("[valid](../biology/seq_summary.md)");
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
