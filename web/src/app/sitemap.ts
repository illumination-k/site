import type { MetadataRoute } from "next";

import pager from "@/features/articles/utils/pager";
import { paperStreamService } from "@/features/paperStream/constants";
import { blogService } from "@/features/techblog/constant";
import { langToLocale, localeToLang, locales } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const BASE_URL = SITE_URL;

const STATIC_PATHS = ["disclaimer", "privacy-policy", "profile"] as const;

/** Article prefixes that ship a `/tag/network` page. */
const TAG_NETWORK_PREFIXES = ["techblog", "paperstream"] as const;

async function generatePaginationSitemap(
  prefix: string,
  service: typeof blogService,
): Promise<MetadataRoute.Sitemap> {
  const perLocale = await Promise.all(
    locales.map(async (locale) => {
      const lang = localeToLang(locale);
      const posts = await service.repo.filterPosts(lang);
      const totalPage = Math.max(1, pager.getTotalPage(posts));
      return Array.from({ length: totalPage }, (_, i) => ({
        url: `${BASE_URL}/${locale}/${prefix}/${i + 1}`,
      }));
    }),
  );
  return perLocale.flat();
}

async function generateTagSitemap(
  prefix: string,
  service: typeof blogService,
): Promise<MetadataRoute.Sitemap> {
  const tags = await service.repo.tags();
  const entries: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${BASE_URL}/${locale}/${prefix}/tag`,
  }));

  // Tag pages are statically generated per-locale via filterPosts(lang, tag)
  // (see TagPagerFactory.createGenerateStaticParamsFn), so mirror that here
  // to avoid advertising pages that were not generated.
  await Promise.all(
    locales.map(async (locale) => {
      const lang = localeToLang(locale);
      for (const tag of tags) {
        const taggedPosts = await service.repo.filterPosts(lang, tag);
        const totalPage = pager.getTotalPage(taggedPosts);
        // Tags may contain characters that are not legal in a URL path — e.g.
        // "chrome extension". Next writes `url` into <loc> verbatim, so an
        // unencoded space makes the entry an invalid URL that also disagrees
        // with the page's own (encoded) canonical.
        const encodedTag = encodeURIComponent(tag);
        for (let i = 1; i <= totalPage; i++) {
          entries.push({
            url: `${BASE_URL}/${locale}/${prefix}/tag/${encodedTag}/${i}`,
          });
        }
      }
    }),
  );

  return entries;
}

async function generatePostSitemap(
  prefix: string,
  service: typeof blogService,
): Promise<MetadataRoute.Sitemap> {
  // Post pages are statically generated for every unique UUID × every locale,
  // so a post written only in ja is served byte-for-byte identically at
  // /en/... and /es/.... Those copies canonicalise back to the locale that
  // owns the content (see PostPageFactory.createGenerateMetadataFn), and a
  // sitemap is supposed to advertise canonical URLs only — listing the copies
  // asks crawlers to index pages we ourselves declare non-canonical.
  //
  // So emit one entry per language version that actually exists, at the locale
  // that language belongs to.
  const allPosts = await service.repo.list();
  const lastModifiedByUrl = new Map<string, string>();
  for (const post of allPosts) {
    const locale = langToLocale(post.meta.lang);
    const url = `${BASE_URL}/${locale}/${prefix}/post/${post.meta.uuid}`;
    const existing = lastModifiedByUrl.get(url);
    if (!existing || existing < post.meta.updated_at) {
      lastModifiedByUrl.set(url, post.meta.updated_at);
    }
  }

  return Array.from(lastModifiedByUrl, ([url, lastModified]) => ({
    url,
    lastModified,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    techblogPosts,
    paperStreamPosts,
    techblogPagination,
    paperStreamPagination,
    techblogTags,
    paperStreamTags,
  ] = await Promise.all([
    generatePostSitemap("techblog", blogService),
    generatePostSitemap("paperstream", paperStreamService),
    generatePaginationSitemap("techblog", blogService),
    generatePaginationSitemap("paperstream", paperStreamService),
    generateTagSitemap("techblog", blogService),
    generateTagSitemap("paperstream", paperStreamService),
  ]);

  const localeHomepages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
  }));

  const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    STATIC_PATHS.map((path) => ({
      url: `${BASE_URL}/${locale}/${path}`,
    })),
  );

  // The tag network is exported for every locale via the [locale] layout's
  // generateStaticParams, but is only reachable from the tag index page.
  const tagNetworkPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    TAG_NETWORK_PREFIXES.map((prefix) => ({
      url: `${BASE_URL}/${locale}/${prefix}/tag/network`,
    })),
  );

  // The bare origin is not listed: it only redirects to the default locale and
  // canonicalises to `/${defaultLocale}`, which `localeHomepages` already has.
  return [
    ...localeHomepages,
    ...staticPages,
    ...tagNetworkPages,
    ...techblogPosts,
    ...paperStreamPosts,
    ...techblogPagination,
    ...paperStreamPagination,
    ...techblogTags,
    ...paperStreamTags,
  ];
}
