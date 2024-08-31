import Post from "@/features/techblog/components/Post";
import { blogService } from "@/features/techblog/constant";

import { withZodPage } from "@/app/_util/withZodPage";
import { z } from "zod";
import { Metadata, ResolvedMetadata } from "next";

const paramsSchema = z.object({ uuid: z.string().uuid() });

type Params = z.input<typeof paramsSchema>;

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await blogService.repo.filterPosts("ja");
  const params = posts.map((post) => ({ uuid: post.meta.uuid }));
  return params;
}

export async function generateMetadata({ params }: { params: Params }, parent: ResolvedMetadata): Promise<Metadata> {
  const post = await blogService.repo.retrieve(params.uuid);
  if (!post) {
    throw `${params.uuid} is not found`;
  }

  return {
    title: post.meta.title,
    description: post.meta.description,
  };
}

const TechBlogPost = withZodPage({ params: paramsSchema }, async ({ params }) => {
  const post = await blogService.repo.retrieve(params.uuid);

  if (!post) {
    throw `${params.uuid} is not found`;
  }

  const relatedPostMeta = await blogService.getRelatedPostMeta(post.meta);

  return (
    <Post
      meta={post.meta}
      headings={post.headings}
      relatedPostMeta={relatedPostMeta}
      compiledMarkdown={post.compiledMarkdown}
    />
  );
});

export default TechBlogPost;
