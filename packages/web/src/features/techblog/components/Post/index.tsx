import MdView from "./MdxView";

import { css } from "@twind/core";

import Nav from "@/components/Nav";
import { Headings, PostMeta } from "common";
import Footer from "./Footer";
import Header from "./Header";
import Sidebar from "./Sidebar";

import { NextSeo } from "next-seo";

const style = css({
  label: "markdown",
  "h1,h2,h3,h4,h5,h6": { "@apply": "font-sans px-2" },
  h1: { "@apply": "font-black text-3xl mt-2 mb-3" },
  h2: {
    "@apply": "font-black text-2xl border-b-1 border-gray-200 pb-1 mt-2 mb-2",
  },
  h3: {
    "@apply": "text-2xl font-bold mb-1",
  },

  h4: { "@apply": "font-bold text-xl mb-1" },

  ul: { "@apply": "list-disc list-inside" },

  // rounded table
  "table": {
    "@apply": "my-4 mx-1 w-full",
    "th,td": {
      "@apply": "text-left px-2",
    },
    "& thead": {
      "& tr": { "@apply": "rounded-t-lg bg-gray-200" },
      "& th:first-child": { "@apply": "rounded-tl-lg" },
      "& th:last-child": { "@apply": "rounded-tr-lg" },
    },

    "& tbody": {
      "& tr:nth-child(even)": {
        "@apply": "bg-slate-100",
      },
      "& tr:nth-child(odd)": {
        "@apply": "bg-slate-50",
      },
      "& tr:last-child": {
        "& td:first-child": { "@apply": "rounded-bl-lg" },
        "& td:last-child": { "@apply": "rounded-br-lg" },
      },
    },
  },

  // code
  "code": { "@apply": "bg-slate-50 rounded-md px-2 py-1" },

  // code block
  "code[class*=\"language-\"],pre[class*=\"language-\"]": {
    "@apply": "my-4 px-0 py-1 bg-slate-50 font-mono rounded-lg break-normal whitespace-pre overflow-x-auto",
    "& span.code-line": {
      "@apply": "px-4",
    },
  },

  // embed
  "div.github-embed": {
    "@apply": "bg-slate-200 rounded-lg border-slate-200 border-1 m-1",
    "& code[class*=\"language-\"], & pre[class*=\"language-\"]": {
      "@apply": "rounded-t-none",
      "& span.code-line": {
        "@apply": "px-10",
      },
      "& span.line-number::before": {
        "@apply": "-ml-9 content-[attr(line)] mr-4 text-right text-slate-400",
      },
    },
    "& a.github-embed-title": {
      "@apply": "px-4 py-[2px] text-sm text-blue-500 text-ellipsis overflow-hidden",
    },
  },

  // math
  "div.math-display": {
    "@apply": "break-normal whitespace-pre overflow-x-auto",
  },

  /// prisma token
  "token.namespace": { "@apply": "opacity-[.7]" },
  [
    `.token.string,
  .token.attr-value`
  ]: { "@apply": "text-[#e3116c]" },
  [
    `.token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata`
  ]: { "@apply": "text-[#999988] italic" },
  [
    `.token.entity,
    .token.url,
    .token.symbol,
    .token.number,
    .token.boolean,
    .token.variable,
    .token.constant,
    .token.property,
    .token.regex,
    .token.inserted`
  ]: { "@apply": "text-[#36acaa]" },
  [
    `.token.atrule,
    .token.keyword,
    .token.attr-name,
    .language-autohotkey .token.selector`
  ]: {
    "@apply": "text-[#00a4db]",
  },
  [
    `.token.function,
  .token.deleted,
  .language-autohotkey .token.tag`
  ]: { "@apply": "text-[#9a050f]" },
  [
    `.token.tag,
  .token.selector,
  .language-autohotkey .token.keyword`
  ]: { "@apply": "text-[#00009f]" },
  [
    `.token.important,
  .token.function,
  .token.bold`
  ]: { "@apply": "font-medium" },

  // gh-card
  "& div.gh-card": {
    "@apply": "py-2",
  },
});

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
      <div className="px-4 md:px-6 lg:px-0 lg:grid lg:grid-cols-6 lg:justify-center">
        <div></div>
        <article className="lg:col-span-3">
          <Header meta={meta} headings={headigns} />
          <article className={style}>
            <MdView compiledMarkdown={compiledMarkdown} components={[]} />
          </article>
          <Footer meta={meta} />
        </article>
        <Sidebar className="hidden lg:block" meta={meta} />
        <div></div>
      </div>
    </>
  );
}
