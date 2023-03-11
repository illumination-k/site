import { ParsedUrlQuery } from "querystring";

import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

import Pager from "@/features/techblog/components/Pager";
import { blogService } from "@/features/techblog/constant";
import pager, { PageInfomation } from "@/features/techblog/utils/pager";
import { pagesPath } from "@/lib/$path";
import { Lang } from "common";
import Layout from "@/components/Layout";

const TechBlogPage: NextPage<Props> = ({ pageInfomation }) => {
  return (
    <Layout title={`illumination-k.dev techblog page-${pageInfomation.curPage}`} description={"Pager of Techblog"}>
      <Pager pageInformation={pageInfomation} pageLinkGenerator={(page) => pagesPath.techblog._page(page).$url()} />;
    </Layout>
  );
};

type Props = {
  pageInfomation: PageInfomation;
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params, locale }) => {
  const posts = await blogService.repo.filterPosts(locale as Lang);

  return {
    props: {
      pageInfomation: pager.getPageInformation(posts.map((p) => p.meta), Number(params!.page)),
    },
  };
};

interface Params extends ParsedUrlQuery {
  page: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const langs: Lang[] = ["en", "ja"];

  const paths = (await Promise.all(langs.map(async (lang) => {
    const posts = await blogService.repo.filterPosts(lang);

    return pager.getPages(posts.map((p) => p.meta)).map((page) => {
      return { params: { page: page.toString() }, locale: lang };
    });
  }))).flat();

  return {
    paths,
    fallback: false,
  };
};

export default TechBlogPage;
