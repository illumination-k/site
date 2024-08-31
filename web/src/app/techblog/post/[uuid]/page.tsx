import type { Metadata, ResolvingMetadata } from "next";
import { z } from "zod";

import { withZodPage } from "@/app/_util/withZodPage";
import Post from "@/features/techblog/components/Post";
import { blogService } from "@/features/techblog/constant";

const paramsSchema = z.object({ uuid: z.string().uuid() });

type Params = z.input<typeof paramsSchema>;

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await blogService.repo.filterPosts("ja");
  const params = posts.map((post) => ({ uuid: post.meta.uuid }));
  return params;
}

export async function generateMetadata({ params }: { params: Params }, _parent: ResolvingMetadata): Promise<Metadata> {
  const post = await blogService.repo.retrieve(params.uuid);
  if (!post) {
    throw `${params.uuid} is not found`; // eslint-disable-line @typescript-eslint/only-throw-error
  }

  return {
    title: post.meta.title,
    description: post.meta.description,
  };
}

const TechBlogPost = withZodPage({ params: paramsSchema }, async ({ params }) => {
  const post = await blogService.repo.retrieve(params.uuid);

  if (!post) {
    throw `${params.uuid} is not found`; // eslint-disable-line @typescript-eslint/only-throw-error
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
