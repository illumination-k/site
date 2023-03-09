import { ParsedUrlQuery } from "querystring";

import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

import Pager from "@/features/techblog/components/Pager";
import { blogService } from "@/features/techblog/constant";
import pager, { PageInfomation } from "@/features/techblog/utils/pager";
import { pagesPath } from "@/lib/$path";
import { Lang } from "common";

const TechBlogPage: NextPage<Props> = ({ pageInfomation, category }) => {
  return (
    <Pager
      pageInformation={pageInfomation}
      pageLinkGenerator={(page) => pagesPath.techblog.categories._category(category)._page(page).$url()}
    />
  );
};

type Props = {
  category: string;
  pageInfomation: PageInfomation;
};

export const getStaticProps: GetStaticProps<Props, Params> = async ({ params, locale }) => {
  const posts = await blogService.repo.filterPosts(locale as Lang, undefined, params?.category);

  return {
    props: {
      category: params!.category,
      pageInfomation: pager.getPageInformation(posts, Number(params!.page)),
    },
  };
};

interface Params extends ParsedUrlQuery {
  page: string;
  category: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const categories = await blogService.repo.categories();
  const langs: Lang[] = ["en", "ja"];

  const paths = (await Promise.all(langs.flatMap((lang) => {
    return categories.map(async (category) => {
      const posts = await blogService.repo.filterPosts(lang, undefined, category);

      return pager.getPages(posts).map((page) => {
        return { params: { page: page.toString(), category }, locale: lang };
      });
    });
  }))).flat();

  return {
    paths,
    fallback: false,
  };
};

export default TechBlogPage;
