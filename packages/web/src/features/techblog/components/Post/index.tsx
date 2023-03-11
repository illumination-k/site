import { Headings, PostMeta } from "common";

import PostFooter from "./Footer";
import PostHeader from "./Header";
import MdView from "./MdxView";
import RightSidebar from "./RightSidebar";

import Layout from "@/components/Layout";
import LeftSidebar from "./LeftSidebar";
import PostCard from "../PostCard";

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

export default function Post({ headings, compiledMarkdown, meta, relatedPostMeta }: PostProps) {
  return (
    <>
      <Layout
        className="bg-gray-50"
        title={meta.title}
        description={meta.description}
      >
        <h1 className="py-8 text-(4xl center) font-bold">{meta.title}</h1>
        <div className="lg:hidden flex justify-between"></div>
        <div className="px-4 md:px-6 lg:(px-0 grid grid-cols-15 justify-center)">
          <LeftSidebar className="hidden lg:(block col-span-2 sticky top-10 h-screen flex justify-end)" meta={meta} />
          <article id="post-content" className="bg-white rounded-lg px-10 py-5 mb-5 lg:col-span-9">
            <PostHeader meta={meta} />
            <MdView compiledMarkdown={compiledMarkdown} />
            <PostFooter meta={meta} />
          </article>

          <RightSidebar
            meta={meta}
            headings={headings}
            className="hidden lg:(block col-span-3 ml-8 sticky top-5 h-screen overflow-y-auto)"
          />
        </div>
        <div className="lg:(grid grid-cols-12)">
          <div></div>
          <div className="lg:col-span-10">
            <h2 className="text-(3xl center) font-bold">Read Next</h2>
            <nav className="lg:(grid grid-cols-2)">
              {relatedPostMeta.map(
                (relatedMeta, i) => <PostCard meta={relatedMeta} key={i} />,
              )}
            </nav>
          </div>
        </div>
      </Layout>
    </>
  );
}
