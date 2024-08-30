import Post from "@/features/techblog/components/Post";
import { blogService } from "@/features/techblog/constant";

import { withZodPage } from "@/app/_util/withZodPage";
import { z } from "zod";

const schema = {
  params: z.object({ uuid: z.string() }),
};

const TechBlogPost = withZodPage(schema, async ({ params }) => {
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
