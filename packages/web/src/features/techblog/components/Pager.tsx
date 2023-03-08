import { ChevronLeftIcon, ChevronRightIcon, TagIcon } from "@heroicons/react/24/outline";
import { apply, tw } from "@twind/core";
import { PostMeta } from "common";
import { formatDate } from "common/utils";
import Link from "next/link";

import Tag from "./Tag";
import { PageInfomation } from "../utils/pager";

import Category from "@/icons/Category";
import { pagesPath } from "@/lib/$path";

type Props = {
  pageInformation: PageInfomation;
};

function BlogPostCard({ meta }: { meta: PostMeta }) {
  return (
    <article className="px-8 py-2 rounded-lg bg-white my-3 mx-4 border-1">
      <h2 className="font-bold text-2xl flex justify-between hover:text-blue-400">
        <Link className="border-b-2 hover:border-blue-300 px-2" href={pagesPath.techblog.post._uuid(meta.uuid).$url()}>
          {meta.title}
        </Link>
      </h2>
      <div className="px-3 pt-2 flex gap-2">
        <p className="font-bold">作成</p>
        <p>{formatDate(meta.created_at)}</p>
        <p className="font-bold">更新</p>
        <p>{formatDate(meta.updated_at)}</p>
      </div>
      <div className="px-3 flex gap-4 items-center">
        <div className="flex gap-2 py-2 items-center font-bold">
          <Category className="icon-5" />
          <Link
            className="hover:text-blue-400"
            href={pagesPath.techblog.categories._category(meta.category)._page(1).$url()}
          >
            {meta.category}
          </Link>
        </div>
        <div className="flex gap-2 py-2 items-center">
          <TagIcon className="icon-5" />
          {meta.tags.map((tag, i) => <Tag tag={tag} key={i} />)}
        </div>
      </div>

      <p className="px-2">{meta.description}</p>
    </article>
  );
}

type pageItem = number | "...";

function Pagenation({ curPage, pages }: { curPage: number; pages: number[] }) {
  let pageItems: pageItem[];
  const pageCount = pages.length;

  if (pageCount <= 10) {
    pageItems = pages;
  } else {
    throw "TODO!";
    if (curPage < 4) {
      pageItems = [1, 2, 3, 4, 5, "...", pageCount];
    } else if (curPage > pageCount - 4) {
      pageItems = [1, "...", pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
    } else {
      pageItems = [1, "...", curPage - 1, curPage, curPage + 1, "...", pageCount];
    }
  }

  return (
    <nav className="flex gap-3 items-center justify-center pb-2">
      {curPage !== 1
        ? (
          <Link href={pagesPath.techblog._page(curPage - 1).$url()}>
            <ChevronLeftIcon className="icon-6 hover:text-blue-400" />
          </Link>
        )
        : <ChevronLeftIcon className="icon-6" />}
      <div className="flex items-center gap-4">
        {pageItems.map((pageItem, i) => {
          if (pageItem === "...") {
            return <span key={i}>{pageItem}</span>;
          } else {
            return (
              <Link
                key={i}
                className={tw(apply(
                  "align-bottom hover:text-blue-400 text-2xl font-mono font-thin",
                  pageItem === curPage ? "text-blue-500" : "",
                ))}
                href={pagesPath.techblog._page(pageItem).$url()}
              >
                {pageItem}
              </Link>
            );
          }
        })}
      </div>

      {curPage !== pageCount
        ? (
          <Link href={pagesPath.techblog._page(curPage + 1).$url()}>
            <ChevronRightIcon className="icon-6 hover:text-blue-400" />
          </Link>
        )
        : <ChevronRightIcon className="icon-6" />}
    </nav>
  );
}

export default function Pager({ pageInformation }: Props) {
  const { pagePosts, curPage, pages } = pageInformation;

  return (
    <main className="lg:grid lg:grid-cols-5 bg-slate-100">
      <div></div>
      <div className="lg:col-span-3">
        {pagePosts.map((post, i) => <BlogPostCard meta={post.meta} key={i} />)}
        <Pagenation curPage={curPage} pages={pages} />
      </div>
    </main>
  );
}
