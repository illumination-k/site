import { css } from "@/styled-system/css";

import type { Headings, PostMeta } from "common";

import Adsense from "@/components/Adsense";

import PostFooter from "./Footer";
import PostHeader from "./Header";
import LeftSidebar from "./LeftSidebar";
import MdView from "./MdxView";
import RightSidebar from "./RightSidebar";
import PostCard from "../PostCard";

export interface PostProps {
  headings: Headings;
  meta: PostMeta;
  relatedPostMeta: PostMeta[];
  compiledMarkdown: string;
}

/*
lg: sticky-right-sidebar + content + sticky-left-sidebar
md: sticky-header + content
*/

export default function Post({
  headings,
  compiledMarkdown,
  meta,
  relatedPostMeta,
}: PostProps) {
  return (
    <article className={css({ bg: "slate.50" })}>
      <h1
        className={css({
          px: "10",
          py: "5",
          mb: "5",
          fontSize: "4xl",
          fontWeight: "black",
          textAlign: "center",
        })}
      >
        {meta.title}
      </h1>
      <Adsense
        className={css({ py: 5, px: 2, md: { px: 5 }, lg: { px: 10 } })}
      />
      <div
        className={css({
          px: 4,
          lg: {
            px: 0,
            display: "grid",
            gridTemplateColumns: "12",
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
            bg: "white",
            px: 10,
            py: 5,
            mb: 5,
            lg: { gridColumnStart: 3, gridColumnEnd: 10, gridRow: 1 },
          })}
        >
          <PostHeader meta={meta} />
          <MdView compiledMarkdown={compiledMarkdown} />
          <PostFooter meta={meta} />
        </article>

        <RightSidebar
          meta={meta}
          headings={headings}
          className={css({
            hideBelow: "md",
            gridRow: 1,
            lg: {
              position: "sticky",
              gridColumnStart: 10,
              gridColumnEnd: -1,
              top: 5,
              overflowY: "auto",
              h: "screen",
            },
          })}
        />
      </div>

      <h2
        className={css({
          fontSize: "2xl",
          textAlign: "center",
          fontWeight: "bold",
        })}
      >
        Read Next
      </h2>
      <nav className={css({ lg: { display: "grid", gridTemplateColumns: 2 } })}>
        {relatedPostMeta.map((relatedMeta, i) => (
          <PostCard prefix="techblog" meta={relatedMeta} key={i} />
        ))}
      </nav>

      <Adsense
        className={css({
          bg: "gray.200",
          py: 5,
          px: 2,
          md: { px: 5 },
          lg: { px: 10 },
        })}
      />
    </article>
  );
}
