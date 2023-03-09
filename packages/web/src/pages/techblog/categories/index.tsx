import type { GetStaticProps, NextPage } from "next";

import { blogService } from "@/features/techblog/constant";
import Nav from "@/components/Nav";
import Category from "@/icons/Category";
import Link from "next/link";
import { pagesPath } from "@/lib/$path";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

const CategoryPage: NextPage<Props> = ({ categories }) => {
  return (
    <main>
      <Nav />
      <div className="grid lg:grid-cols-3 justify-center">
        <div></div>
        <div>
          <h1 className="flex items-center gap-2 mt-4">
            <Category className="icon-6" />
            <p className="text-3xl font-black">Category</p>
          </h1>
          <ul>
            {categories.map((category, i) => (
              <li key={i} className="flex items-center gap-2 mt-4">
                <ChevronRightIcon className="icon-6" />
                <Link
                  className="text-xl font-semibold hover:text-blue-400"
                  href={pagesPath.techblog.categories._category(category)._page(1).$url()}
                >
                  {category}
                </Link>
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
