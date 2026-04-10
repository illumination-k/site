import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Dump } from "common";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import generateFeed from "./feed";

function makeDump(): Dump {
  return {
    posts: [
      {
        meta: {
          uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          title: "First Post",
          description: "A first post",
          category: "techblog",
          tags: ["ts"],
          lang: "ja",
          created_at: "2024-01-01",
          updated_at: "2024-02-01",
        },
        rawMarkdown: "# First",
        compiledMarkdown: "<h1>First</h1>",
        headings: [{ depth: 1, value: "First" }],
      },
      {
        meta: {
          uuid: "a2b2c3d4-e5f6-7890-abcd-ef1234567890",
          title: "Second Post",
          description: "A second post",
          category: "techblog",
          tags: [],
          lang: "ja",
          created_at: "2024-03-01",
          updated_at: "2024-04-01",
        },
        rawMarkdown: "# Second",
        compiledMarkdown: "<h1>Second</h1>",
        headings: [{ depth: 1, value: "Second" }],
      },
    ],
    categories: ["techblog"],
    tags: ["ts"],
  };
}

describe("generateFeed", () => {
  let workDir: string;
  let dumpPath: string;
  let dst: string;

  beforeEach(() => {
    workDir = mkdtempSync(path.join(tmpdir(), "feed-test-"));
    dumpPath = path.join(workDir, "dump.json");
    dst = path.join(workDir, "rss");
    writeFileSync(dumpPath, JSON.stringify(makeDump()));
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it("writes feed.xml, atom.xml, feed.json containing all posts", async () => {
    await generateFeed(dumpPath, dst);

    const rss = readFileSync(path.join(dst, "feed.xml"), "utf-8");
    const atom = readFileSync(path.join(dst, "atom.xml"), "utf-8");
    const json = readFileSync(path.join(dst, "feed.json"), "utf-8");

    for (const body of [rss, atom, json]) {
      expect(body).toContain("First Post");
      expect(body).toContain("Second Post");
      expect(body).toContain(
        "techblog/post/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      );
    }

    // feed.json should be valid JSON
    const parsed = JSON.parse(json);
    expect(parsed.items).toHaveLength(2);
  });

  it("creates destination directory if it does not exist", async () => {
    const nested = path.join(workDir, "nested", "deep", "rss");
    await generateFeed(dumpPath, nested);
    const rss = readFileSync(path.join(nested, "feed.xml"), "utf-8");
    expect(rss).toContain("illumination-k.dev");
  });
});
