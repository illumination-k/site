import type { MetadataRoute } from "next";

import { blogService } from "@/features/techblog/constant";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await blogService.repo.filterPosts("ja");
  const postSitemap: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://illumination-k.dev/techblog/post/${post.meta.uuid}`,
    lastModified: post.meta.updated_at,
  }));

  return postSitemap;
}
