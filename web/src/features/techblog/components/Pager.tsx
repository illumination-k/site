import Adsense from "@/components/Adsense";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { css } from "@/styled-system/css";
import { flex } from "@/styled-system/patterns";
import Link from "next/link";
import type { Route } from "next";

import { PageInformation } from "../utils/pager";

import PostCard from "./PostCard";

type pageItem = number | "...";

type PaginationProps = {
  curPage: number;
  pages: number[];
  pageLinkGenerator: (page: number) => Route;
};

function Pagination({ curPage, pages, pageLinkGenerator }: PaginationProps) {
  let pageItems: pageItem[];
  const pageCount = pages.length;

  if (pageCount <= 10) {
    pageItems = pages;
  } else {
    throw "TODO!";
    if (curPage < 4) {
      pageItems = [1, 2, 3, 4, 5, "...", pageCount];
    } else if (curPage > pageCount - 4) {
      pageItems = [
        1,
        "...",
        pageCount - 3,
        pageCount - 2,
        pageCount - 1,
        pageCount,
      ];
    } else {
      pageItems = [
        1,
        "...",
        curPage - 1,
        curPage,
        curPage + 1,
        "...",
        pageCount,
      ];
    }
  }

  return (
    <nav className={flex({ gap: 4, alignItems: "center", justifyContent: "center" })}>
      {curPage !== 1
        ? (
          <Link href={pageLinkGenerator(curPage - 1)}>
            <ChevronLeftIcon className={css({ h: 6, w: 6, _hover: { color: "blue.500" } })} />
          </Link>
        )
        : <ChevronLeftIcon className={css({ h: 6, w: 6 })} />}
      <div className={flex({ gap: 2, alignItems: "center" })}>
        {pageItems.map((pageItem, i) => {
          if (pageItem === "...") {
            return <span key={i}>{pageItem}</span>;
          } else {
            return (
              <Link
                key={i}
                className={
                  css(
                    {
                      alignItems: "baseline",
                      _hover: { color: "blue.400" },
                      fontSize: "2xl",
                      fontFamily: "mono",
                      fontWeight: "thin",
                    },
                    pageItem === curPage ? { color: "blue.500" } : {},
                  )
                  // tw(
                  // apply(
                  //   "align-bottom hover:text-blue-400 text-2xl font-mono font-thin",
                  //   pageItem === curPage ? "text-blue-500" : "",
                  // ),
                }
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
            <ChevronRightIcon className={css({ h: 6, w: 6, _hover: { color: "blue.500" } })} />
          </Link>
        )
        : <ChevronRightIcon className={css({ h: 6, w: 6 })} />}
    </nav>
  );
}

type PagerProps = {
  pageInformation: PageInformation;
  pageLinkGenerator: (page: number) => Route;
};

export default function Pager({
  pageInformation,
  pageLinkGenerator,
}: PagerProps) {
  const { pagePostMetas, curPage, pages } = pageInformation;

  return (
    <div className="bg-slate-50 lg:grid lg:grid-cols-5">
      <div></div>
      <div className="lg:col-span-3">
        {pagePostMetas.map((meta, i) => <PostCard meta={meta} key={i} />)}
        <Pagination
          curPage={curPage}
          pages={pages}
          pageLinkGenerator={pageLinkGenerator}
        />
        <Adsense className="mx-4" />
      </div>
    </div>
  );
}
