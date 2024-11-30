import type { MetadataRoute } from "next";

import { paperStreamService } from "@/features/paperStream/constants";
import { blogService } from "@/features/techblog/constant";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await blogService.repo.filterPosts("ja");
  const postSitemap: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://illumination-k.dev/techblog/post/${post.meta.uuid}`,
    lastModified: post.meta.updated_at,
  }));

  const paperStreamPosts = await paperStreamService.repo.filterPosts("ja");

  const paperStreamSitemap: MetadataRoute.Sitemap = paperStreamPosts.map(
    (post) => ({
      url: `https://illumination-k.dev/paperstream/post/${post.meta.uuid}`,
      lastModified: post.meta.updated_at,
    }),
  );

  return [...postSitemap, ...paperStreamSitemap];
}
