import type { DumpPost, Lang, PostMeta } from "common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IBlogRepository } from "./irepository";
import BlogService from "./service";

function post(
  uuid: string,
  opts: {
    lang?: Lang;
    tags?: string[];
  } = {},
): DumpPost {
  return {
    meta: {
      uuid,
      title: `post-${uuid}`,
      description: "",
      category: "techblog",
      tags: opts.tags ?? [],
      lang: opts.lang ?? "ja",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    rawMarkdown: "",
    compiledMarkdown: "",
    headings: [],
  };
}

function makeRepo(posts: DumpPost[]): IBlogRepository {
  return {
    list: async () => posts,
    retrieve: async () => posts[0],
    categories: async () => [],
    tags: async () => [],
    filterPosts: async () => posts,
  };
}

function uuid(n: number): string {
  const hex = n.toString(16).padStart(1, "0");
  return `a${hex}b2c3d4-e5f6-7890-abcd-ef1234567890`;
}

const baseMeta = (
  u: string,
  tags: string[] = [],
  lang: Lang = "ja",
): PostMeta => ({
  uuid: u,
  title: "t",
  description: "",
  category: "techblog",
  tags,
  lang,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
});

describe("BlogService.getRelatedPostMeta", () => {
  beforeEach(() => {
    // Deterministic shuffle: Math.random always returns 0, which makes the
    // Fisher-Yates loop a no-op and preserves the input order.
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("excludes self, different lang, archive and draft posts", async () => {
    const target = baseMeta(uuid(0), ["ts"]);
    const repo = makeRepo([
      post(uuid(0), { tags: ["ts"] }), // self
      post(uuid(1), { tags: ["ts"], lang: "en" }), // wrong lang
      post(uuid(2), { tags: ["archive"] }),
      post(uuid(3), { tags: ["draft"] }),
      post(uuid(4), { tags: ["ts"] }),
    ]);

    const svc = new BlogService(repo);
    const result = await svc.getRelatedPostMeta(target);

    expect(result.map((p) => p.uuid)).toEqual([uuid(4)]);
  });

  it("returns all candidates when fewer than maxRelPost (6)", async () => {
    const target = baseMeta(uuid(0), ["ts"]);
    const repo = makeRepo([
      post(uuid(0)),
      post(uuid(1), { tags: ["ts"] }),
      post(uuid(2), { tags: ["go"] }),
    ]);

    const svc = new BlogService(repo);
    const result = await svc.getRelatedPostMeta(target);

    expect(result.map((p) => p.uuid).sort()).toEqual([uuid(1), uuid(2)].sort());
  });

  it("tops up with random posts when tag-matching is below maxRelPost", async () => {
    const target = baseMeta(uuid(0), ["ts"]);
    // 1 tag match + 6 non-tag-matching posts → should end up with 6
    const repo = makeRepo([
      post(uuid(0)),
      post(uuid(1), { tags: ["ts"] }), // matches
      post(uuid(2), { tags: ["go"] }),
      post(uuid(3), { tags: ["rust"] }),
      post(uuid(4), { tags: ["py"] }),
      post(uuid(5), { tags: ["sh"] }),
      post(uuid(6), { tags: ["md"] }),
      post(uuid(7), { tags: ["js"] }),
    ]);

    const svc = new BlogService(repo);
    const result = await svc.getRelatedPostMeta(target);

    expect(result).toHaveLength(6);
    expect(result.map((p) => p.uuid)).toContain(uuid(1));
  });

  it("slices to maxRelPost when more than 6 tag-matching posts exist", async () => {
    const target = baseMeta(uuid(0), ["ts"]);
    const repo = makeRepo([
      post(uuid(0)),
      ...Array.from({ length: 8 }, (_, i) =>
        post(uuid(i + 1), { tags: ["ts"] }),
      ),
    ]);

    const svc = new BlogService(repo);
    const result = await svc.getRelatedPostMeta(target);

    expect(result).toHaveLength(6);
  });
});
