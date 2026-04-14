import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Dump } from "common";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import generateFeed from "./feed";

const UUID_FIRST = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const UUID_SECOND = "a2b2c3d4-e5f6-7890-abcd-ef1234567890";
const UUID_EN_ONLY = "a3b2c3d4-e5f6-7890-abcd-ef1234567890";

function makeDump(): Dump {
  return {
    posts: [
      {
        meta: {
          uuid: UUID_FIRST,
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
      // English translation of the first post — must be deduped away in
      // favour of the ja primary version.
      {
        meta: {
          uuid: UUID_FIRST,
          title: "First Post (EN)",
          description: "A first post (en)",
          category: "techblog",
          tags: ["ts"],
          lang: "en",
          created_at: "2024-01-01",
          updated_at: "2024-02-15",
        },
        rawMarkdown: "# First",
        compiledMarkdown: "<h1>First</h1>",
        headings: [{ depth: 1, value: "First" }],
      },
      {
        meta: {
          uuid: UUID_SECOND,
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
      // English-only post — must appear in the feed with an /en/ URL.
      {
        meta: {
          uuid: UUID_EN_ONLY,
          title: "English Only Post",
          description: "An english-only post",
          category: "techblog",
          tags: [],
          lang: "en",
          created_at: "2024-05-01",
          updated_at: "2024-05-10",
        },
        rawMarkdown: "# English",
        compiledMarkdown: "<h1>English</h1>",
        headings: [{ depth: 1, value: "English" }],
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

  it("writes feed.xml, atom.xml, feed.json containing one item per unique post", async () => {
    await generateFeed(dumpPath, dst);

    const rss = readFileSync(path.join(dst, "feed.xml"), "utf-8");
    const atom = readFileSync(path.join(dst, "atom.xml"), "utf-8");
    const json = readFileSync(path.join(dst, "feed.json"), "utf-8");

    for (const body of [rss, atom, json]) {
      expect(body).toContain("First Post");
      expect(body).toContain("Second Post");
      expect(body).toContain("English Only Post");
    }

    // feed.json should be valid JSON and deduped by UUID (3 posts, one of
    // which has a ja+en pair that collapses to a single item).
    const parsed = JSON.parse(json);
    expect(parsed.items).toHaveLength(3);
  });

  it("prefers the primary language (ja) when a post exists in multiple languages", async () => {
    await generateFeed(dumpPath, dst);
    const json = JSON.parse(readFileSync(path.join(dst, "feed.json"), "utf-8"));

    const firstItem = json.items.find((item: { id: string }) =>
      item.id.endsWith(`/techblog/post/${UUID_FIRST}`),
    );
    expect(firstItem).toBeDefined();
    // The English translation must not be emitted separately.
    expect(firstItem.title).toBe("First Post");
    expect(firstItem.url).toBe(
      `https://www.illumination-k.dev/ja/techblog/post/${UUID_FIRST}`,
    );
  });

  it("emits locale-prefixed URLs that match each post's language", async () => {
    await generateFeed(dumpPath, dst);
    const json = JSON.parse(readFileSync(path.join(dst, "feed.json"), "utf-8"));
    const urls: string[] = json.items.map((item: { url: string }) => item.url);

    expect(urls).toContain(
      `https://www.illumination-k.dev/ja/techblog/post/${UUID_FIRST}`,
    );
    expect(urls).toContain(
      `https://www.illumination-k.dev/ja/techblog/post/${UUID_SECOND}`,
    );
    // English-only post keeps its /en/ prefix.
    expect(urls).toContain(
      `https://www.illumination-k.dev/en/techblog/post/${UUID_EN_ONLY}`,
    );

    // No item should link to an unprefixed /techblog/post/... URL.
    for (const u of urls) {
      expect(u).not.toMatch(
        /https:\/\/www\.illumination-k\.dev\/techblog\/post\//,
      );
    }
  });

  it("orders items by updated_at descending", async () => {
    await generateFeed(dumpPath, dst);
    const json = JSON.parse(readFileSync(path.join(dst, "feed.json"), "utf-8"));
    const ids: string[] = json.items.map((item: { id: string }) => item.id);

    // English-only (2024-05-10) → Second (2024-04-01) → First (2024-02-01)
    expect(ids).toEqual([
      `https://www.illumination-k.dev/en/techblog/post/${UUID_EN_ONLY}`,
      `https://www.illumination-k.dev/ja/techblog/post/${UUID_SECOND}`,
      `https://www.illumination-k.dev/ja/techblog/post/${UUID_FIRST}`,
    ]);
  });

  it("creates destination directory if it does not exist", async () => {
    const nested = path.join(workDir, "nested", "deep", "rss");
    await generateFeed(dumpPath, nested);
    const rss = readFileSync(path.join(nested, "feed.xml"), "utf-8");
    expect(rss).toContain("illumination-k.dev");
  });
});
