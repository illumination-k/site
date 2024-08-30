import { Headings, PostMeta } from "common";

import PostFooter from "./Footer";
import PostHeader from "./Header";
import MdView from "./MdxView";
import RightSidebar from "./RightSidebar";

import { css } from "@/styled-system/css";
import LeftSidebar from "./LeftSidebar";
import PostCard from "../PostCard";
import Adsense from "@/components/Adsense";

export type PostProps = {
  headings: Headings;
  meta: PostMeta;
  relatedPostMeta: PostMeta[];
  compiledMarkdown: string;
};

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
    <article className={css({bg: "slate.50"})}>
      <h1
        className={css({
          px: "10",
          py: "5",
          mb: "5",
        })}
      >
        {meta.title}
      </h1>
      <Adsense className="pb-5 px-2 md:px-5 lg:px-20" />
      <div
        className={css({
          px: 4,
          lg: { px: 0, display: "grid", gridTemplateColumns: "12", gap: 1, justifyContent: "center" },
        })}
      >
        <LeftSidebar
          className={css({
            hideBelow: "md",
            lg: {
              display: "flex",
              gridColumnStart: 2,
              gridColumnEnd: 3,
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
          className={css({ bg: "white", px: 10, py: 5, mb: 5, lg: { gridColumnStart: 3, gridColumnEnd: 10 } })}
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
            lg: { position: "sticky", gridColumnStart: 10, gridColumnEnd: -1, top: 5, overflowY: "auto", h: "screen" },
          })}
        />
      </div>
      <div className="lg:(grid grid-cols-12)">
        <div></div>
        <div className="lg:col-span-10">
          <h2 className={css({ fontSize: "2xl", textAlign: "center", fontWeight: "bold" })}>Read Next</h2>
          <nav className="lg:(grid grid-cols-2)">
            {relatedPostMeta.map((relatedMeta, i) => <PostCard meta={relatedMeta} key={i} />)}
          </nav>
        </div>
      </div>

      <Adsense className="pb-5 px-2 md:px-5 lg:px-20" />
    </article>
  );
}
