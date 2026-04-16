import type { ReactElement, ReactNode } from "react";

import type { DumpPost, Lang } from "common";
import type { ResolvingMetadata } from "next";
import { describe, expect, it, vi } from "vitest";

const stubResolvingMetadata = {} as ResolvingMetadata;

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import BlogService from "@/features/articles/service";

import { TagPagerFactory, TagTopPageFactory } from "./tagFactory";

function makePost(
  uuid: string,
  tags: string[] = [],
  lang: Lang = "ja",
): DumpPost {
  return {
    meta: {
      uuid,
      title: `post-${uuid}`,
      description: "",
      category: "techblog",
      tags,
      lang,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    rawMarkdown: "",
    compiledMarkdown: "",
    headings: [],
  };
}

function uuid(n: number): string {
  return `${n.toString(16).padStart(8, "0")}-0000-4000-8000-000000000000`;
}

function makeService(opts: {
  posts?: DumpPost[];
  tags?: string[];
}): BlogService {
  const posts = opts.posts ?? [];
  const tags = opts.tags ?? [];
  return new BlogService({
    list: async () => posts,
    retrieve: async () => posts[0],
    categories: async () => [],
    tags: async () => tags,
    filterPosts: async (lang?: Lang, tag?: string) => {
      return posts.filter((p) => {
        if (lang && p.meta.lang !== lang) return false;
        if (tag && !p.meta.tags.includes(tag)) return false;
        return true;
      });
    },
    tagNetwork: async () => ({ nodes: [], edges: [] }),
  });
}

describe("TagPagerFactory", () => {
  describe("createGenerateMetadataFn", () => {
    it("returns the page-1 title when page === '1'", async () => {
      const factory = new TagPagerFactory("techblog", makeService({}));
      const fn = factory.createGenerateMetadataFn();

      const meta = await fn(
        {
          params: Promise.resolve({ locale: "ja", tag: "rust", page: "1" }),
        },
        stubResolvingMetadata,
      );

      expect(meta.title).toContain("rust");
      expect(meta.openGraph?.url).toBe(
        "https://www.illumination-k.dev/ja/techblog/tag/rust/1",
      );
    });

    it("returns the paginated title for page > 1", async () => {
      const factory = new TagPagerFactory("paperstream", makeService({}));
      const fn = factory.createGenerateMetadataFn();

      const meta = await fn(
        { params: Promise.resolve({ locale: "ja", tag: "go", page: "2" }) },
        stubResolvingMetadata,
      );

      expect(meta.openGraph?.url).toBe(
        "https://www.illumination-k.dev/ja/paperstream/tag/go/2",
      );
      expect(meta.title).toContain("go");
    });
  });

  describe("createGenerateStaticParamsFn", () => {
    it("emits one entry per (locale, tag, page) triple", async () => {
      const posts = [makePost(uuid(1), ["rust"]), makePost(uuid(2), ["go"])];
      const factory = new TagPagerFactory(
        "techblog",
        makeService({ posts, tags: ["rust", "go"] }),
      );
      const params = await factory.createGenerateStaticParamsFn()();

      // Each tag yields ≥0 pages per locale; rust + go each have 1 post in ja
      // (and zero in en/es), so we expect 2 entries (rust/ja/1 and go/ja/1).
      const jaParams = params.filter((p) => p.locale === "ja");
      expect(jaParams.map((p) => p.tag).sort()).toEqual(["go", "rust"]);
      expect(jaParams.every((p) => p.page === "1")).toBe(true);
    });

    it("emits no entries when there are no tags", async () => {
      const factory = new TagPagerFactory(
        "techblog",
        makeService({ tags: [] }),
      );
      const params = await factory.createGenerateStaticParamsFn()();
      expect(params).toEqual([]);
    });
  });

  describe("createPage", () => {
    it("returns a React element when params validate", async () => {
      const factory = new TagPagerFactory(
        "techblog",
        makeService({
          posts: [makePost(uuid(1), ["rust"])],
          tags: ["rust"],
        }),
      );
      const Page = factory.createPage();

      const result = await Page({
        params: Promise.resolve({ locale: "ja", tag: "rust", page: "1" }),
      });

      expect(result).toBeTruthy();
      expect(typeof result).toBe("object");
    });

    it("notFounds when page param fails number coercion", async () => {
      const factory = new TagPagerFactory("techblog", makeService({}));
      const Page = factory.createPage();

      await expect(
        Page({
          params: Promise.resolve({
            locale: "ja",
            tag: "rust",
            page: "not-a-number",
          }),
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
    });
  });
});

describe("TagTopPageFactory", () => {
  it("createGenerateMetadataFn builds tag list metadata", async () => {
    const factory = new TagTopPageFactory("techblog", makeService({}));
    const fn = factory.createGenerateMetadataFn();

    const meta = await fn({ params: Promise.resolve({ locale: "ja" }) });

    expect(meta.title).toContain("techblog");
    expect(meta.openGraph?.url).toBe(
      "https://www.illumination-k.dev/ja/techblog/tag",
    );
  });

  it("createPage renders all tags from the repo", async () => {
    const factory = new TagTopPageFactory(
      "techblog",
      makeService({ tags: ["rust", "go", "ts"] }),
    );
    const TagPage = factory.createPage();
    const result = await TagPage({
      params: Promise.resolve({ locale: "ja" }),
    });

    // Returned a React element with network link + tag list
    expect(result).toBeTruthy();
    const element = result as ReactElement<{ children: ReactNode }>;
    const children = element.props.children;
    // children[0] = network link div, children[1] = tag list div
    expect(Array.isArray(children) ? children.length : 0).toBe(2);
    const tagListDiv = (children as ReactElement[])[1] as ReactElement<{
      children: ReactNode;
    }>;
    const tags = tagListDiv.props.children;
    expect(Array.isArray(tags) ? tags.length : 0).toBe(3);
  });
});
