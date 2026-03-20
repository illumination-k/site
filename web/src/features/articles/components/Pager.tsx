// import Adsense from "@/components/Adsense";
import Link from "next/link";

import { css } from "@/styled-system/css";
import { flex } from "@/styled-system/patterns";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { Route } from "next";

import PostCard from "./PostCard";
import type { PageInformation } from "../utils/pager";

type pageItem = number | "...";

interface PaginationProps {
  curPage: number;
  pages: number[];
  pageLinkGenerator: (page: number) => Route;
}

function Pagination({ curPage, pages, pageLinkGenerator }: PaginationProps) {
  let pageItems: pageItem[];
  const pageCount = pages.length;

  if (pageCount <= 10) {
    pageItems = pages;
  } else {
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
    <nav
      className={flex({
        gap: 4,
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      })}
    >
      {curPage !== 1 ? (
        <Link href={pageLinkGenerator(curPage - 1)}>
          <ChevronLeftIcon
            className={css({
              h: 6,
              w: 6,
              color: "text.tertiary",
              _hover: { color: "accent.primary" },
            })}
          />
        </Link>
      ) : (
        <ChevronLeftIcon
          className={css({ h: 6, w: 6, color: "text.tertiary" })}
        />
      )}
      <div className={flex({ gap: 2, alignItems: "center" })}>
        {pageItems.map((pageItem, i) => {
          if (pageItem === "...") {
            return (
              <span key={i} className={css({ color: "text.tertiary" })}>
                {pageItem}
              </span>
            );
          } else {
            return (
              <Link
                key={i}
                className={css(
                  {
                    alignItems: "baseline",
                    color: "text.secondary",
                    _hover: { color: "accent.primary" },
                    fontSize: "2xl",
                    fontFamily: "mono",
                    fontWeight: "thin",
                    transition: "colors",
                    transitionDuration: "fast",
                  },
                  pageItem === curPage
                    ? { color: "accent.primary", fontWeight: "bold" }
                    : {},
                )}
                href={pageLinkGenerator(pageItem)}
              >
                {pageItem}
              </Link>
            );
          }
        })}
      </div>

      {curPage !== pageCount ? (
        <Link href={pageLinkGenerator(curPage + 1)}>
          <ChevronRightIcon
            className={css({
              h: 6,
              w: 6,
              color: "text.tertiary",
              _hover: { color: "accent.primary" },
            })}
          />
        </Link>
      ) : (
        <ChevronRightIcon
          className={css({ h: 6, w: 6, color: "text.tertiary" })}
        />
      )}
    </nav>
  );
}

interface PagerProps {
  prefix: string;
  pageInformation: PageInformation;
  pageLinkGenerator: (page: number) => Route;
  className?: string;
}

export default function Pager({
  prefix,
  pageInformation,
  pageLinkGenerator,
  className,
}: PagerProps) {
  const { pagePostMetas, curPage, pages } = pageInformation;

  return (
    <div className={className}>
      {pagePostMetas.map((meta, i) => (
        <PostCard prefix={prefix} meta={meta} key={i} />
      ))}
      <Pagination
        curPage={curPage}
        pages={pages}
        pageLinkGenerator={pageLinkGenerator}
      />
    </div>
  );
}
