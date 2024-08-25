import { ParsedUrlQuery } from "querystring";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

import Post, { PostProps } from "@/features/techblog/components/Post";
import { blogService } from "@/features/techblog/constant";

const TechBlogPost: NextPage<PostProps> = (props) => {
  return (
    <>
      <Post {...props} />
    </>
  );
};

export const getStaticProps: GetStaticProps<PostProps, Params> = async ({ params }) => {
  const post = await blogService.repo.retrive(params!.uuid);

  if (!post) {
    throw `${params?.id} is not found`;
  }

  const relatedPostMeta = await blogService.getRelatedPostMeta(post.meta);

  return {
    props: {
      meta: post.meta,
      headings: post.headings,
      relatedPostMeta,
      compiledMarkdown: post.compiledMarkdown,
    },
  };
};

interface Params extends ParsedUrlQuery {
  uuid: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const posts = await blogService.repo.list();

  const paths = posts.map((post) => {
    return { params: { uuid: post.meta.uuid }, locale: post.meta.lang };
  });

  return {
    paths,
    fallback: false,
  };
};

export default TechBlogPost;
