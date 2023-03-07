import MdView from "./MdxView";

import { css } from "@twind/core";

import Nav from "@/components/Nav";
import { Headings, PostMeta } from "common";
import Footer from "./Footer";
import Header from "./Header";
import Sidebar from "./Sidebar";

import { NextSeo } from "next-seo";

type Props = {
  headigns: Headings;
  meta: PostMeta;
  compiledMarkdown: string;
};

export default function Post({ headigns, compiledMarkdown, meta }: Props) {
  return (
    <>
      <NextSeo title={meta.title} description={meta.description}></NextSeo>
      <Nav />
      <Header meta={meta} headings={headigns} />
      <div className="px-4 md:px-6 lg:px-0 lg:grid lg:grid-cols-6 lg:justify-center">
        {/* dummy cols */}
        <div></div>
        <div className="lg:col-span-4">
          <div className="lg:grid lg:grid-cols-4">
            <article className="lg:col-span-3">
              <MdView compiledMarkdown={compiledMarkdown} components={[]} />
            </article>
            <Sidebar className="hidden lg:block ml-8" meta={meta} headings={headigns} />
          </div>
        </div>
        {/* dummy cols */}
        <div></div>
      </div>
      <Footer meta={meta} />
    </>
  );
}
