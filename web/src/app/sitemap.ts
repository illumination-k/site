import type { MetadataRoute } from "next";

import { paperStreamService } from "@/features/paperStream/constants";
import pager from "@/features/articles/utils/pager";
import { blogService } from "@/features/techblog/constant";

export const dynamic = "force-static";

const BASE_URL = "https://www.illumination-k.dev";

async function generatePaginationSitemap(
  prefix: string,
  service: typeof blogService,
): Promise<MetadataRoute.Sitemap> {
  const posts = await service.repo.filterPosts("ja");
  const totalPage = pager.getTotalPage(posts);
  return Array.from({ length: totalPage }, (_, i) => ({
    url: `${BASE_URL}/${prefix}/${i + 1}`,
  }));
}

async function generateTagSitemap(
  prefix: string,
  service: typeof blogService,
): Promise<MetadataRoute.Sitemap> {
  const tags = await service.repo.tags();
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/${prefix}/tag` },
  ];

  for (const tag of tags) {
    const taggedPosts = await service.repo.filterPosts("ja", tag);
    const totalPage = pager.getTotalPage(taggedPosts);
    for (let i = 1; i <= totalPage; i++) {
      entries.push({ url: `${BASE_URL}/${prefix}/tag/${tag}/${i}` });
    }
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await blogService.repo.filterPosts("ja");
  const postSitemap: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/techblog/post/${post.meta.uuid}`,
    lastModified: post.meta.updated_at,
  }));

  const paperStreamPosts = await paperStreamService.repo.filterPosts("ja");
  const paperStreamSitemap: MetadataRoute.Sitemap = paperStreamPosts.map(
    (post) => ({
      url: `${BASE_URL}/paperstream/post/${post.meta.uuid}`,
      lastModified: post.meta.updated_at,
    }),
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

  return [
    { url: BASE_URL },
    ...postSitemap,
    ...paperStreamSitemap,
    ...techblogPagination,
    ...paperStreamPagination,
    ...techblogTags,
    ...paperStreamTags,
  ];
}
