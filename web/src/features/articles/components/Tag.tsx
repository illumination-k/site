import Link from "next/link";

import { css, cx } from "@/styled-system/css";

import type { Route } from "next";

interface TagProps {
  tag: string;
  prefix: string;
  className?: string;
}

export default function Tag({ tag, prefix, className }: TagProps) {
  return (
    <span
      className={cx(
        css({
          borderRadius: "full",
          fontWeight: "medium",
          fontSize: "xs",
          px: 3,
          py: 0.5,
          fontFamily: "sans",
          bg: "tag.bg",
          color: "tag.text",
          transition: "all",
          transitionDuration: "fast",
          _hover: { bg: "accent.primary", color: "tag.hoverText" },
        }),
        className,
      )}
    >
      <Link href={`/${prefix}/tag/${tag}/1` as Route}>{tag}</Link>
    </span>
  );
}
