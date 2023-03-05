import { compile } from "@mdx-js/mdx";
import type { NextPage } from "next";
import Head from "next/head";

// import MdView from "@/client/post/components/MdView";
import { REHYPE_PLUGINS, REMARK_PLUGINS } from "md-plugins";

import { run, runSync } from "@mdx-js/mdx";
import { Fragment, useEffect, useState } from "react";
import * as runtime from "react/jsx-runtime";

import "prismjs/themes/prism-twilight.css";
import { tw, css } from "@twind/core";

export type MdViewProps = {
  compiledMarkdown: string;
  components: JSX.Element[];
};

function MdView({ compiledMarkdown, components }: MdViewProps) {
  const Content = runSync(compiledMarkdown, runtime).default;

  return <Content />;
}

const Home: NextPage<{ compiledMarkdown: string }> = ({ compiledMarkdown }) => {
  const style = css({
    label: "main",
    "& h1": {
      "@apply": "text-3xl text-red-500",
    },
    "& a.github-embed-title": {
      "@apply": "px-4 text-lg text-blue-500 w-full bg-slate-100 rounded-lg",
    },
    "& pre": {
      "@apply": "mt-0",
    },
    "& span.code-line": {
      "@apply": "px-10",
    },
    "& span.line-number::before": {
      "@apply": "-ml-10 content-[attr(line)] mr-4 text-right text-slate-400",
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
## Import refractor and register lang

We should import refractor and register langs as following:

https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15
`;

  const compiledMarkdown = String(
    await compile(t, {
      outputFormat: "function-body",
      format: "mdx",
      development: false,
      remarkPlugins: REMARK_PLUGINS,
      rehypePlugins: REHYPE_PLUGINS,
    })
  );
  return { props: { compiledMarkdown } };
}

export default Home;
