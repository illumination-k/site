import { describe, expect, it } from "vitest";

import {
  DEFAULT_OG_IMAGE,
  FEED_TYPES,
  SITE_NAME,
  TWITTER_CREATOR,
  absoluteUrl,
  buildAlternates,
  buildOpenGraph,
  buildTwitterCard,
} from "./seo";

const BASE = "https://illumination-k.dev";

describe("absoluteUrl", () => {
  it("prefixes the site origin", () => {
    expect(absoluteUrl("/ja/techblog/1")).toBe(`${BASE}/ja/techblog/1`);
  });

  it("adds the missing leading slash", () => {
    expect(absoluteUrl("ja")).toBe(`${BASE}/ja`);
  });
});

describe("buildAlternates", () => {
  it("emits an absolute self-canonical and one hreflang per locale", () => {
    const alternates = buildAlternates({
      canonicalLocale: "en",
      buildPath: (locale) => `/${locale}/profile`,
    });

    expect(alternates?.canonical).toBe(`${BASE}/en/profile`);
    expect(alternates?.languages).toEqual({
      ja: `${BASE}/ja/profile`,
      en: `${BASE}/en/profile`,
      es: `${BASE}/es/profile`,
      "x-default": `${BASE}/ja/profile`,
    });
  });

  it("omits locales that have no version of the page", () => {
    const alternates = buildAlternates({
      canonicalLocale: "en",
      buildPath: (locale) => `/${locale}/techblog/tag/rust/2`,
      availableLocales: ["ja", "en"],
    });

    expect(Object.keys(alternates?.languages ?? {})).toEqual([
      "ja",
      "en",
      "x-default",
    ]);
  });

  it("falls back to the canonical locale for x-default when ja is absent", () => {
    const alternates = buildAlternates({
      canonicalLocale: "en",
      buildPath: (locale) => `/${locale}/techblog/post/uuid`,
      availableLocales: ["en", "es"],
    });

    expect(alternates?.languages?.["x-default"]).toBe(
      `${BASE}/en/techblog/post/uuid`,
    );
  });

  it("carries the feed links so a page override does not drop them", () => {
    const alternates = buildAlternates({
      canonicalLocale: "ja",
      buildPath: (locale) => `/${locale}`,
    });

    expect(alternates?.types).toEqual(FEED_TYPES);
    expect(FEED_TYPES["application/rss+xml"]).toBe(`${BASE}/rss/feed.xml`);
  });
});

describe("buildOpenGraph", () => {
  const input = {
    title: "techblog 記事一覧",
    description: "illumination-k.dev のtechblog記事一覧",
    path: "/ja/techblog/1",
    locale: "ja" as const,
  };

  it("restates the fields the layout would otherwise supply", () => {
    // Next.js replaces `openGraph` instead of merging it, so a page-level block
    // that omits these drops them from the document entirely.
    const og = buildOpenGraph(input);

    expect(og).toMatchObject({
      type: "website",
      siteName: SITE_NAME,
      locale: "ja_JP",
    });
  });

  it("points og:url at the absolute page URL", () => {
    expect(buildOpenGraph(input)).toMatchObject({
      url: `${BASE}/ja/techblog/1`,
    });
  });

  it("falls back to the site-wide preview image", () => {
    expect(buildOpenGraph(input)?.images).toEqual([{ ...DEFAULT_OG_IMAGE }]);
  });

  it("uses the given image when one is supplied", () => {
    const images = [
      { url: `${BASE}/og/techblog/x.png`, width: 1200, height: 630, alt: "x" },
    ];
    expect(buildOpenGraph({ ...input, images })?.images).toEqual(images);
  });

  it("maps the locale to its og:locale form", () => {
    expect(buildOpenGraph({ ...input, locale: "es" })).toMatchObject({
      locale: "es_ES",
    });
  });
});

describe("buildTwitterCard", () => {
  const input = { title: "Profile", description: "プロフィール" };

  it("restates the creator handle and uses a large image card", () => {
    expect(buildTwitterCard(input)).toMatchObject({
      card: "summary_large_image",
      creator: TWITTER_CREATOR,
    });
  });

  it("falls back to the site-wide preview image", () => {
    expect(buildTwitterCard(input).images).toEqual([DEFAULT_OG_IMAGE.url]);
  });
});

describe("DEFAULT_OG_IMAGE", () => {
  it("is an absolute URL at the OG size crawlers expect", () => {
    expect(DEFAULT_OG_IMAGE.url).toBe(`${BASE}/og/default.png`);
    expect(DEFAULT_OG_IMAGE.width).toBe(1200);
    expect(DEFAULT_OG_IMAGE.height).toBe(630);
  });
});
