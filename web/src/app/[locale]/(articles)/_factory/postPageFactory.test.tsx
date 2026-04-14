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

import PostPageFactory from "./postPageFactory";

const UUID = "11111111-2222-4333-8444-555555555555";
const UUID_OTHER = "11111111-2222-4333-8444-555555555556";

function makePost(
  uuid: string,
  overrides: Partial<DumpPost["meta"]> = {},
): DumpPost {
  return {
    meta: {
      uuid,
      title: `post-${uuid}`,
      description: "desc",
      category: "techblog",
      tags: [],
      lang: "ja" as Lang,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      ...overrides,
    },
    rawMarkdown: "",
    compiledMarkdown: "<p>body</p>",
    headings: [],
  };
}

function makeService(posts: DumpPost[]): BlogService {
  return new BlogService({
    list: async () => posts,
    retrieve: async (uuid: string, lang?: Lang) => {
      const candidates = posts.filter((p) => p.meta.uuid === uuid);
      if (lang) {
        return candidates.find((p) => p.meta.lang === lang) ?? candidates[0];
      }
      return candidates[0];
    },
    categories: async () => [],
    tags: async () => [],
    filterPosts: async () => posts,
  });
}

describe("PostPageFactory", () => {
  describe("createGenerateStaticParamsFn", () => {
    it("emits one param per (locale, unique-uuid) pair", async () => {
      const posts = [
        makePost(UUID, { lang: "ja" }),
        makePost(UUID, { lang: "en" }),
        makePost(UUID_OTHER, { lang: "ja" }),
      ];
      const factory = new PostPageFactory("techblog", makeService(posts));
      const params = await factory.createGenerateStaticParamsFn()();

      // 3 locales × 2 unique uuids
      expect(params).toHaveLength(6);
      const uniqueUuids = new Set(params.map((p) => p.uuid));
      expect(uniqueUuids).toEqual(new Set([UUID, UUID_OTHER]));
      const uniqueLocales = new Set(params.map((p) => p.locale));
      expect(uniqueLocales).toEqual(new Set(["ja", "en", "es"]));
    });
  });

  describe("createGenerateMetadataFn", () => {
    it("builds metadata, OG image URL, and twitter card from the post", async () => {
      const factory = new PostPageFactory(
        "techblog",
        makeService([
          makePost(UUID, { title: "Hello", description: "World", tags: ["x"] }),
        ]),
      );
      const fn = factory.createGenerateMetadataFn();

      const meta = await fn(
        { params: Promise.resolve({ locale: "ja", uuid: UUID }) },
        stubResolvingMetadata,
      );

      expect(meta.title).toBe("Hello");
      expect(meta.description).toBe("World");
      expect(meta.openGraph?.url).toBe(
        `https://www.illumination-k.dev/ja/techblog/post/${UUID}`,
      );
      expect(meta.openGraph?.locale).toBe("ja_JP");
      const ogImages = meta.openGraph?.images as { url: string }[];
      expect(ogImages[0].url).toBe(`/og/techblog/${UUID}.png`);
      expect(meta.twitter?.card).toBe("summary_large_image");
    });

    it("uses the english OG locale when locale is en", async () => {
      const factory = new PostPageFactory(
        "techblog",
        makeService([makePost(UUID, { lang: "en" })]),
      );
      const fn = factory.createGenerateMetadataFn();

      const meta = await fn(
        { params: Promise.resolve({ locale: "en", uuid: UUID }) },
        stubResolvingMetadata,
      );

      expect(meta.openGraph?.locale).toBe("en_US");
      expect(meta.openGraph?.url).toBe(
        `https://www.illumination-k.dev/en/techblog/post/${UUID}`,
      );
    });

    it("throws when the post is not found", async () => {
      const factory = new PostPageFactory("techblog", makeService([]));
      const fn = factory.createGenerateMetadataFn();

      await expect(
        fn(
          { params: Promise.resolve({ locale: "ja", uuid: UUID }) },
          stubResolvingMetadata,
        ),
      ).rejects.toMatch(/is not found/);
    });
  });

  describe("createPostPage", () => {
    it("returns a React element when the post exists", async () => {
      const posts = [makePost(UUID), makePost(UUID_OTHER)];
      const factory = new PostPageFactory("techblog", makeService(posts));
      const Page = factory.createPostPage();

      const result = await Page({
        params: Promise.resolve({ locale: "ja", uuid: UUID }),
      });

      expect(result).toBeTruthy();
      expect(typeof result).toBe("object");
    });

    it("notFounds when the uuid param fails uuid validation", async () => {
      const factory = new PostPageFactory("techblog", makeService([]));
      const Page = factory.createPostPage();

      await expect(
        Page({
          params: Promise.resolve({ locale: "ja", uuid: "not-a-uuid" }),
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
    });
  });
});
