import { Headings, PostMeta } from "common";
import { NextSeo } from "next-seo";

import Footer from "./Footer";
import Header from "./Header";
import MdView from "./MdxView";
import Sidebar from "./Sidebar";

import Nav from "@/components/Nav";

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
      <Nav />
      <main className="bg-gray-50">
        <Header meta={meta} headings={headigns} />
        <div className="px-4 md:px-6 lg:px-0 lg:grid lg:grid-cols-14 lg:justify-center">
          {/* dummy cols */}
          <div className="lg:col-span-2"></div>
          <div className="lg:col-span-11">
            <div className="lg:grid lg:grid-cols-6">
              <article className="lg:col-span-4 bg-white rounded-lg px-10 py-5">
                <MdView compiledMarkdown={compiledMarkdown} components={[]} />
              </article>
              <div className="hidden lg:block ml-8 sticky top-5 h-screen lg:col-span-2">
                <Sidebar meta={meta} headings={headigns} />
              </div>
            </div>
          </div>
        </div>
        <Footer meta={meta} />
      </main>
    </>
  );
}
