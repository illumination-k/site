import { describe, expect, it, vi } from "vitest";

const shared = vi.hoisted(() => {
  interface Post {
    meta: {
      uuid: string;
      title: string;
      description: string;
      category: string;
      tags: string[];
      lang: "ja" | "en" | "es";
      created_at: string;
      updated_at: string;
    };
    rawMarkdown: string;
    compiledMarkdown: string;
    headings: unknown[];
  }

  interface Dump {
    posts: Post[];
    categories: string[];
    tags: string[];
  }

  const makePost = (
    uuid: string,
    overrides: Partial<Post["meta"]> = {},
  ): Post => ({
    meta: {
      uuid,
      title: `post-${uuid}`,
      description: "",
      category: "techblog",
      tags: [],
      lang: "ja",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      ...overrides,
    },
    rawMarkdown: "",
    compiledMarkdown: "",
    headings: [],
  });

  // 11 ja posts tagged "rust" — more than count_per_page (10) so pagination
  // produces 2 pages for /ja/techblog and /ja/techblog/tag/rust.
  const jaRustPosts: Post[] = Array.from({ length: 11 }, (_, i) =>
    makePost(`TB-JA-RUST-${i + 1}`, {
      lang: "ja",
      tags: ["rust"],
      updated_at: `2024-02-${String(i + 1).padStart(2, "0")}`,
    }),
  );

  const TECHBLOG_DUMP: Dump = {
    posts: [
      ...jaRustPosts,
      // en translation of TB-JA-RUST-1 with a newer updated_at — used to
      // verify lastModified picks the most recent across languages.
      makePost("TB-JA-RUST-1", {
        lang: "en",
        tags: ["rust"],
        updated_at: "2024-06-01",
      }),
      // en-only post (no ja counterpart): must still appear in /ja/.../post.
      makePost("TB-EN-ONLY", {
        lang: "en",
        tags: [],
        updated_at: "2024-04-01",
      }),
      // ja post tagged "go" — used to verify go tag pages appear only for ja.
      makePost("TB-JA-GO", {
        lang: "ja",
        tags: ["go"],
        updated_at: "2024-03-01",
      }),
    ],
    categories: ["techblog"],
    tags: ["rust", "go"],
  };

  const PAPERSTREAM_DUMP: Dump = {
    posts: [
      makePost("PS-JA", {
        lang: "ja",
        category: "paperstream",
        updated_at: "2024-05-01",
      }),
    ],
    categories: ["paperstream"],
    tags: [],
  };

  const defaultTags = ["archive", "draft"];

  const makeFakeService = (dump: Dump) => ({
    repo: {
      list: async () => dump.posts,
      tags: async () => {
        const unique = Array.from(new Set(dump.tags));
        const sorted = unique
          .filter((t) => !defaultTags.includes(t))
          .sort((a, b) => a.localeCompare(b));
        return sorted.concat(defaultTags);
      },
      filterPosts: async (lang?: string, tag?: string, category?: string) =>
        dump.posts.filter((p) => {
          if (lang && p.meta.lang !== lang) return false;
          if (tag && !p.meta.tags.includes(tag)) return false;
          if (category && p.meta.category !== category) return false;
          return true;
        }),
      retrieve: async () => undefined,
      categories: async () => dump.categories,
    },
  });

  return { TECHBLOG_DUMP, PAPERSTREAM_DUMP, makeFakeService };
});

vi.mock("@/features/techblog/constant", () => ({
  blogService: shared.makeFakeService(shared.TECHBLOG_DUMP),
}));

vi.mock("@/features/paperStream/constants", () => ({
  paperStreamService: shared.makeFakeService(shared.PAPERSTREAM_DUMP),
}));

// Import after vi.mock is set up.
import sitemap from "./sitemap";

const BASE = "https://www.illumination-k.dev";

