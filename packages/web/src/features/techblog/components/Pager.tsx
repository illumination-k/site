import Adsense from "@/components/Adsense";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { apply, tw } from "@twind/core";
import Link from "next/link";

import { PageInfomation } from "../utils/pager";

import PostCard from "./PostCard";

type pageItem = number | "...";

type PagenationProps = {
  curPage: number;
  pages: number[];
  pageLinkGenerator: (
    page: number,
  ) => { pathname: string; query: { [key: string]: number | string }; hash: string | undefined };
};

function Pagenation({ curPage, pages, pageLinkGenerator }: PagenationProps) {
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
          <Link href={pageLinkGenerator(curPage - 1)}>
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
                href={pageLinkGenerator(pageItem)}
              >
                {pageItem}
              </Link>
            );
          }
        })}
      </div>

      {curPage !== pageCount
        ? (
          <Link href={pageLinkGenerator(curPage + 1)}>
            <ChevronRightIcon className="icon-6 hover:text-blue-400" />
          </Link>
        )
        : <ChevronRightIcon className="icon-6" />}
    </nav>
  );
}

type PagerProps = {
  pageInformation: PageInfomation;
  pageLinkGenerator: (
    page: number,
  ) => { pathname: string; query: { [key: string]: number | string }; hash: string | undefined };
};

export default function Pager({ pageInformation, pageLinkGenerator }: PagerProps) {
  const { pagePostMetas, curPage, pages } = pageInformation;

  return (
    <div className="bg-slate-50 lg:grid lg:grid-cols-5">
      <div></div>
      <div className="lg:col-span-3">
        {pagePostMetas.map((meta, i) => <PostCard meta={meta} key={i} />)}
        <Pagenation curPage={curPage} pages={pages} pageLinkGenerator={pageLinkGenerator} />
        <Adsense className="mx-4" />
      </div>
    </div>
  );
}
