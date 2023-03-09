import type { GetStaticProps, NextPage } from "next";

import { blogService } from "@/features/techblog/constant";

const CategoryPage: NextPage<Props> = ({ categories }) => {
  return <>{JSON.stringify(categories)}</>;
};

type Props = {
  locale: string;
  categories: string[];
};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  const categories = await blogService.repo.categories();
  if (!locale) throw "locale is undefined";

  return {
    props: {
      categories,
      locale,
    },
  };
};

export default CategoryPage;
