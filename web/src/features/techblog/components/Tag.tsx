import Link from "next/link";

import { css, cx } from "@/styled-system/css";

import type { Route } from "next";

interface TagProps {
  tag: string;
  prefix: string;
  className?: string;
}

export default function Tag({ tag, prefix, className }: TagProps) {
  const tagColor = { bg: "blue.100", _hover: { bg: "blue.500" } };

  return (
    <span
      className={cx(
        css({
          borderRadius: "3xl",
          fontWeight: "bold",
          px: 4,
          py: 1,
          fontFamily: "sans",
          _hover: { color: "white" },
        }),
        css(tagColor),
        className,
      )}
    >
      <Link href={`/${prefix}/tag/${tag}/1` as Route}>{tag}</Link>
    </span>
  );
}
