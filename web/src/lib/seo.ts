import type { Metadata } from "next";

import {
  type Locale,
  defaultLocale,
  localeToOgLocale,
  locales,
} from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

/** Value of `og:site_name`, and the suffix of the document title template. */
export const SITE_NAME = "illumination-k.dev";

/** Handle credited as `twitter:creator`. */
export const TWITTER_CREATOR = "@illuminationK";

/**
 * Feeds advertised via `<link rel="alternate">` so readers and crawlers can
 * discover them. `pnpm cli:rss` writes these three files into
 * `web/public/rss`.
 */
export const FEED_TYPES: Record<string, string> = {
  "application/rss+xml": `${SITE_URL}/rss/feed.xml`,
  "application/atom+xml": `${SITE_URL}/rss/atom.xml`,
  "application/feed+json": `${SITE_URL}/rss/feed.json`,
};

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Social preview image for every page that has no image of its own.
 *
 * Written by `pnpm cli:og` (see `cli/src/og.ts`), which runs before the Next.js
 * build, alongside the per-post images under `/og/{prefix}/{uuid}.png`.
 */
export const DEFAULT_OG_IMAGE = {
  url: absoluteUrl("/og/default.png"),
  width: 1200,
  height: 630,
  alt: SITE_NAME,
} as const;

interface OpenGraphInput {
  title: string;
  description: string;
  /** Page path, e.g. `/ja/techblog/1`. Must agree with the canonical. */
  path: string;
  /** Locale to advertise as `og:locale` — the content's, not always the route's. */
  locale: Locale;
  /** Overrides the site-wide default preview image. */
  images?: readonly {
    url: string;
    width: number;
    height: number;
    alt: string;
  }[];
}

/**
 * Builds a complete page-level `openGraph` block.
 *
 * Next.js replaces `openGraph` wholesale rather than merging it with the
 * layout's, so a page that declares even one field silently drops every field
 * the layout set — `og:type`, `og:site_name` and `og:image` included. Every
 * page therefore has to restate them, which is what this helper is for.
 */
export function buildOpenGraph({
  title,
  description,
  path,
  locale,
  images = [DEFAULT_OG_IMAGE],
}: OpenGraphInput): Metadata["openGraph"] {
  return {
    type: "website",
    siteName: SITE_NAME,
    title,
    description,
    url: absoluteUrl(path),
    locale: localeToOgLocale[locale],
    images: images.map((image) => ({ ...image })),
  };
}

/**
 * Twitter card for a page relying on the default preview image. Like
 * `openGraph`, `twitter` is replaced rather than merged, so a page that sets
 * its own card has to restate the creator handle.
 */
export function buildTwitterCard({
  title,
  description,
  images = [DEFAULT_OG_IMAGE],
}: Pick<
  OpenGraphInput,
  "title" | "description" | "images"
>): Metadata["twitter"] {
  return {
    card: "summary_large_image",
    creator: TWITTER_CREATOR,
    title,
    description,
    images: images.map((image) => image.url),
  };
}

interface AlternatesInput {
  /**
   * Locale whose URL is the indexable one. For most pages this is the locale
   * being rendered (each locale is a genuine translation of the UI). For post
   * pages it is the locale that actually holds the content: every UUID is
   * statically exported under every locale, so a ja-only post is byte-for-byte
   * duplicated at /en/... and /es/... and must point back at /ja/....
   */
  canonicalLocale: Locale;
  /** Maps a locale to the path of this page in that locale. */
  buildPath: (locale: Locale) => string;
  /**
   * Locales that have a real version of this page. Locales left out get no
   * hreflang entry — advertising a page that was never generated (or that only
   * repeats another language's content) is worse than advertising nothing.
   */
  availableLocales?: readonly Locale[];
}

/**
 * Builds the `alternates` block for a page: a self-referencing (or
 * content-owning) canonical, hreflang links for the locales that really have
 * the page, and the feed links.
 *
 * Next.js replaces `alternates` wholesale rather than merging it with the
 * layout's, so every page has to build its own complete block — that is why
 * the feed links live here instead of only in the root layout.
 */
export function buildAlternates({
  canonicalLocale,
  buildPath,
  availableLocales = locales,
}: AlternatesInput): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const locale of availableLocales) {
    languages[locale] = absoluteUrl(buildPath(locale));
  }

  // x-default is the entry point for users whose language we do not serve.
  // Prefer the site default, but never point it at a page we did not emit.
  const xDefaultLocale = availableLocales.includes(defaultLocale)
    ? defaultLocale
    : canonicalLocale;
  languages["x-default"] = absoluteUrl(buildPath(xDefaultLocale));

  return {
    canonical: absoluteUrl(buildPath(canonicalLocale)),
    languages,
    types: FEED_TYPES,
  };
}
