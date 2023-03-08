import { ParsedUrlQuery } from "querystring";

import { compile } from "@mdx-js/mdx";
import { Headings, PostMeta } from "common";
import { readDump } from "common/io";
import { REHYPE_PLUGINS, REMARK_PLUGINS } from "md-plugins";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

import Post from "@/features/techblog/components/Post";
import { blogService, dumpFile } from "@/features/techblog/constant";
import dumpRepository from "@/features/techblog/repository/dump";

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

  const compiledMarkdown = String(
    await compile(post.markdown, {
      outputFormat: "function-body",
      format: "mdx",
      development: false,
      // @ts-ignore
      remarkPlugins: REMARK_PLUGINS,
      rehypePlugins: REHYPE_PLUGINS,
    }),
  );

  return {
    props: { meta: post.meta, headings: post.headings, compiledMarkdown },
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
