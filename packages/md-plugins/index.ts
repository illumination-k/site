import rehypeKatex from "rehype-katex";

import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";

import rehypePrism from "./rehype-plugins/rehypePrism";
import { attachIdToHeadings } from "./remark-plugins";
import remarkDirectiveEmbedGenerator, { GithubCardTransfomer, GithubTransformer } from "./remark-plugins/embed";

export const REMARK_PLUGINS = [
  remarkGfm,
  remarkMath,
  remarkDirective,
  attachIdToHeadings,
  remarkDirectiveEmbedGenerator([new GithubTransformer(), new GithubCardTransfomer()]),
  remarkMdx,
];

export const REHYPE_PLUGINS = [
  rehypeKatex,
  rehypePrism,
];
