import { css } from "@/styled-system/css";

import type { Headings, PostMeta } from "common";

import Adsense from "@/components/Adsense";
import ArticleJsonLd from "@/components/ArticleJsonLd";
import type { Dictionary } from "@/lib/i18n";

import PostFooter from "./Footer";
import PostHeader from "./Header";
import LeftSidebar from "./LeftSidebar";
import MdView from "./MdxView";
import RightSidebar from "./RightSidebar";
import PostCard from "../PostCard";

export interface PostProps {
  headings: Headings;
  meta: PostMeta;
  prefix: string;
  relatedPostMeta: PostMeta[];
  compiledMarkdown: string;
  dict: Dictionary;
}

/*
lg: sticky-right-sidebar + content + sticky-left-sidebar
md: sticky-header + content
*/

export default function Post({
  headings,
  prefix,
  compiledMarkdown,
  meta,
  relatedPostMeta,
  dict,
}: PostProps) {
  return (
    <article
      className={css({ bg: "bg.page" })}
      // data-pagefind-body is used as a selector to construct the pagefind search index
      data-pagefind-body
    >
      <ArticleJsonLd meta={meta} prefix={prefix} />
      <h1
        className={css({
          px: { base: "4", md: "6", lg: "10" },
          py: "5",
          mb: "5",
          fontSize: { base: "2xl", md: "3xl", lg: "4xl" },
          fontWeight: "black",
          textAlign: "center",
          color: "text.primary",
        })}
      >
        {meta.title}
      </h1>
      <Adsense
        className={css({ py: 5, px: 2, md: { px: 5 }, lg: { px: 10 } })}
      />
      <div
        className={css({
          px: { base: 2, md: 4 },
          lg: {
            px: 0,
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
            gap: 2,
            justifyContent: "center",
          },
        })}
      >
        <LeftSidebar
          className={css({
            hideBelow: "md",
            lg: {
              display: "flex",
              gridColumnStart: 2,
              gridColumnEnd: 3,
              gridRow: 1,
              position: "sticky",
              top: 10,
              justifyContent: "end",
              h: "screen",
            },
          })}
          meta={meta}
        />
        <article
          id="post-content"
          className={css({
            bg: "bg.surface",
            rounded: "xl",
            px: { base: 4, md: 6, lg: 10 },
            py: 5,
            mb: 5,
            lg: { gridColumnStart: 3, gridColumnEnd: 10, gridRow: 1 },
          })}
        >
          <PostHeader meta={meta} dict={dict} />
          <MdView compiledMarkdown={compiledMarkdown} />
          <PostFooter meta={meta} dict={dict} />
        </article>

        <RightSidebar
          meta={meta}
          headings={headings}
          prefix={prefix}
          className={css({
            hideBelow: "md",
            gridRow: 1,
            lg: {
              position: "sticky",
              gridColumnStart: 10,
              gridColumnEnd: -1,
              top: 20,
              overflowY: "auto",
              h: "screen",
            },
          })}
        />
      </div>

      <Adsense
        className={css({
          m: 1,
          py: 5,
          px: 2,
          md: { px: 5 },
          lg: { px: 10 },
        })}
      />

      <h2
        className={css({
          fontSize: "2xl",
          textAlign: "center",
          fontWeight: "bold",
          color: "text.primary",
        })}
      >
        {dict.post.readNext}
      </h2>
      <nav
        className={css({
          lg: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          },
        })}
      >
        {relatedPostMeta.map((relatedMeta, i) => (
          <PostCard prefix={prefix} meta={relatedMeta} key={i} />
        ))}
      </nav>

      <Adsense
        className={css({
          py: 5,
          px: 2,
          md: { px: 5 },
          lg: { px: 10 },
        })}
      />
    </article>
  );
}
