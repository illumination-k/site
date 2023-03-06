import { compile } from "@mdx-js/mdx";
import { ParsedUrlQuery } from "querystring";

import { PostMeta } from "common";
import { readDump } from "common/io";

import { REHYPE_PLUGINS, REMARK_PLUGINS } from "md-plugins";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

import MdView from "@/features/techblog/components/Post/MdxView";

const TechBlogPost: NextPage<Props> = ({ meta, compiledMarkdown }) => {
  return <></>;
};

type Props = {
  meta: PostMeta;
  compiledMarkdown: string;
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params }) => {
  const dump = await readDump(".");
  const post = dump.posts.filter((p) => p.meta.uuid === params?.id).pop();

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
    props: { meta: post.meta, compiledMarkdown },
  };
};

interface Params extends ParsedUrlQuery {
  id: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  return {
    paths: [{ params: { id: "1" } }],
    fallback: false,
  };
};

export default TechBlogPost;
