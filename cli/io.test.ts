import { describe, expect, it } from "vitest";

import { dumpPost, getDumpPosts, readPost } from "./io";

describe("test read post", () => {
  it("sample read post", async () => {
    await readPost("./test/test1.md");
  });

  it("dump smaple post", async () => {
    const post = await readPost("./test/test1.md");
    await dumpPost(post, "./test/test1.md", "./test/public/imageDist");
  });
});

describe("mermaid rendering", () => {
  it("renders mermaid code blocks to inline SVG at build time", async () => {
    const post = await readPost("./test/test-mermaid.md");
    const dumped = await dumpPost(
      post,
      "./test/test-mermaid.md",
      "./test/public/imageDist",
    );
    // rehype-mermaid with strategy "inline-svg" replaces the mermaid code
    // fence with an inline <svg>, which MDX compiles into JSX runtime calls
    // like _jsx("svg", {...}). The original language-mermaid class should
    // be gone and a JSX svg element should be present.
    expect(dumped.compiledMarkdown).toMatch(/"svg"/);
    expect(dumped.compiledMarkdown).not.toContain("language-mermaid");
  });
});

describe("internal links", () => {
  it("resolves .md links to internal URLs in getDumpPosts", async () => {
    const posts = await getDumpPosts("./test", "./test/public/imageDist");

    const test2 = posts.find(
      (p) => p.meta.uuid === "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    );
    expect(test2).toBeDefined();
    expect(test2?.compiledMarkdown).toBeDefined();

    // The compiled markdown should contain the resolved internal link
    expect(test2?.compiledMarkdown).toContain(
      "/test/post/61427e60-48c8-480b-bdbf-b5f846149c3a",
    );
    // Fragment link should also be resolved
    expect(test2?.compiledMarkdown).toContain(
      "/test/post/61427e60-48c8-480b-bdbf-b5f846149c3a#heading2",
    );
  });
});
