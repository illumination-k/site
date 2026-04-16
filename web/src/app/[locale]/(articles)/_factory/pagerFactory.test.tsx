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

import PagerFactory from "./pagerFactory";

function makePost(uuid: string, lang: Lang = "ja"): DumpPost {
  return {
    meta: {
      uuid,
      title: `post-${uuid}`,
      description: "",
      category: "techblog",
      tags: [],
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
  return `${n.toString(16).padStart(8, "0")}-0000-0000-0000-000000000000`;
}

function makeService(posts: DumpPost[]): BlogService {
  const filterPosts = vi.fn(async (lang?: Lang) =>
    lang ? posts.filter((p) => p.meta.lang === lang) : posts,
  );

  return new BlogService({
    list: async () => posts,
    retrieve: async () => posts[0],
    categories: async () => [],
    tags: async () => [],
    filterPosts,
    tagNetwork: async () => ({ nodes: [], edges: [] }),
  });
}

describe("PagerFactory", () => {
  describe("createGenerateMetadataFn", () => {
    it("returns the page-1 title when page === '1'", async () => {
      const factory = new PagerFactory("techblog", makeService([]));
      const fn = factory.createGenerateMetadataFn();

      const meta = await fn(
        { params: Promise.resolve({ locale: "ja", page: "1" }) },
        stubResolvingMetadata,
      );

      expect(meta.title).toBe("techblog 記事一覧");
      expect(meta.openGraph?.url).toBe(
        "https://www.illumination-k.dev/ja/techblog/1",
      );
    });

    it("returns the paginated title for page > 1", async () => {
      const factory = new PagerFactory("paperstream", makeService([]));
      const fn = factory.createGenerateMetadataFn();

      const meta = await fn(
        { params: Promise.resolve({ locale: "en", page: "3" }) },
        stubResolvingMetadata,
      );

      expect(meta.title).toContain("paperstream");
      expect(meta.openGraph?.url).toBe(
        "https://www.illumination-k.dev/en/paperstream/3",
      );
    });

    it("falls back to 'ja' when the locale param is invalid", async () => {
      const factory = new PagerFactory("techblog", makeService([]));
      const fn = factory.createGenerateMetadataFn();

      const meta = await fn(
        { params: Promise.resolve({ locale: "fr", page: "1" }) },
        stubResolvingMetadata,
      );

      // ja dictionary contains 記事一覧
      expect(meta.title).toContain("記事一覧");
      // The URL is built from the validated locale, which falls back to "ja".
      expect(meta.openGraph?.url).toBe(
        "https://www.illumination-k.dev/ja/techblog/1",
      );
    });
  });

  describe("createGenerateStaticParamsFn", () => {
    it("emits one param per page for each locale, with at least one entry", async () => {
      const posts = [makePost(uuid(1)), makePost(uuid(2), "en")];
      const factory = new PagerFactory("techblog", makeService(posts));
      const params = await factory.createGenerateStaticParamsFn()();

      // Each locale yields at least one page, even when empty.
      const locales = new Set(params.map((p) => p.locale));
      expect(locales).toEqual(new Set(["ja", "en", "es"]));
      expect(params.every((p) => /^\d+$/.test(p.page))).toBe(true);
    });

    it("emits one fallback page even when a locale has zero posts", async () => {
      const factory = new PagerFactory("techblog", makeService([]));
      const params = await factory.createGenerateStaticParamsFn()();

      // 3 locales × 1 forced page each
      expect(params).toHaveLength(3);
      expect(params.every((p) => p.page === "1")).toBe(true);
    });
  });

  describe("createPage", () => {
    it("returns a ReactElement when params validate", async () => {
      const posts: DumpPost[] = Array.from({ length: 3 }, (_, i) =>
        makePost(uuid(i + 1)),
      );
      const factory = new PagerFactory("techblog", makeService(posts));
      const Page = factory.createPage();

      const result = await Page({
        params: Promise.resolve({ locale: "ja", page: "1" }),
      });

      // React element shape
      expect(result).toBeTruthy();
      expect(typeof result).toBe("object");
    });

    it("calls notFound when page param fails validation", async () => {
      const factory = new PagerFactory("techblog", makeService([]));
      const Page = factory.createPage();

      await expect(
        Page({
          params: Promise.resolve({ locale: "ja", page: "not-a-number" }),
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
    });
  });
});
