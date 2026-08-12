import { render } from "@testing-library/react";
import type { PostMeta } from "common";
import { describe, expect, it } from "vitest";

import ArticleJsonLd from "./ArticleJsonLd";

const UUID = "00000000-0000-4000-8000-000000000000";

const meta: PostMeta = {
  uuid: UUID,
  title: "Hola",
  description: "Una publicación",
  category: "techblog",
  tags: ["rust", "nix"],
  lang: "es",
  created_at: "2024-01-01",
  updated_at: "2024-02-01",
};

function renderJsonLd() {
  const { container } = render(
    <ArticleJsonLd
      meta={meta}
      url={`https://illumination-k.dev/es/techblog/post/${UUID}`}
      imageUrl={`https://illumination-k.dev/og/techblog/${UUID}.png`}
    />,
  );
  const script = container.querySelector(
    'script[type="application/ld+json"]',
  ) as HTMLScriptElement;
  return JSON.parse(script.textContent ?? "{}");
}

describe("ArticleJsonLd", () => {
  it("points image at the generated OG file, without a locale segment", () => {
    // OG images are written to /og/{techblog,paperstream}/<uuid>.png. Deriving
    // the path from a locale-scoped prefix produced /og/es/techblog/... — a 404.
    const jsonLd = renderJsonLd();
    expect(jsonLd.image).toBe(
      `https://illumination-k.dev/og/techblog/${UUID}.png`,
    );
  });

  it("reports the real content language rather than collapsing to en", () => {
    const jsonLd = renderJsonLd();
    expect(jsonLd.inLanguage).toBe("es");
  });

  it("agrees with the canonical URL", () => {
    const jsonLd = renderJsonLd();
    const expected = `https://illumination-k.dev/es/techblog/post/${UUID}`;
    expect(jsonLd.url).toBe(expected);
    expect(jsonLd.mainEntityOfPage["@id"]).toBe(expected);
  });
});
