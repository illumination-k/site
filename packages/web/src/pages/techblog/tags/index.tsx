import type { GetStaticProps, NextPage } from "next";

import { blogService } from "@/features/techblog/constant";
import Nav from "@/components/Nav";
import { TagIcon } from "@heroicons/react/24/solid";
import Tag from "@/features/techblog/components/Tag";

const TagPage: NextPage<Props> = ({ tags }) => {
  return (
    <main>
      <Nav />
      <div className="grid lg:grid-cols-3 justify-center">
        <div></div>
        <div className="px-4 md:px-2 lg:px-0">
          <h1 className="flex items-center gap-2 mt-4">
            <TagIcon className="icon-6" />
            <p className="text-3xl font-black">Tags</p>
          </h1>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <li key={i} className="flex items-center gap-2 mt-4">
                <Tag tag={tag} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
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
