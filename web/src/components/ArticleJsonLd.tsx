import type { PostMeta } from "common";

interface ArticleJsonLdProps {
  meta: PostMeta;
  prefix: string;
}

export default function ArticleJsonLd({ meta, prefix }: ArticleJsonLdProps) {
  const url = `https://www.illumination-k.dev/${prefix}/post/${meta.uuid}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.created_at,
    dateModified: meta.updated_at,
    inLanguage: meta.lang === "ja" ? "ja" : "en",
    keywords: meta.tags.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: `https://www.illumination-k.dev/og/${prefix}/${meta.uuid}.png`,
    author: {
      "@type": "Person",
      name: "illumination-k",
      url: "https://www.illumination-k.dev",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
