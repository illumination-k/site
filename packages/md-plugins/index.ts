import rehypeKatex from "rehype-katex";

import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";

import rehypePrism from "./rehype-plugins/rehypePrism";
import { attachIdToHeadings, codeTitle } from "./remark-plugins";
import remarkDirectiveEmbedGenerator, { GithubCardTransfomer, GithubTransformer } from "./remark-plugins/embed";
import { DoiTransformer } from "./remark-plugins/embed/doi";
import { YouTubeTransformer } from "./remark-plugins/embed/youtube";

export const REMARK_PLUGINS = [
  remarkGfm,
  remarkMath,
  remarkDirective,
  attachIdToHeadings,
  codeTitle,
  remarkDirectiveEmbedGenerator([
    new GithubTransformer(),
    new GithubCardTransfomer(),
    new YouTubeTransformer(),
    new DoiTransformer(),
  ]),
  remarkMdx,
];

export const REHYPE_PLUGINS = {
  rehypeKatex,
  rehypePrism,
};
