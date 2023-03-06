import { compile } from "@mdx-js/mdx";
import type { NextPage } from "next";
import Head from "next/head";

import { REHYPE_PLUGINS, REMARK_PLUGINS } from "md-plugins";
import "katex/dist/katex.min.css";

import { runSync } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";

import { css } from "@twind/core";

export type MdViewProps = {
  compiledMarkdown: string;
  components: JSX.Element[];
};

function MdView({ compiledMarkdown, components }: MdViewProps) {
  const Content = runSync(compiledMarkdown, runtime).default;

  return <Content components={components} />;
}

const Home: NextPage<{ compiledMarkdown: string }> = ({ compiledMarkdown }) => {
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
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={style}>
        <h1>title</h1>
        <MdView compiledMarkdown={compiledMarkdown} components={[]} />
      </main>
    </>
  );
};

export async function getStaticProps() {
  const t = `# Refractor

## List

- 1
- 2
  - 3

## TaskList

- [x] b
- [ ] c

|a|b|
|---|---|
|t|t|

## Math

$\\sum_{a}^{b}$

## Code

We should import refractor and register langs as following:

\`\`\`js
console.log('test')
\`\`\`

::gh[https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15]

::gh-card[illumination-k/blog-remark]
`;

  const compiledMarkdown = String(
    await compile(t, {
      outputFormat: "function-body",
      format: "mdx",
      development: false,
      // @ts-ignore
      remarkPlugins: REMARK_PLUGINS,
      rehypePlugins: REHYPE_PLUGINS,
    }),
  );
  return { props: { compiledMarkdown } };
}

export default Home;
