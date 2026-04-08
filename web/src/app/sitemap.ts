import type { MetadataRoute } from "next";

import pager from "@/features/articles/utils/pager";
import { paperStreamService } from "@/features/paperStream/constants";
import { blogService } from "@/features/techblog/constant";
import { locales } from "@/lib/i18n";

export const dynamic = "force-static";

const BASE_URL = "https://www.illumination-k.dev";

async function generatePaginationSitemap(
  prefix: string,
  service: typeof blogService,
): Promise<MetadataRoute.Sitemap> {
  const posts = await service.repo.filterPosts("ja");
  const totalPage = pager.getTotalPage(posts);
  return locales.flatMap((locale) =>
    Array.from({ length: totalPage }, (_, i) => ({
      url: `${BASE_URL}/${locale}/${prefix}/${i + 1}`,
    })),
  );
}

async function generateTagSitemap(
  prefix: string,
  service: typeof blogService,
): Promise<MetadataRoute.Sitemap> {
  const tags = await service.repo.tags();
  const entries: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${BASE_URL}/${locale}/${prefix}/tag`,
  }));

  for (const tag of tags) {
    const taggedPosts = await service.repo.filterPosts("ja", tag);
    const totalPage = pager.getTotalPage(taggedPosts);
    for (const locale of locales) {
      for (let i = 1; i <= totalPage; i++) {
        entries.push({
          url: `${BASE_URL}/${locale}/${prefix}/tag/${tag}/${i}`,
        });
      }
    }
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await blogService.repo.filterPosts("ja");
  const postSitemap: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    posts.map((post) => ({
      url: `${BASE_URL}/${locale}/techblog/post/${post.meta.uuid}`,
      lastModified: post.meta.updated_at,
    })),
  );

  const paperStreamPosts = await paperStreamService.repo.filterPosts("ja");
  const paperStreamSitemap: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    paperStreamPosts.map((post) => ({
      url: `${BASE_URL}/${locale}/paperstream/post/${post.meta.uuid}`,
      lastModified: post.meta.updated_at,
    })),
  );

  const techblogPagination = await generatePaginationSitemap(
    "techblog",
    blogService,
  );
  const paperStreamPagination = await generatePaginationSitemap(
    "paperstream",
    paperStreamService,
  );
  const techblogTags = await generateTagSitemap("techblog", blogService);
  const paperStreamTags = await generateTagSitemap(
    "paperstream",
    paperStreamService,
  );

  const localeHomepages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
  }));

  return [
    { url: BASE_URL },
    ...localeHomepages,
    ...postSitemap,
    ...paperStreamSitemap,
    ...techblogPagination,
    ...paperStreamPagination,
    ...techblogTags,
    ...paperStreamTags,
  ];
}
