import type { MetadataRoute } from "next";

import pager from "@/features/articles/utils/pager";
import { paperStreamService } from "@/features/paperStream/constants";
import { blogService } from "@/features/techblog/constant";
import { localeToLang, locales } from "@/lib/i18n";

export const dynamic = "force-static";

const BASE_URL = "https://www.illumination-k.dev";

const STATIC_PATHS = [
  "disclaimer",
  "privacy-policy",
  "profile",
  "metrics",
] as const;

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
        for (let i = 1; i <= totalPage; i++) {
          entries.push({
            url: `${BASE_URL}/${locale}/${prefix}/tag/${tag}/${i}`,
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
  // Post pages are statically generated for every unique UUID × every
  // locale, regardless of which language the source post is authored in
  // (see PostPageFactory.createGenerateStaticParamsFn). Mirror that here
  // so posts that only exist in en/es are also listed.
  const allPosts = await service.repo.list();
  const latestByUuid = new Map<string, string>();
  for (const post of allPosts) {
    const existing = latestByUuid.get(post.meta.uuid);
    if (!existing || existing < post.meta.updated_at) {
      latestByUuid.set(post.meta.uuid, post.meta.updated_at);
    }
  }

  return locales.flatMap((locale) =>
    Array.from(latestByUuid, ([uuid, lastModified]) => ({
      url: `${BASE_URL}/${locale}/${prefix}/post/${uuid}`,
      lastModified,
    })),
  );
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

  return [
    { url: BASE_URL },
    ...localeHomepages,
    ...staticPages,
    ...techblogPosts,
    ...paperStreamPosts,
    ...techblogPagination,
    ...paperStreamPagination,
    ...techblogTags,
    ...paperStreamTags,
  ];
}
