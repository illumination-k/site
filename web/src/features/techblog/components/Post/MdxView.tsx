import "katex/dist/katex.min.css";

import { RunOptions, runSync } from "@mdx-js/mdx";
import { css } from "@/styled-system/css";
import * as runtime from "react/jsx-runtime";

import { Me, P5, P7, S5, S7, Seq, T7 } from "../Seq/Seq";

const style = css({
  // label: "markdown",
  "& h1,h2,h3,h4,h5,h6": { fontFamily: "sans", px: 2, my: 3 },
  "& h1": { fontWeight: "black", fontSize: "3xl", mt: 2, mb: 3 },
  "& h2": {
    fontWeight: "black",
    fontSize: "2xl",
    borderBottomWidth: "thin",
    borderBottomColor: "gray.200",
    pb: 1,
    // "font-black text-2xl border-b-1 border-gray-200 pb-1",
  },
  "& h3": {
    fontWeight: "bold",
    fontSize: "xl",
  },

  "& h4": {
    fontWeight: "bold",
    fontSize: "xl",
  },
  "& h5": { fontWeight: "semibold", fontSize: "lg" },
  "& h6": { fontWeight: "semibold" },

  "& ul": {
    listStyleType: "disc",
    listStylePosition: "inside",
    my: 2,
    "& li": {
      "& ul": { listStyleType: "circle", px: 4 },
    },
  },

  "& ol": {
    listStyleType: "decimal",
    my: 2,
    px: 6,
  },

  "& a": { color: "blue.500", textDecoration: "underline" },

  "& blockquote": {
    borderLeft: 4,
    px: 2,
    py: 1,
    my: 2,
  },

  "& img": { my: 4 },

  // rounded table
  "& table": {
    // "@apply": "my-4 mx-1 w-full overflow-x-auto whitespace-pre-wrap block",
    my: 4,
    mx: 1,
    w: "full",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    display: "block",
    "& th,td": {
      px: 2,
      textAlign: "left",
    },
    "& thead": {
      "& tr": { bg: "gray.400", "& th": { py: 2 } },
      "& th:first-child": { borderTopLeftRadius: "lg" },
      "& th:last-child": { borderTopRightRadius: "lg" },
    },

    "& tbody": {
      "& tr": {
        "& td": { py: 2 },
      },
      "& tr:nth-child(even)": {
        bg: "slate.100",
      },
      "& tr:nth-child(odd)": {
        bg: "slate.50",
      },
      "& tr:last-child": {
        "& td": { pb: 3 },
        "& td:first-child": { borderBottomLeftRadius: "lg" },
        "& td:last-child": { borderBottomRightRadius: "lg" },
      },
    },
  },

  // code
  "& code": {
    // "@apply": "bg-slate-50 rounded-lg px-2 text-red-600 whitespace-pre-wrap",
    bg: "slate.50",
    rounded: "lg",
    px: 2,
    color: "red.600",
    whiteSpace: "pre-wrap",
  },

  "& pre": {
    // "@apply": "my-4 px-0 text-black py-1 bg-slate-50 font-mono rounded-lg overflow-x-auto",
    "& code": {
      // "@apply": "px-0 text-black break-normal whitespace-pre ",
      "& span.code-line": {
        px: 4,
      },
    },
  },

  // code block
  "& code[class*=\"language-\"], & pre[class*=\"language-\"]": {
    // "@apply": "my-4 px-0 text-black py-1 bg-slate-50 font-mono rounded-lg break-normal whitespace-pre overflow-x-auto",
    "& span.code-line": {
      // "@apply": "px-4",
    },
  },

  // embed
  "& div.github-embed": {
    // "@apply": "bg-slate-200 rounded-lg border-slate-200 border-1 m-1",
    "& code[class*=\"language-\"], & pre[class*=\"language-\"]": {
      // "@apply": "rounded-t-none",
      "& span.code-line": {
        // "@apply": "px-10",
      },
      "& span.line-number::before": {
        // "@apply": "-ml-9 content-[attr(line)] mr-4 text-right text-slate-400",
      },
    },
    "& a.github-embed-title": {
      // "@apply": "px-4 py-[2px] text-sm text-blue-500 overflow-hidden",
    },
  },

  // code-title
  "& div.code-title-container": {
    // "@apply": "bg-slate-200 rounded-lg m-1 pb-0",
    "& code[class*=\"language-\"], & pre[class*=\"language-\"]": {
      roundedTop: "none",
      "& span.code-line": {
        px: 4,
      },
    },

    "& p.code-title": {
      // "@apply": "px-4 -mb-4 py-1 font-bold",
    },
  },

  // gh-card
  "& div.gh-card": {
    py: 2,
  },

  // math
  "& div.math-display": {
    // "@apply": "break-normal whitespace-pre overflow-x-auto",
  },

  /// prisma tokens

  // tomlで変になるので必要。tableクラスか何かが悪さしてる？
  "& .token.class-name": {
    // "@apply": "inline"
  },
  "& .token.namespace": {},
  [
    `& .token.string,
  .token.attr-value`
  ]: {
    // "@apply": "text-[#e3116c]"
  },
  [
    `& .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata`
  ]: {
    // "@apply": "text-[#999988] italic"
  },
  [
    `& .token.entity,
    .token.url,
    .token.symbol,
    .token.number,
    .token.boolean,
    .token.variable,
    .token.constant,
    .token.property,
    .token.regex,
    .token.inserted`
  ]: {
    // "@apply": "text-[#36acaa]"
  },
  [
    `&.token.atrule,
    .token.keyword,
    .token.attr-name,
    .language-autohotkey .token.selector`
  ]: {
    // "@apply": "text-[#00a4db]",
  },
  [
    `& .token.function,
  .token.deleted,
  .language-autohotkey .token.tag`
  ]: {
    // "@apply": "text-[#9a050f]"
  },
  [
    `& .token.tag,
  .token.selector,
  .language-autohotkey .token.keyword`
  ]: {
    // "@apply": "text-[#00009f]"
  },
  [
    `& .token.important,
  .token.function,
  .token.bold`
  ]: {
    fontWeight: "medium",
  },
});

export type MdViewProps = {
  compiledMarkdown: string;
};

export default function MdView({ compiledMarkdown }: MdViewProps) {
  // https://github.com/mdx-js/mdx/issues/2463
  // @ts-expect-error
  const runOptions: RunOptions = { ...runtime };
  const Content = runSync(compiledMarkdown, runOptions).default;

  return (
    <article className={style}>
      <Content components={{ Seq, P5, P7, S5, S7, T7, Me }} />
    </article>
  );
}
