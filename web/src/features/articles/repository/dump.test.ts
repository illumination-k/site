import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Dump, DumpPost, Lang } from "common";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import DumpRepository from "./dump";

function makePost(
  uuid: string,
  overrides: Partial<DumpPost["meta"]> = {},
): DumpPost {
  return {
    meta: {
      uuid,
      title: `post-${uuid}`,
      description: "",
      category: "techblog",
      tags: [],
      lang: "ja" as Lang,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      ...overrides,
    },
    rawMarkdown: "",
    compiledMarkdown: "",
    headings: [],
  };
}

const UUID_A = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const UUID_B = "a2b2c3d4-e5f6-7890-abcd-ef1234567890";
const UUID_C = "a3b2c3d4-e5f6-7890-abcd-ef1234567890";

function makeDump(): Dump {
  return {
    posts: [
      makePost(UUID_A, {
        tags: ["ts", "draft"],
        category: "techblog",
        lang: "ja",
      }),
      makePost(UUID_A, { tags: ["ts"], category: "techblog", lang: "en" }),
      makePost(UUID_B, {
        tags: ["go", "archive"],
        category: "paperstream",
        lang: "ja",
      }),
      makePost(UUID_C, { tags: ["rust"], category: "techblog", lang: "ja" }),
    ],
    categories: ["techblog", "paperstream"],
    tags: ["ts", "go", "rust", "archive", "draft", "ts"],
  };
}

describe("DumpRepository", () => {
  let dumpPath: string;
  let workDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(path.join(tmpdir(), "dump-repo-test-"));
    dumpPath = path.join(workDir, "dump.json");
    writeFileSync(dumpPath, JSON.stringify(makeDump()));
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it("retrieve returns the first match when lang is not provided", async () => {
    const repo = new DumpRepository(dumpPath);
    const post = await repo.retrieve(UUID_A);
    expect(post.meta.uuid).toBe(UUID_A);
    expect(post.meta.lang).toBe("ja");
  });

  it("retrieve prefers the lang-matching post when lang is provided", async () => {
    const repo = new DumpRepository(dumpPath);
    const post = await repo.retrieve(UUID_A, "en");
    expect(post.meta.lang).toBe("en");
  });

  it("retrieve falls back to first candidate when lang does not match", async () => {
    const repo = new DumpRepository(dumpPath);
    const post = await repo.retrieve(UUID_A, "es");
    expect(post.meta.lang).toBe("ja");
  });

  it("list returns all posts from dump", async () => {
    const repo = new DumpRepository(dumpPath);
    const posts = await repo.list();
    expect(posts).toHaveLength(4);
  });

  it("caches the dump across repeated calls", async () => {
    const repo = new DumpRepository(dumpPath);
    const a = await repo.list();
    // Delete the file: a second call must not try to read again
    rmSync(dumpPath);
    const b = await repo.list();
    expect(b).toEqual(a);
  });

  it("categories returns dump categories", async () => {
    const repo = new DumpRepository(dumpPath);
    expect(await repo.categories()).toEqual(["techblog", "paperstream"]);
  });

  it("tags dedupes, sorts, and appends archive/draft at the end", async () => {
    const repo = new DumpRepository(dumpPath);
    const tags = await repo.tags();
    expect(tags).toEqual(["go", "rust", "ts", "archive", "draft"]);
  });

  describe("filterPosts", () => {
    it("filters by lang", async () => {
      const repo = new DumpRepository(dumpPath);
      const posts = await repo.filterPosts("en");
      expect(posts).toHaveLength(1);
      expect(posts[0].meta.lang).toBe("en");
    });

    it("filters by tag (note: current impl overwrites lang filter)", async () => {
      const repo = new DumpRepository(dumpPath);
      const posts = await repo.filterPosts("ja", "ts");
      // Implementation reassigns `ok`, so the final predicate is the tag check.
      expect(posts.map((p) => p.meta.uuid).sort()).toEqual([UUID_A, UUID_A]);
    });

    it("filters by category", async () => {
      const repo = new DumpRepository(dumpPath);
      const posts = await repo.filterPosts(undefined, undefined, "paperstream");
      expect(posts).toHaveLength(1);
      expect(posts[0].meta.category).toBe("paperstream");
    });

    it("returns all posts when no filters are given", async () => {
      const repo = new DumpRepository(dumpPath);
      const posts = await repo.filterPosts();
      expect(posts).toHaveLength(4);
    });
  });
});