describe("sitemap", () => {
  it("includes the site root and per-locale homepages", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toContain(BASE);
    expect(urls).toContain(`${BASE}/ja`);
    expect(urls).toContain(`${BASE}/en`);
    expect(urls).toContain(`${BASE}/es`);
  });

  it("includes the static policy/profile pages for every locale", async () => {
    const entries = await sitemap();
    const urls = new Set(entries.map((e) => e.url));

    for (const locale of ["ja", "en", "es"]) {
      for (const path of [
        "disclaimer",
        "privacy-policy",
        "profile",
        "metrics",
      ]) {
        expect(urls.has(`${BASE}/${locale}/${path}`)).toBe(true);
      }
    }
  });

  it("does not include any /search URL", async () => {
    const entries = await sitemap();
    for (const entry of entries) {
      expect(entry.url).not.toMatch(/\/search(\/|$)/);
    }
  });

  it("generates pagination per-locale based on each locale's post count", async () => {
    const entries = await sitemap();
    const urls = new Set(entries.map((e) => e.url));

    // ja has 12 posts (11 rust + 1 go) → 2 pages.
    expect(urls.has(`${BASE}/ja/techblog/1`)).toBe(true);
    expect(urls.has(`${BASE}/ja/techblog/2`)).toBe(true);
    expect(urls.has(`${BASE}/ja/techblog/3`)).toBe(false);

    // en has 2 posts → 1 page.
    expect(urls.has(`${BASE}/en/techblog/1`)).toBe(true);
    expect(urls.has(`${BASE}/en/techblog/2`)).toBe(false);

    // es has 0 posts → Math.max(1, 0) forces a single page,
    // matching PagerFactory.createGenerateStaticParamsFn.
    expect(urls.has(`${BASE}/es/techblog/1`)).toBe(true);
    expect(urls.has(`${BASE}/es/techblog/2`)).toBe(false);

    // paperStream has 1 ja post → 1 page, plus forced pages for en/es.
    expect(urls.has(`${BASE}/ja/paperstream/1`)).toBe(true);
    expect(urls.has(`${BASE}/en/paperstream/1`)).toBe(true);
    expect(urls.has(`${BASE}/es/paperstream/1`)).toBe(true);
    expect(urls.has(`${BASE}/ja/paperstream/2`)).toBe(false);
  });

  it("lists every unique post UUID across all languages for every locale", async () => {
    const entries = await sitemap();
    const urls = new Set(entries.map((e) => e.url));

    for (const locale of ["ja", "en", "es"]) {
      // en-only post is still emitted for all locales.
      expect(urls.has(`${BASE}/${locale}/techblog/post/TB-EN-ONLY`)).toBe(true);
      // ja-only post with the "go" tag is also present everywhere.
      expect(urls.has(`${BASE}/${locale}/techblog/post/TB-JA-GO`)).toBe(true);
      // Shared post appears once per locale.
      expect(urls.has(`${BASE}/${locale}/techblog/post/TB-JA-RUST-1`)).toBe(
        true,
      );
    }
  });

  it("picks the most recent updated_at across languages for lastModified", async () => {
    const entries = await sitemap();
    const shared = entries.find(
      (e) => e.url === `${BASE}/ja/techblog/post/TB-JA-RUST-1`,
    );
    expect(shared?.lastModified).toBe("2024-06-01");
  });

  it("generates tag pagination per-locale and skips locales with no tagged posts", async () => {
    const entries = await sitemap();
    const urls = new Set(entries.map((e) => e.url));

    // Tag index pages (one per locale, unconditional).
    expect(urls.has(`${BASE}/ja/techblog/tag`)).toBe(true);
    expect(urls.has(`${BASE}/en/techblog/tag`)).toBe(true);
    expect(urls.has(`${BASE}/es/techblog/tag`)).toBe(true);

    // rust: 11 ja posts → 2 pages for ja, 1 page for en, 0 pages for es.
    expect(urls.has(`${BASE}/ja/techblog/tag/rust/1`)).toBe(true);
    expect(urls.has(`${BASE}/ja/techblog/tag/rust/2`)).toBe(true);
    expect(urls.has(`${BASE}/ja/techblog/tag/rust/3`)).toBe(false);
    expect(urls.has(`${BASE}/en/techblog/tag/rust/1`)).toBe(true);
    expect(urls.has(`${BASE}/en/techblog/tag/rust/2`)).toBe(false);
    expect(urls.has(`${BASE}/es/techblog/tag/rust/1`)).toBe(false);

    // go: only ja has a post → only /ja/.../tag/go/1.
    expect(urls.has(`${BASE}/ja/techblog/tag/go/1`)).toBe(true);
    expect(urls.has(`${BASE}/en/techblog/tag/go/1`)).toBe(false);
    expect(urls.has(`${BASE}/es/techblog/tag/go/1`)).toBe(false);

    // Default tags (archive/draft) have no posts → no per-tag pages.
    expect(urls.has(`${BASE}/ja/techblog/tag/archive/1`)).toBe(false);
    expect(urls.has(`${BASE}/ja/techblog/tag/draft/1`)).toBe(false);
  });

  it("does not emit duplicate URLs", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
