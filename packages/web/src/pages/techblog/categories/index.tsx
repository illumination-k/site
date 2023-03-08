import { dumpFile } from "@/features/techblog/constant";
import { readDump } from "common/io";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

const CategoryPage: NextPage<Props> = ({ categories }) => {
  return <>{JSON.stringify(categories)}</>;
};

type Props = {
  categories: string[];
};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  const dump = await readDump(dumpFile);

  return {
    props: {
      categories: dump.categories,
    },
  };
};

export default CategoryPage;
