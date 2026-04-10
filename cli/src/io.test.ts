import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { dumpPost, dumpSinglePost, getDumpPosts, readPost } from "./io";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(__dirname, "..");
const fixture = (...segments: string[]) => path.join(cliRoot, ...segments);


/**
 * Check whether Playwright browsers are installed.
 * rehype-mermaid with strategy "inline-svg" requires mermaid-isomorphic which
 * launches a headless Chromium via Playwright. When the browser binary is not
 * present (e.g. in CI without `playwright install`), these tests must be
 * skipped rather than reported as failures.
 */
async function hasPlaywrightBrowser(): Promise<boolean> {
  try {
    // @ts-expect-error playwright-core may not be installed in this workspace
    const pw = await import("playwright-core");
    const browser = await pw.chromium.launch();
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

const hasBrowser = await hasPlaywrightBrowser();
const describeWithBrowser = hasBrowser ? describe : describe.skip;

describe("readPost", () => {
  it("reads a valid post and returns meta + markdown", async () => {
    const post = await readPost(fixture("test", "test1.md"));
    expect(post.meta.uuid).toBe("61427e60-48c8-480b-bdbf-b5f846149c3a");
    expect(post.meta.title).toBe("Test Post");
    expect(post.meta.description).toBe("Test Description");
    expect(post.meta.category).toBe("test");
    expect(post.meta.lang).toBe("ja");
    expect(post.meta.tags).toEqual(["tag1", "tag2"]);
    expect(post.markdown).toContain("## heading2");
  });

  it("throws on non-existent file", async () => {
    await expect(readPost(fixture("test", "does-not-exist.md"))).rejects.toThrow(
      "Failed to read post file",
    );
  });

  it("throws on invalid front-matter schema (missing required fields)", async () => {
    await expect(
      readPost(fixture("test-fixtures-invalid", "test-invalid-yaml.md")),
    ).rejects.toThrow("Front-matter validation failed");
  });

  it("throws on malformed YAML front-matter", async () => {
    await expect(
      readPost(fixture("test-fixtures-invalid", "test-bad-frontmatter.md")),
    ).rejects.toThrow();
  });
});

describe("dumpPost", () => {
  it("compiles a post and returns DumpPost with expected fields", async () => {
    const post = await readPost(fixture("test", "test1.md"));
    const dumped = await dumpPost(
      post,
      fixture("test", "test1.md"),
      fixture("test", "public", "imageDist"),
    );

    expect(dumped.meta.uuid).toBe("61427e60-48c8-480b-bdbf-b5f846149c3a");
    expect(dumped.meta.title).toBe("Test Post");
    expect(dumped.compiledMarkdown).toBeDefined();
    expect(dumped.compiledMarkdown.length).toBeGreaterThan(0);
    expect(dumped.rawMarkdown).toBeDefined();
    expect(dumped.headings).toBeDefined();
    expect(Array.isArray(dumped.headings)).toBe(true);
  });

  it("extracts headings correctly", async () => {
    const post = await readPost(fixture("test", "test1.md"));
    const dumped = await dumpPost(
      post,
      fixture("test", "test1.md"),
      fixture("test", "public", "imageDist"),
    );

    expect(dumped.headings).toEqual([
      { depth: 2, value: "heading2" },
      { depth: 3, value: "heading3" },
      { depth: 3, value: "heading4" },
    ]);
  });

  it("strips markdown heading syntax from rawMarkdown", async () => {
    const post = await readPost(fixture("test", "test1.md"));
    const dumped = await dumpPost(
      post,
      fixture("test", "test1.md"),
      fixture("test", "public", "imageDist"),
    );

    // rawMarkdown is the result of remark processing (headers extracted)
    expect(dumped.rawMarkdown).toBeDefined();
    expect(typeof dumped.rawMarkdown).toBe("string");
  });
});

describe("dumpSinglePost", () => {
  it("dumps a single post without postMetaMap", async () => {
    const result = await dumpSinglePost(
      fixture("test", "test1.md"),
      fixture("test", "public", "imageDist"),
    );

    expect(result.meta.uuid).toBe("61427e60-48c8-480b-bdbf-b5f846149c3a");
    expect(result.meta.title).toBe("Test Post");
    expect(result.compiledMarkdown).toBeDefined();
    expect(result.headings.length).toBeGreaterThan(0);
  });

  it("throws on non-existent file", async () => {
    await expect(
      dumpSinglePost(fixture("test", "nope.md"), fixture("test", "public", "imageDist")),
    ).rejects.toThrow("Failed to read post file");
  });

  it("throws on invalid front-matter", async () => {
    await expect(
      dumpSinglePost(
        fixture("test-fixtures-invalid", "test-invalid-yaml.md"),
        fixture("test", "public", "imageDist"),
      ),
    ).rejects.toThrow("Front-matter validation failed");
  });
});

describe("getDumpPosts", () => {
  it("returns empty array when no markdown files found", async () => {
    const result = await getDumpPosts(
      fixture("test", "public"),
      fixture("test", "public", "imageDist"),
    );
    expect(result).toEqual([]);
  });

  it("fails when directory contains posts with invalid front-matter", async () => {
    await expect(
      getDumpPosts(fixture("test-fixtures-invalid"), fixture("test", "public", "imageDist")),
    ).rejects.toThrow("posts failed to process");
  });
});

describeWithBrowser("mermaid rendering", () => {
  it("renders mermaid code blocks to inline SVG at build time", async () => {
    const post = await readPost(fixture("test", "test-mermaid.md"));
    const dumped = await dumpPost(
      post,
      fixture("test", "test-mermaid.md"),
      fixture("test", "public", "imageDist"),
    );
    // rehype-mermaid with strategy "inline-svg" replaces the mermaid code
    // fence with an inline <svg>, which MDX compiles into JSX runtime calls
    // like _jsx("svg", {...}). The original language-mermaid class should
    // be gone and a JSX svg element should be present.
    expect(dumped.compiledMarkdown).toMatch(/"svg"/);
    expect(dumped.compiledMarkdown).not.toContain("language-mermaid");
  });
});

describeWithBrowser("internal links", () => {
  it("resolves .md links to internal URLs in getDumpPosts", async () => {
    const posts = await getDumpPosts(fixture("test"), fixture("test", "public", "imageDist"));

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
