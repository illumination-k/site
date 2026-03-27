import rehypeKatex from "rehype-katex";

import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";

import rehypePrism from "./rehype-plugins/rehypePrism";
import {
  DetailsDirective,
  FigureDirective,
  attachIdToHeadings,
  codeTitle,
  lintUnrenderedEmphasis,
} from "./remark-plugins";
import remarkDirectiveEmbedGenerator, {
  GithubCardTransformer,
  GithubMetaTransformer,
  GithubTransformer,
} from "./remark-plugins/embed";
import { DoiTransformer } from "./remark-plugins/embed/doi";
import { YouTubeTransformer } from "./remark-plugins/embed/youtube";

export const REMARK_PLUGINS = [
  remarkGfm,
  remarkMath,
  remarkDirective,
  attachIdToHeadings,
  codeTitle,
  DetailsDirective,
  FigureDirective,
  remarkDirectiveEmbedGenerator([
    new GithubTransformer(),
    new GithubCardTransformer(),
    new GithubMetaTransformer(),
    new YouTubeTransformer(),
    new DoiTransformer(),
  ]),
  remarkMdx,
];

export const REHYPE_PLUGINS = {
  rehypeKatex,
  rehypePrism,
};

export const REMARK_LINT_PLUGINS = [lintUnrenderedEmphasis];

export { lintUnrenderedEmphasis } from "./remark-plugins";

export { fetchWithRetry } from "./fetch";
export { cachedFetch } from "./cachedFetch";
export { getCacheKey, cacheGet, cacheSet, getDefaultCacheDir } from "./cache";
