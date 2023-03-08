import type { GetStaticProps, NextPage } from "next";

import { blogService } from "@/features/techblog/constant";

const TagPage: NextPage<Props> = ({ tags }) => {
  return <>{JSON.stringify(tags)}</>;
};

type Props = {
  locale: string;
  tags: string[];
};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  const tags = await blogService.repo.tags();
  if (!locale) throw "locale is undefined";

  return {
    props: {
      tags,
      locale,
    },
  };
};

export default TagPage;
