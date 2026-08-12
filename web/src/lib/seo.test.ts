import { describe, expect, it } from "vitest";

import { FEED_TYPES, absoluteUrl, buildAlternates } from "./seo";

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
