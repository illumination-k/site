import "katex/dist/katex.min.css";
import "./prisma-tokens.css";

import { css } from "@/styled-system/css";

import type { RunOptions } from "@mdx-js/mdx";
import { runSync } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";

import { CodeBlock } from "./CodeBlock";
import { Me, P5, P7, S5, S7, Seq, T7 } from "../Seq/Seq";

const style = css({
  // label: "markdown",
  "& h1,h2,h3,h4,h5,h6": {
    fontFamily: "sans",
    px: 2,
    my: 3,
    color: "text.primary",
  },
  "& h1": { fontWeight: "black", fontSize: "3xl", mt: 2, mb: 3 },
  "& h2": {
    fontWeight: "black",
    fontSize: "2xl",
    borderBottomWidth: "thin",
    borderBottomColor: "border.default",
    pb: 1,
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

  "& a": {
    color: "accent.primary",
    textDecoration: "underline",
    _hover: { color: "accent.hover" },
  },

  "& blockquote": {
    borderLeftWidth: 4,
    borderLeftColor: "accent.primary",
    bg: "bg.elevated",
    rounded: "md",
    px: 2,
    py: 1,
    my: 2,
    color: "text.secondary",
  },

  "& p": { my: 2, px: 2, color: "text.primary" },

  "& img": { my: 4, rounded: "lg" },

  // rounded table
  "& table": {
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
      "& tr": {
        bg: "table.headerBg",
        "& th": { py: 2, color: "text.primary" },
      },
      "& th:first-child": { borderTopLeftRadius: "lg" },
      "& th:last-child": { borderTopRightRadius: "lg" },
    },

    "& tbody": {
      "& tr": {
        "& td": { py: 2, color: "text.primary" },
      },
      "& tr:nth-child(even)": {
        bg: "bg.surface",
      },
      "& tr:nth-child(odd)": {
        bg: "bg.page",
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
    bg: "code.inlineBg",
    rounded: "md",
    px: 1.5,
    color: "code.inlineText",
    whiteSpace: "pre-wrap",
  },

  "& pre": {
    my: 4,
    py: 2,
    px: 0,
    bg: "code.blockBg",
    fontFamily: "mono",
    rounded: "xl",
    overflowX: "auto",
    wordBreak: "normal",
    overflowWrap: "normal",
    borderWidth: 1,
    borderColor: "border.default",
    "& code": {
      px: 0,
      bg: "code.blockBg",
      color: "text.primary",
      whiteSpace: "pre",
      wordBreak: "normal",
      overflowWrap: "normal",
      "& span.code-line": {
        px: 4,
      },
    },
  },

  // embed
  "& div.github-embed": {
    bg: "code.blockBg",
    rounded: "lg",
    borderColor: "border.default",
    borderWidth: "1",
    m: 1,
    '& code[class*="language-"], & pre[class*="language-"]': {
      my: 1,
      rounded: "unset",
      "& span.code-line": {
        px: 10,
      },
      "& span.line-number::before": {
        ml: -7,
        content: "attr(line)",
        mr: 4,
        textAlign: "right",
        color: "text.tertiary",
      },
    },
    "& a.github-embed-title": {
      fontSize: "sm",
      color: "accent.primary",
      px: 4,
      textAlign: "right",
      overflowWrap: "anywhere",
    },
  },

  // code-title
  "& div.code-title-container": {
    bg: "bg.elevated",
    rounded: "lg",
    m: 1,
    pb: 0,
    "& code, & pre": {
      roundedTop: "unset",
      "& span.code-line": {
        px: 4,
      },
    },

    "& p.code-title": {
      px: 4,
      mb: -4,
      py: 1,
      fontWeight: "bold",
      color: "accent.primary",
    },
  },

  // gh-card
  "& div.gh-card": {
    py: 2,
  },

  // math
  "& div.math-display": {
    wordBreak: "normal",
    overflowWrap: "normal",
    whiteSpace: "pre",
    overflowX: "auto",
  },
});

export interface MdViewProps {
  compiledMarkdown: string;
}

export default function MdView({ compiledMarkdown }: MdViewProps) {
  const runOptions: RunOptions = { ...runtime };
  const Content = runSync(compiledMarkdown, runOptions).default;

  return (
    <article className={style}>
      <Content components={{ Seq, P5, P7, S5, S7, T7, Me, pre: CodeBlock }} />
    </article>
  );
}
