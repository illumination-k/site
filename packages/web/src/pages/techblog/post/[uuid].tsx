import { ParsedUrlQuery } from "querystring";

import { Headings, PostMeta } from "common";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

import Post from "@/features/techblog/components/Post";
import { blogService } from "@/features/techblog/constant";

const TechBlogPost: NextPage<Props> = ({ meta, headings, compiledMarkdown }) => {
  return (
    <>
      <Post headigns={headings} meta={meta} compiledMarkdown={compiledMarkdown} />
    </>
  );
};

type Props = {
  meta: PostMeta;
  headings: Headings;
  compiledMarkdown: string;
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params }) => {
  const post = await blogService.repo.retrive(params!.uuid);

  if (!post) {
    throw `${params?.id} is not found`;
  }

  return {
    props: { meta: post.meta, headings: post.headings, compiledMarkdown: post.compiledMarkdown },
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
