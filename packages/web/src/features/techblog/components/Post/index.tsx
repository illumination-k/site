import MdView from "./MdxView";

import { css } from "@twind/core";

import { PostMeta } from "common";
import Footer from "./Footer";
import Header from "./Header";

type Props = {
  meta: PostMeta;
  compiledMarkdown: string;
};

const style = css({
  label: "markdown",
  "h1,h2,h3,h4,h5,h6": { "@apply": "font-sans px-2" },
  h1: { "@apply": "font-black text-3xl mt-2 mb-3" },
  h2: {
    "@apply": "font-black text-2xl border-b-1 border-gray-200 pb-1 mt-2 mb-2",
  },
  h3: {
    "@apply": "text-xl font-bold mb-1",
  },
  ul: { "@apply": "max-w-md text-gray-500 list-[circle] list-inside" },

  // code block
  "code[class*=\"language-\"],pre[class*=\"language-\"]": {
    "@apply": "py-1 bg-slate-50 font-mono rounded-lg break-normal whitespace-pre overflow-x-auto",
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

export default function Post({ compiledMarkdown, meta }: Props) {
  return (
    <>
      <Header meta={meta} />
      <div className={style}>
        <h1>{meta.title}</h1>
        <MdView compiledMarkdown={compiledMarkdown} components={[]} />
      </div>
      <Footer meta={meta} />
    </>
  );
}
