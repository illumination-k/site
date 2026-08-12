import type { PostMeta } from "common";

import { SITE_URL } from "@/lib/site";

interface ArticleJsonLdProps {
  meta: PostMeta;
  /** Canonical URL of the article — must match `alternates.canonical`. */
  url: string;
  /** Absolute URL of the article's OG image. */
  imageUrl: string;
}

export default function ArticleJsonLd({
  meta,
  url,
  imageUrl,
}: ArticleJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    // A post whose front-matter description is empty must omit the property
    // rather than declare an empty one: `"description": ""` is an invalid
    // value for the field, while an absent property is simply not stated.
    ...(meta.description ? { description: meta.description } : {}),
    datePublished: meta.created_at,
    dateModified: meta.updated_at,
    inLanguage: meta.lang,
    keywords: meta.tags.join(", "),
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: imageUrl,
    author: {
      "@type": "Person",
      name: "illumination-k",
      url: SITE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
