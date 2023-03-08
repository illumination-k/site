import Pager from "@/features/techblog/components/Pager";
import { dumpFile } from "@/features/techblog/constant";
import pager, { PageInfomation } from "@/features/techblog/utils/pager";
import { readDump } from "common/io";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { ParsedUrlQuery } from "querystring";

const TechBlogPage: NextPage<Props> = ({ pageInfomation }) => {
  return <Pager pageInformation={pageInfomation} />;
};

type Props = {
  pageInfomation: PageInfomation;
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params, locale }) => {
  const dump = await readDump(dumpFile);

  const posts = dump.posts.filter(
    (p) => p.meta.lang === locale && p.meta.tags.includes(params!.tag),
  );

  return {
    props: {
      pageInfomation: pager.getPageInformation(posts, Number(params!.page)),
    },
  };
};

interface Params extends ParsedUrlQuery {
  page: string;
  tag: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const dump = await readDump(dumpFile);
  const tags = dump.tags;

  const paths = ["ja", "en"].flatMap((lang) => {
    return tags.flatMap((tag) => {
      const posts = dump.posts.filter((post) => post.meta.tags.includes(tag) && post.meta.lang === lang);

      return pager.getPages(posts).map((page) => {
        return { params: { page: page.toString(), tag: tag }, locale: lang };
      });
    });
  });

  return {
    paths,
    fallback: false,
  };
};

export default TechBlogPage;
