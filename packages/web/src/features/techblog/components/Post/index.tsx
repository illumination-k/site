import { Headings, PostMeta } from "common";
import { NextSeo } from "next-seo";

import PostFooter from "./Footer";
import PostHeader from "./Header";
import MdView from "./MdxView";
import Sidebar from "./Sidebar";

import Layout from "@/components/Layout";
import { TwetterIntent, TwitterIcon } from "./TwetterShare";
import { pagesPath } from "@/lib/$path";

type Props = {
  headigns: Headings;
  meta: PostMeta;
  compiledMarkdown: string;
};

/*
lg: sticky-right-sidebar + content + sidebar
md: sticky-header + content
*/

export default function Post({ headigns, compiledMarkdown, meta }: Props) {
  return (
    <>
      <NextSeo title={meta.title} description={meta.description}></NextSeo>
      <Layout
        className="bg-gray-50"
        title={meta.title}
        description={meta.description}
        footerProps={{ children: <PostFooter meta={meta} /> }}
      >
        <PostHeader meta={meta} headings={headigns} />
        <div className="px-4 md:px-6 lg:px-0 lg:grid lg:grid-cols-14 lg:justify-center">
          {/* sticky sidebar */}
          <div className="hidden lg:block lg:col-span-2 sticky top-10 h-screen">
            <div className="flex justify-end mr-4">
              <TwetterIntent text={meta.title} url={`https://illumination-k.dev/techblog/post/${meta.uuid}`}>
                <TwitterIcon className="rounded-full icon-10" />
              </TwetterIntent>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-11">
            <div className="lg:grid lg:grid-cols-6">
              <article className="lg:col-span-4 bg-white rounded-lg px-10 py-5">
                <MdView compiledMarkdown={compiledMarkdown} />
              </article>
              <div className="hidden lg:block lg:col-span-2 ml-8 sticky top-5 h-screen overflow-y-auto">
                <Sidebar meta={meta} headings={headigns} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
