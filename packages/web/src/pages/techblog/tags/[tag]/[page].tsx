import { ParsedUrlQuery } from "querystring";

import { Lang } from "common";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

import Pager from "@/features/techblog/components/Pager";
import { blogService } from "@/features/techblog/constant";
import pager, { PageInfomation } from "@/features/techblog/utils/pager";
import { pagesPath } from "@/lib/$path";
import Layout from "@/components/Layout";

const TechBlogPage: NextPage<Props> = ({ pageInfomation, tag }) => {
  return (
    <Layout
      title={`illumination-k.dev techblog:${tag} page-${pageInfomation.curPage}`}
      description={`Pager of techblog:${tag}`}
    >
      <Pager
        pageInformation={pageInfomation}
        pageLinkGenerator={(page) => pagesPath.techblog.tags._tag(tag)._page(page).$url()}
      />
    </Layout>
  );
};

type Props = {
  tag: string;
  pageInfomation: PageInfomation;
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params, locale }) => {
  const posts = await blogService.repo.filterPosts(locale as Lang, params!.tag, undefined);

  return {
    props: {
      tag: params!.tag,
      pageInfomation: pager.getPageInformation(posts, Number(params!.page)),
    },
  };
};

interface Params extends ParsedUrlQuery {
  page: string;
  tag: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const tags = await blogService.repo.tags();
  const langs: Lang[] = ["en", "ja"];

  const paths = (await Promise.all(langs.flatMap((lang) => {
    return tags.map(async (tag) => {
      const posts = await blogService.repo.filterPosts(lang, tag, undefined);

      return pager.getPages(posts).map((page) => {
        return { params: { page: page.toString(), tag: tag }, locale: lang };
      });
    });
  }))).flat();

  return {
    paths,
    fallback: false,
  };
};

export default TechBlogPage;
