import Link from "next/link";

import { css, cx } from "@/styled-system/css";

import type { Route } from "next";

interface TagProps {
  tag: string;
  prefix: string;
  className?: string;
}

export default function Tag({ tag, prefix, className }: TagProps) {
  let tagColor = { bg: "blue.100", _hover: { bg: "blue.500" } };

  if (tag === "archive") {
    tagColor = { bg: "yellow.100", _hover: { bg: "yellow.500" } };
  } else if (tag === "draft") {
    tagColor = { bg: "gray.100", _hover: { bg: "gray.500" } };
  }

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
        }, tagColor),
        className,
      )}
    >
      <Link href={`/${prefix}/${tag}` as Route}>
        {tag}
      </Link>
    </span>
  );
}
